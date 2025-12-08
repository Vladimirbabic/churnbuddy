// =============================================================================
// Email Logs API Route
// =============================================================================
// Returns a list of all emails sent by the organization.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper to get authenticated supabase client and user's organization ID
async function getAuthenticatedClient() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
    const { data: { user } } = await supabase.auth.getUser();
    return { supabase, orgId: user?.id || null };
  } catch {
    return { supabase: null, orgId: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, orgId } = await getAuthenticatedClient();
    if (!orgId || !supabase) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const templateType = searchParams.get('template_type');
    const customerId = searchParams.get('customer_id');

    // Build the query
    let query = supabase
      .from('email_sends')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .order('sent_at', { ascending: false });

    // Apply filters
    if (templateType) {
      query = query.eq('template_type', templateType);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: emails, error, count } = await query;

    if (error) {
      console.error('Failed to fetch email logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email logs' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedEmails = (emails || []).map((email: {
      id: string;
      template_type: string;
      customer_id: string;
      customer_email: string;
      resend_message_id: string | null;
      sent_at: string;
      opened_at: string | null;
      clicked_at: string | null;
      subscription_id: string | null;
      invoice_id: string | null;
      created_at: string;
    }) => ({
      id: email.id,
      templateType: email.template_type,
      customerId: email.customer_id,
      customerEmail: email.customer_email,
      messageId: email.resend_message_id,
      sentAt: email.sent_at,
      openedAt: email.opened_at,
      clickedAt: email.clicked_at,
      subscriptionId: email.subscription_id,
      invoiceId: email.invoice_id,
      status: email.clicked_at ? 'clicked' : email.opened_at ? 'opened' : 'sent',
    }));

    return NextResponse.json({
      emails: formattedEmails,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Email logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email logs' },
      { status: 500 }
    );
  }
}
