import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
  }

  // Check for admin secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (secret !== 'run-churn-intelligence-migration') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Create customer_events table
    const { error: eventsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.customer_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          customer_email TEXT,
          event_name TEXT NOT NULL,
          event_properties JSONB DEFAULT '{}',
          occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_customer_events_org_customer
          ON public.customer_events(organization_id, customer_id);
        CREATE INDEX IF NOT EXISTS idx_customer_events_org_event
          ON public.customer_events(organization_id, event_name);
        CREATE INDEX IF NOT EXISTS idx_customer_events_org_occurred
          ON public.customer_events(organization_id, occurred_at DESC);
        CREATE INDEX IF NOT EXISTS idx_customer_events_occurred
          ON public.customer_events(occurred_at DESC);

        ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
      `
    });

    if (eventsError) {
      console.error('Error creating customer_events:', eventsError);
    }

    // Create customer_health_snapshots table
    const { error: snapshotsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.customer_health_snapshots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          customer_email TEXT,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          logins_last_7d INTEGER NOT NULL DEFAULT 0,
          logins_prev_7d INTEGER NOT NULL DEFAULT 0,
          core_actions_last_7d INTEGER NOT NULL DEFAULT 0,
          core_actions_prev_7d INTEGER NOT NULL DEFAULT 0,
          active_users_last_7d INTEGER NOT NULL DEFAULT 0,
          seats_dropped_last_30d INTEGER NOT NULL DEFAULT 0,
          risk_score INTEGER NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
          risk_bucket TEXT NOT NULL DEFAULT 'healthy' CHECK (risk_bucket IN ('healthy', 'watch', 'at_risk')),
          bucket_changed_from TEXT CHECK (bucket_changed_from IS NULL OR bucket_changed_from IN ('healthy', 'watch', 'at_risk')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT unique_customer_date UNIQUE (organization_id, customer_id, date)
        );

        CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_bucket
          ON public.customer_health_snapshots(organization_id, risk_bucket);
        CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_date
          ON public.customer_health_snapshots(organization_id, date DESC);
        CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_customer_date
          ON public.customer_health_snapshots(organization_id, customer_id, date DESC);
        CREATE INDEX IF NOT EXISTS idx_health_snapshots_risk_score
          ON public.customer_health_snapshots(organization_id, risk_score DESC);

        ALTER TABLE public.customer_health_snapshots ENABLE ROW LEVEL SECURITY;
      `
    });

    if (snapshotsError) {
      console.error('Error creating customer_health_snapshots:', snapshotsError);
    }

    // Test if tables exist now
    const { data: eventsTest, error: et } = await supabase.from('customer_events').select('*').limit(1);
    const { data: snapshotsTest, error: st } = await supabase.from('customer_health_snapshots').select('*').limit(1);

    return NextResponse.json({
      success: true,
      results: {
        customer_events: et ? { error: et.message } : { created: true },
        customer_health_snapshots: st ? { error: st.message } : { created: true }
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
