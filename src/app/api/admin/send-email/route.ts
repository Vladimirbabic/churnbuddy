// =============================================================================
// Admin Email Sending Endpoint
// =============================================================================
// Allows admin users to send any email template to any recipient.
// Requires the user to be flagged as is_admin=true in user_profiles.
//
// Usage:
//   POST /api/admin/send-email
//   Body: {
//     "to": "recipient@example.com",
//     "template": "expiration_reminder_7",
//     "customer_name": "John Doe",
//     "context": { ... optional overrides ... }
//   }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTemplateEmail, type EmailTemplateType, type EmailContext } from '@/lib/emailService';

// All available email templates
const ALL_TEMPLATES: EmailTemplateType[] = [
  'dunning_1',
  'dunning_2',
  'dunning_3',
  'dunning_4',
  'cancel_save_1',
  'cancel_save_2',
  'cancel_goodbye',
  'winback_1',
  'winback_2',
  'winback_3',
  'expiration_reminder_30',
  'expiration_reminder_14',
  'expiration_reminder_7',
  'expiration_reminder_3',
  'expiration_reminder_1',
];

/**
 * Check if user is admin using their session
 */
async function checkAdminStatus(request: NextRequest): Promise<{
  isAdmin: boolean;
  userId: string | null;
  error?: string;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { isAdmin: false, userId: null, error: 'Supabase not configured' };
  }

  // Get the auth token from cookies or header
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  // Try to extract access token from cookie
  let accessToken: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.substring(7);
  } else if (cookieHeader) {
    // Parse cookies to find supabase auth token
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // Supabase stores the access token in a cookie like sb-<project-ref>-auth-token
    for (const [key, value] of Object.entries(cookies)) {
      if (key.includes('auth-token') || key.includes('access-token')) {
        try {
          const parsed = JSON.parse(decodeURIComponent(value));
          accessToken = parsed.access_token || parsed[0]?.access_token;
          break;
        } catch {
          // Not a JSON cookie, try as raw token
          if (value && value.length > 20) {
            accessToken = value;
          }
        }
      }
    }
  }

  if (!accessToken) {
    return { isAdmin: false, userId: null, error: 'Not authenticated' };
  }

  // Create Supabase client with the user's token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  // Get user from token
  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return { isAdmin: false, userId: null, error: 'Invalid session' };
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError) {
    // Profile might not exist yet, try to create it
    return { isAdmin: false, userId: user.id, error: 'Profile not found' };
  }

  return {
    isAdmin: profile?.is_admin === true,
    userId: user.id,
  };
}

export async function GET() {
  // Return list of available templates
  return NextResponse.json({
    templates: ALL_TEMPLATES.map(t => ({
      id: t,
      name: t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: t.startsWith('dunning') ? 'Dunning' :
                t.startsWith('cancel') ? 'Cancellation' :
                t.startsWith('winback') ? 'Win-back' :
                t.startsWith('expiration') ? 'Expiration Reminder' : 'Other',
    })),
    available_variables: [
      '{{name}}', '{{email}}', '{{amount}}', '{{update_link}}',
      '{{end_date}}', '{{plan_name}}', '{{days_remaining}}',
      '{{discount_percent}}', '{{discount_duration}}', '{{discount_link}}',
      '{{return_to_cancel_flow_link}}', '{{reactivate_link}}', '{{return_link}}',
      '{{renewal_link}}', '{{billing_portal_link}}',
      '{{new_feature_1}}', '{{new_feature_2}}', '{{new_feature_3}}',
      '{{company_name}}', '{{team_name}}',
    ],
  });
}

export async function POST(request: NextRequest) {
  // Check admin status
  const { isAdmin, userId, error: authError } = await checkAdminStatus(request);

  if (authError) {
    return NextResponse.json({ error: authError }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Access denied. Admin privileges required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { to, template, customer_name, context = {} } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json({ error: 'Recipient email (to) is required' }, { status: 400 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Template is required' }, { status: 400 });
    }

    if (!ALL_TEMPLATES.includes(template as EmailTemplateType)) {
      return NextResponse.json({
        error: `Invalid template. Must be one of: ${ALL_TEMPLATES.join(', ')}`,
      }, { status: 400 });
    }

    // Build email context with defaults
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const defaultEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailContext: EmailContext = {
      name: customer_name || context.name || 'Valued Customer',
      email: to,
      customer_id: context.customer_id || 'admin_test_customer',
      subscription_id: context.subscription_id || 'admin_test_subscription',
      plan_name: context.plan_name || 'Pro Plan',
      end_date: context.end_date || defaultEndDate,
      days_remaining: context.days_remaining || 7,
      amount: context.amount || '$29.00',
      update_link: context.update_link || `${appUrl}/billing`,
      billing_portal_link: context.billing_portal_link || `${appUrl}/billing`,
      discount_percent: context.discount_percent || 20,
      discount_duration: context.discount_duration || '3 months',
      discount_link: context.discount_link || `${appUrl}/accept-offer`,
      return_to_cancel_flow_link: context.return_to_cancel_flow_link || `${appUrl}/cancel`,
      reactivate_link: context.reactivate_link || `${appUrl}/reactivate`,
      return_link: context.return_link || appUrl,
      new_feature_1: context.new_feature_1 || 'Improved performance',
      new_feature_2: context.new_feature_2 || 'New dashboard',
      new_feature_3: context.new_feature_3 || 'Better integrations',
      company_name: context.company_name || 'Exit Loop',
      team_name: context.team_name || 'The Exit Loop Team',
      ...context,
    };

    // Send the email
    const result = await sendTemplateEmail({
      organizationId: userId || 'admin',
      templateType: template as EmailTemplateType,
      context: emailContext,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        to,
        template,
        message_id: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        details: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Admin send email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
