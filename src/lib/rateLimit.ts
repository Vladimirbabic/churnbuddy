// =============================================================================
// Rate Limiting Utility
// =============================================================================
// Simple in-memory rate limiting for API endpoints
// For production, consider using Redis-based rate limiting (e.g., @upstash/ratelimit)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (note: this resets on server restart and doesn't work across instances)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for a given identifier
 * @param identifier - Unique identifier (e.g., IP address, user ID, or API key)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = rateLimitStore.get(key);

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Check various headers that might contain the real IP
  const headers = request.headers;

  // Vercel/Cloudflare headers
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp;

  // X-Forwarded-For can contain multiple IPs, take the first one
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips[0]) return ips[0];
  }

  // Fallback
  return 'unknown';
}

// Pre-configured rate limits
export const RATE_LIMITS = {
  // Public endpoints (flow-config, cancel-flow)
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute per IP
  },
  // Email lookup (more restrictive to prevent enumeration)
  emailLookup: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 lookups per minute per IP
  },
  // Discount application (very restrictive)
  discountApply: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 discount applications per hour per IP
  },
  // Settings API (authenticated, but still limited)
  settings: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
} as const;
