// =============================================================================
// CSRF Protection Utility
// =============================================================================
// Provides CSRF token generation and validation for state-changing operations

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a CSRF token from cookies
 */
export async function getOrCreateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!token) {
    token = generateToken();
    // Note: Setting cookies in server components requires the response
    // This function should be called in routes that can set cookies
  }

  return token;
}

/**
 * Set CSRF token cookie in response
 */
export function setCsrfCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
  return response;
}

/**
 * Validate CSRF token from request
 * Returns true if valid, false otherwise
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  // Both tokens must exist and match
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Use timing-safe comparison
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * CSRF protection middleware for API routes
 * Use this for state-changing operations (POST, PUT, PATCH, DELETE)
 */
export async function requireCsrf(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF for non-state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return handler();
  }

  // Skip CSRF for webhook endpoints (they use signature verification instead)
  if (request.nextUrl.pathname.includes('/webhook')) {
    return handler();
  }

  // Skip CSRF for public API endpoints (they use other protections)
  // These are accessed from external embed scripts
  if (
    request.nextUrl.pathname.includes('/api/cancel-flow') ||
    request.nextUrl.pathname.includes('/api/flow-config')
  ) {
    return handler();
  }

  // Validate CSRF token
  const isValid = await validateCsrfToken(request);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    );
  }

  return handler();
}

/**
 * API endpoint to get a new CSRF token
 * Frontend should call this and include the token in subsequent requests
 */
export async function handleCsrfTokenRequest(): Promise<NextResponse> {
  const token = generateToken();
  const response = NextResponse.json({ token });
  return setCsrfCookie(response, token);
}
