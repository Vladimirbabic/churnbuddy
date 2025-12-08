// =============================================================================
// Admin Utilities
// =============================================================================
// Functions to check admin status and permissions

import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.is_admin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get the current user's ID from Supabase auth
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: { user } } = await (supabase as any).auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }
  return isUserAdmin(userId);
}

/**
 * Get admin user profile
 */
export async function getAdminProfile(userId: string): Promise<{
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
} | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .select('id, email, full_name, is_admin')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting admin profile:', error);
    return null;
  }
}
