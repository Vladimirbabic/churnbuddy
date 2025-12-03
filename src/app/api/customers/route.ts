// =============================================================================
// Customers API Route
// =============================================================================
// Returns customer data from Stripe
// Requires authentication - no demo mode.

import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // TODO: Fetch customers from Stripe using stored credentials
    // const settings = await getSettings(orgId);
    // const stripe = new Stripe(settings.stripe.secretKey);
    // const customers = await stripe.customers.list();

    return NextResponse.json({
      customers: [],
    });
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
