// =============================================================================
// Email Sequences API Route
// =============================================================================
// Manage email sequence timing settings for each organization

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to get current user's organization ID
async function getOrganizationId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

// Default sequence settings
const DEFAULT_SETTINGS = {
  dunning_enabled: true,
  dunning_1_days: 0,
  dunning_2_days: 3,
  dunning_3_days: 7,
  dunning_4_days: 10,
  cancel_save_enabled: true,
  cancel_save_1_days: 1,
  cancel_save_2_days: 3,
  winback_enabled: true,
  winback_1_days: 14,
  winback_2_days: 30,
  winback_3_days: 60,
  goodbye_enabled: true,
};

// GET: Retrieve sequence settings
export async function GET() {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    const supabase = getServerSupabase();
    const { data: settings, error } = await (supabase as ReturnType<typeof getServerSupabase>)
      .from('email_sequences')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error);
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    return NextResponse.json({
      settings: settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS,
    });
  } catch (error) {
    console.error('Email Sequences GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST: Update sequence settings
export async function POST(request: NextRequest) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = getServerSupabase();

    // Check if settings exist
    const { data: existing } = await (supabase as ReturnType<typeof getServerSupabase>)
      .from('email_sequences')
      .select('id')
      .eq('organization_id', orgId)
      .single();

    const settingsData = {
      dunning_enabled: body.dunning_enabled ?? DEFAULT_SETTINGS.dunning_enabled,
      dunning_1_days: body.dunning_1_days ?? DEFAULT_SETTINGS.dunning_1_days,
      dunning_2_days: body.dunning_2_days ?? DEFAULT_SETTINGS.dunning_2_days,
      dunning_3_days: body.dunning_3_days ?? DEFAULT_SETTINGS.dunning_3_days,
      dunning_4_days: body.dunning_4_days ?? DEFAULT_SETTINGS.dunning_4_days,
      cancel_save_enabled: body.cancel_save_enabled ?? DEFAULT_SETTINGS.cancel_save_enabled,
      cancel_save_1_days: body.cancel_save_1_days ?? DEFAULT_SETTINGS.cancel_save_1_days,
      cancel_save_2_days: body.cancel_save_2_days ?? DEFAULT_SETTINGS.cancel_save_2_days,
      winback_enabled: body.winback_enabled ?? DEFAULT_SETTINGS.winback_enabled,
      winback_1_days: body.winback_1_days ?? DEFAULT_SETTINGS.winback_1_days,
      winback_2_days: body.winback_2_days ?? DEFAULT_SETTINGS.winback_2_days,
      winback_3_days: body.winback_3_days ?? DEFAULT_SETTINGS.winback_3_days,
      goodbye_enabled: body.goodbye_enabled ?? DEFAULT_SETTINGS.goodbye_enabled,
    };

    if (existing) {
      // Update existing settings
      const { data, error } = await (supabase as ReturnType<typeof getServerSupabase>)
        .from('email_sequences')
        .update(settingsData)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }

      return NextResponse.json({ success: true, settings: data });
    } else {
      // Insert new settings
      const { data, error } = await (supabase as ReturnType<typeof getServerSupabase>)
        .from('email_sequences')
        .insert({
          organization_id: orgId,
          ...settingsData,
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
      }

      return NextResponse.json({ success: true, settings: data });
    }
  } catch (error) {
    console.error('Email Sequences POST error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
