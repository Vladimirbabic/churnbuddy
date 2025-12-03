// Supabase client configuration
// This module provides both client-side and server-side Supabase clients

import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not configured. Running in demo mode.'
  );
}

/**
 * Client-side Supabase client
 * Uses createBrowserClient from @supabase/ssr to properly handle cookies
 * This ensures the session is stored in cookies (not just localStorage)
 * so that server-side API routes can access the authenticated user
 */
export const supabase = createBrowserClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Server-side Supabase client with service role
 * Bypasses RLS - use only in API routes and server components
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Get a Supabase client for server-side operations
 * Falls back to regular client if service key not available
 */
export function getServerSupabase(): ReturnType<typeof createClient<Database>> {
  return supabaseAdmin || supabase;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');
}

export default supabase;
