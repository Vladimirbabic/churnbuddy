// =============================================================================
// Scheduled Email Processor (Cron Job Endpoint)
// =============================================================================
// This endpoint should be called periodically (e.g., every minute) by a cron service
// like Vercel Cron, GitHub Actions, or similar.
//
// It processes pending scheduled emails that are due to be sent.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendTemplateEmail, type EmailTemplateType, type EmailContext } from '@/lib/emailService';

// Type for scheduled email records
interface ScheduledEmail {
  id: string;
  organization_id: string;
  template_type: string;
  context: Record<string, unknown>;
  invoice_id?: string;
  cancel_flow_id?: string;
  scheduled_for: string;
  status: string;
}

// Secret key to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for processing

export async function GET(request: NextRequest) {
  // Verify cron secret (if configured)
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const supabase = getServerSupabase();
    const now = new Date().toISOString();

    // Fetch pending emails that are due to be sent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingEmails, error: fetchError } = await (supabase as any)
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process up to 50 emails per invocation

    if (fetchError) {
      console.error('Failed to fetch scheduled emails:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ message: 'No emails to process', processed: 0 });
    }

    const emails = pendingEmails as ScheduledEmail[];
    let processed = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        // Send the email
        const result = await sendTemplateEmail({
          organizationId: email.organization_id,
          templateType: email.template_type as EmailTemplateType,
          context: email.context as unknown as EmailContext,
          invoiceId: email.invoice_id,
          cancelFlowId: email.cancel_flow_id,
        });

        // Update the scheduled email record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (result.success) {
          await (supabase as any)
            .from('scheduled_emails')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              resend_message_id: result.messageId,
            })
            .eq('id', email.id);
          processed++;
        } else {
          await (supabase as any)
            .from('scheduled_emails')
            .update({
              status: 'failed',
              error_message: result.error,
            })
            .eq('id', email.id);
          failed++;
        }
      } catch (err) {
        console.error(`Failed to process scheduled email ${email.id}:`, err);
        await (supabase as any)
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
          })
          .eq('id', email.id);
        failed++;
      }
    }

    return NextResponse.json({
      message: 'Emails processed',
      processed,
      failed,
      total: pendingEmails.length,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled emails' },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}
