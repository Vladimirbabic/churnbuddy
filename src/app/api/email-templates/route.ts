// =============================================================================
// Email Templates API Route
// =============================================================================
// CRUD operations for email templates
// Uses Supabase for data persistence
// Requires authentication - no demo mode.

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

// Default templates for demo mode
const DEFAULT_TEMPLATES = [
  {
    id: '1',
    type: 'payment_failed',
    name: 'Payment Failed - First Notice',
    subject: 'Action Required: Your payment failed',
    body: `Hi {{customer_name}},

We noticed that your payment of {{amount}} for your subscription failed.

This can happen for several reasons:
- Your card may have expired
- Insufficient funds
- Your bank may have declined the transaction

Please update your payment method to continue enjoying our service:

{{update_payment_link}}

If you have any questions, just reply to this email and we'll help you out.

Best,
{{company_name}} Team`,
    is_active: true,
    variables: ['customer_name', 'amount', 'update_payment_link', 'company_name'],
  },
  {
    id: '2',
    type: 'payment_reminder',
    name: 'Payment Reminder - Final Notice',
    subject: 'Final Notice: Your subscription will be canceled',
    body: `Hi {{customer_name}},

This is a final reminder that your payment of {{amount}} is still outstanding.

Your subscription will be canceled in {{days_remaining}} days if payment is not received.

Update your payment method now:

{{update_payment_link}}

We'd hate to see you go!

Best,
{{company_name}} Team`,
    is_active: true,
    variables: ['customer_name', 'amount', 'days_remaining', 'update_payment_link', 'company_name'],
  },
  {
    id: '3',
    type: 'offer_accepted',
    name: 'Discount Applied Confirmation',
    subject: 'Great news! Your discount has been applied',
    body: `Hi {{customer_name}},

We're so glad you decided to stay with us!

Your {{discount_percent}}% discount has been applied to your account. You'll see this reflected on your next {{discount_duration}} invoices.

If there's anything else we can help with, just let us know.

Thank you for being a valued customer!

Best,
{{company_name}} Team`,
    is_active: true,
    variables: ['customer_name', 'discount_percent', 'discount_duration', 'company_name'],
  },
  {
    id: '4',
    type: 'subscription_canceled',
    name: 'Subscription Canceled Confirmation',
    subject: "We're sorry to see you go",
    body: `Hi {{customer_name}},

Your subscription has been canceled as requested.

You'll continue to have access until {{end_date}}.

If you change your mind, you can resubscribe anytime from your account settings.

We'd love to have you back whenever you're ready!

Best,
{{company_name}} Team`,
    is_active: true,
    variables: ['customer_name', 'end_date', 'company_name'],
  },
];

// GET: Retrieve all templates
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

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = getServerSupabase();

    const { data: templates, error } = await (supabase as any)
      .from('email_templates')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ templates: [] });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Email Templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST: Create or update a template
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = getServerSupabase();

    if (body.id) {
      // Update existing template
      const { data: template, error } = await (supabase as any)
        .from('email_templates')
        .update({
          name: body.name,
          subject: body.subject,
          body: body.body,
          is_active: body.is_active ?? body.isActive,
          variables: body.variables,
        })
        .eq('id', body.id)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error || !template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, template });
    } else {
      // Create new template
      const { data: template, error } = await (supabase as any)
        .from('email_templates')
        .insert({
          organization_id: orgId,
          type: body.type || 'custom',
          name: body.name,
          subject: body.subject,
          body: body.body,
          is_active: body.is_active ?? body.isActive ?? true,
          variables: body.variables || [],
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
      }

      return NextResponse.json({ success: true, template });
    }
  } catch (error) {
    console.error('Email Templates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a template
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const orgId = await getOrganizationId();
    if (!orgId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = getServerSupabase();

    const { error } = await (supabase as any)
      .from('email_templates')
      .delete()
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email Templates DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
