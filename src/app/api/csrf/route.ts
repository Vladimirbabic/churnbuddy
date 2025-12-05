// =============================================================================
// CSRF Token API
// =============================================================================
// Provides CSRF tokens for frontend requests

import { handleCsrfTokenRequest } from '@/lib/csrf';

export async function GET() {
  return handleCsrfTokenRequest();
}
