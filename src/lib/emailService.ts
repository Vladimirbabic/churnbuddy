// =============================================================================
// Template-Based Email Service
// =============================================================================
// Sends emails using customizable templates stored in the database.
// Falls back to default templates if no custom template exists.

import { Resend } from 'resend';
import { getServerSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Initialize Resend client
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@exitloop.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// =============================================================================
// Types
// =============================================================================

export type EmailTemplateType =
  | 'dunning_1'
  | 'dunning_2'
  | 'dunning_3'
  | 'dunning_4'
  | 'cancel_save_1'
  | 'cancel_save_2'
  | 'cancel_goodbye'
  | 'winback_1'
  | 'winback_2'
  | 'winback_3';

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
}

export interface EmailContext {
  // Customer info
  name?: string;
  email: string;
  customer_id: string;

  // Payment info
  amount?: string;
  update_link?: string;

  // Subscription info
  subscription_id?: string;
  end_date?: string;

  // Discount info
  discount_percent?: number;
  discount_duration?: string;
  discount_link?: string;

  // Cancel flow
  return_to_cancel_flow_link?: string;

  // Win-back
  reactivate_link?: string;
  new_feature_1?: string;
  new_feature_2?: string;
  new_feature_3?: string;
  return_link?: string;

  // Organization
  company_name?: string;
  team_name?: string;
}

export interface SendEmailParams {
  organizationId: string;
  templateType: EmailTemplateType;
  context: EmailContext;
  invoiceId?: string;
  cancelFlowId?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// Default Templates (Emotional Versions)
// =============================================================================

const DEFAULT_TEMPLATES: Record<EmailTemplateType, { subject: string; body: string }> = {
  // Dunning Email 1 - Gentle, caring tone
  dunning_1: {
    subject: 'Hey {{name}}, something small needs your attention',
    body: `Hi {{name}},

We tried processing your latest payment, but something didn't go through.
It's usually something tiny — an expired card, a bank hiccup, nothing serious.

You can update your info here:
{{update_link}}

No pressure. Just don't want you to lose access to the work you've already put in.

If you need help, reply. A real human will answer.

— {{team_name}}`,
  },

  // Dunning Email 2 - Reassuring, supportive
  dunning_2: {
    subject: 'Just making sure you saw this',
    body: `Hey {{name}},

Your payment is still not going through, and I wanted to gently remind you before anything gets disrupted.

You can fix it here in a few seconds:
{{update_link}}

Life gets busy. Cards expire. Totally normal.
We're here if you need anything at all.

Warmly,
{{team_name}}`,
  },

  // Dunning Email 3 - Clear but compassionate
  dunning_3: {
    subject: "We don't want you to lose access",
    body: `Hi {{name}},

We've tried your payment a few times and no luck yet.

Your account may pause soon, and we honestly don't want that to interrupt your flow.

You can update your payment here:
{{update_link}}

If something feels off or you need more time, just reply — we're humans, we understand.

— {{team_name}}`,
  },

  // Dunning Email 4 - Final Notice (emotional but respectful)
  dunning_4: {
    subject: 'Before your account goes on pause…',
    body: `Hey {{name}},

This is our last reminder before your account is paused.
We know this stuff can slip through the cracks — truly no judgment.

If you'd like to keep everything active, you can update things here:
{{update_link}}

If you need a little more time or support, we're right here. Just ask.

— {{team_name}}`,
  },

  // Cancel Save Email 1 - "Talk to us" tone
  cancel_save_1: {
    subject: 'Before you leave us, can we check in?',
    body: `Hi {{name}},

We noticed you started canceling your subscription, and we just wanted to pause for a moment.

If something isn't working — the price, the features, your season of life — we genuinely want to understand and try to help.

We can offer:
• A pause if things are overwhelming
• A discount if the cost is heavy right now
• A lighter plan if you don't need the full product

If you'd like to explore any option, you can open your cancellation page again here:
{{return_to_cancel_flow_link}}

And if this really is goodbye, thank you for being with us.

With appreciation,
{{team_name}}`,
  },

  // Cancel Save Email 2 - Empathetic discount offer
  cancel_save_2: {
    subject: 'If cost was the reason, maybe this helps',
    body: `Hey {{name}},

If part of the reason you canceled was financial stress — we understand.
Times change, workloads shift, budgets get tight.

If it helps, we'd love to offer you {{discount_percent}}% off for the next {{discount_duration}}.
No tricks, no pressure — just a gesture of thanks for supporting us.

Claim it here if you'd like:
{{discount_link}}

If now's not the right moment, that's okay too.

— {{team_name}}`,
  },

  // Cancel Goodbye - A warm, honest goodbye
  cancel_goodbye: {
    subject: "We're sad to see you go",
    body: `Hi {{name}},

Your cancellation is complete. Even though we're sad to see you leave, we're grateful you spent time with us.

Whenever you're ready — next month, next year, or whenever life makes space — we'll welcome you back with everything right where you left it.

Thank you for being part of our story.
It meant more than you know.

— {{team_name}}`,
  },

  // Win-back Email 1 - "We grew, thanks to you"
  winback_1: {
    subject: 'A lot has changed since you left — thanks to your feedback',
    body: `Hey {{name}},

Since you left, we've been hard at work improving things people like you asked for:

• {{new_feature_1}}
• {{new_feature_2}}
• {{new_feature_3}}

We'd love for you to see what's new.
You can come back any time:
{{reactivate_link}}

Either way — thank you for pushing us to get better.

Warm regards,
{{team_name}}`,
  },

  // Win-back Email 2 - Soft, personal invite
  winback_2: {
    subject: 'If you ever want to come back, we made this for you',
    body: `Hi {{name}},

We've created a simpler, more flexible plan because we realized the old one didn't fit everyone's needs — especially users who felt overwhelmed.

If you want to take another look, here it is:
{{return_link}}

No expectations. Just an open door.

— {{team_name}}`,
  },

  // Win-back Email 3 - Last call, gentle and human
  winback_3: {
    subject: 'Your data is scheduled for deletion',
    body: `Hey {{name}},

We're doing some cleanup soon, and your saved data is scheduled to be removed unless you want to reactivate.

If you want to keep everything, just tap here:
{{reactivate_link}}

Whatever you decide, thank you for being part of our community.
We're rooting for you.

— {{team_name}}`,
  },
};

// =============================================================================
// Template Functions
// =============================================================================

/**
 * Fetch a template from the database or return the default
 */
async function getTemplate(
  organizationId: string,
  templateType: EmailTemplateType
): Promise<{ subject: string; body: string }> {
  if (!isSupabaseConfigured()) {
    return DEFAULT_TEMPLATES[templateType];
  }

  try {
    const supabase = getServerSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template } = await (supabase as any)
      .from('email_templates')
      .select('subject, body, is_active')
      .eq('organization_id', organizationId)
      .eq('type', templateType)
      .eq('is_active', true)
      .single();

    if (template) {
      return { subject: template.subject, body: template.body };
    }
  } catch (error) {
    console.error(`Failed to fetch template ${templateType}:`, error);
  }

  return DEFAULT_TEMPLATES[templateType];
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(text: string, context: EmailContext): string {
  let result = text;

  // Replace all variables
  const replacements: Record<string, string | undefined> = {
    '{{name}}': context.name || 'there',
    '{{email}}': context.email,
    '{{amount}}': context.amount,
    '{{update_link}}': context.update_link,
    '{{end_date}}': context.end_date,
    '{{discount_percent}}': context.discount_percent?.toString(),
    '{{discount_duration}}': context.discount_duration,
    '{{discount_link}}': context.discount_link,
    '{{return_to_cancel_flow_link}}': context.return_to_cancel_flow_link,
    '{{reactivate_link}}': context.reactivate_link,
    '{{return_link}}': context.return_link,
    '{{new_feature_1}}': context.new_feature_1 || 'Improved performance and reliability',
    '{{new_feature_2}}': context.new_feature_2 || 'New intuitive dashboard',
    '{{new_feature_3}}': context.new_feature_3 || 'Better customer support',
    '{{company_name}}': context.company_name || 'Our Team',
    '{{team_name}}': context.team_name || context.company_name || 'The Team',
  };

  for (const [key, value] of Object.entries(replacements)) {
    if (value) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
  }

  return result;
}

/**
 * Convert plain text email to simple HTML
 */
function textToHtml(text: string, companyName?: string): string {
  // Escape HTML entities
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert URLs to links
  html = html.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color: #3b82f6; text-decoration: underline;">$1</a>'
  );

  // Convert line breaks to <br>
  html = html.replace(/\n/g, '<br>');

  // Convert bullet points
  html = html.replace(/• /g, '&bull; ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.8; color: #333; max-width: 600px; margin: 0 auto; padding: 30px 20px;">
  <div style="font-size: 16px;">
    ${html}
  </div>
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      &copy; ${new Date().getFullYear()} ${companyName || 'Exit Loop'}
    </p>
  </div>
</body>
</html>
  `.trim();
}

// =============================================================================
// Main Send Function
// =============================================================================

/**
 * Send an email using a template
 */
export async function sendTemplateEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { organizationId, templateType, context, invoiceId, cancelFlowId } = params;

  try {
    // Get the template
    const template = await getTemplate(organizationId, templateType);

    // Replace variables
    const subject = replaceVariables(template.subject, context);
    const bodyText = replaceVariables(template.body, context);
    const bodyHtml = textToHtml(bodyText, context.company_name);

    // Send the email
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: context.email,
      subject,
      html: bodyHtml,
      text: bodyText,
    });

    if (error) {
      console.error(`Email send error (${templateType}):`, error);
      return { success: false, error: error.message };
    }

    // Log the send to database
    if (isSupabaseConfigured()) {
      const supabase = getServerSupabase();
      await (supabase as any)
        .from('email_sends')
        .insert({
          organization_id: organizationId,
          template_type: templateType,
          customer_id: context.customer_id,
          customer_email: context.email,
          resend_message_id: data?.id,
          subscription_id: context.subscription_id,
          invoice_id: invoiceId,
        });
    }

    console.log(`Email sent successfully (${templateType}):`, data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error(`Failed to send email (${templateType}):`, err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// =============================================================================
// Scheduling Functions
// =============================================================================

/**
 * Schedule an email to be sent at a specific time
 */
export async function scheduleEmail(params: {
  organizationId: string;
  templateType: EmailTemplateType;
  context: EmailContext;
  scheduledFor: Date;
  invoiceId?: string;
  cancelFlowId?: string;
}): Promise<{ success: boolean; scheduledEmailId?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await (supabase as any)
      .from('scheduled_emails')
      .insert({
        organization_id: params.organizationId,
        template_type: params.templateType,
        customer_id: params.context.customer_id,
        customer_email: params.context.email,
        customer_name: params.context.name,
        scheduled_for: params.scheduledFor.toISOString(),
        context: params.context,
        subscription_id: params.context.subscription_id,
        invoice_id: params.invoiceId,
        cancel_flow_id: params.cancelFlowId,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to schedule email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, scheduledEmailId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Cancel all pending emails for a customer
 */
export async function cancelPendingEmails(params: {
  organizationId: string;
  customerId: string;
  templateTypes?: EmailTemplateType[];
}): Promise<{ success: boolean; cancelledCount?: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const supabase = getServerSupabase();
    let query = (supabase as any)
      .from('scheduled_emails')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('organization_id', params.organizationId)
      .eq('customer_id', params.customerId)
      .eq('status', 'pending');

    if (params.templateTypes && params.templateTypes.length > 0) {
      query = query.in('template_type', params.templateTypes);
    }

    const { data, error } = await query.select('id');

    if (error) {
      console.error('Failed to cancel pending emails:', error);
      return { success: false, error: error.message };
    }

    return { success: true, cancelledCount: data?.length || 0 };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// =============================================================================
// Sequence Functions
// =============================================================================

/**
 * Get email sequence settings for an organization
 */
export async function getSequenceSettings(organizationId: string): Promise<{
  dunning_enabled: boolean;
  dunning_1_days: number;
  dunning_2_days: number;
  dunning_3_days: number;
  dunning_4_days: number;
  cancel_save_enabled: boolean;
  cancel_save_1_days: number;
  cancel_save_2_days: number;
  winback_enabled: boolean;
  winback_1_days: number;
  winback_2_days: number;
  winback_3_days: number;
  goodbye_enabled: boolean;
}> {
  // Default settings
  const defaults = {
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

  if (!isSupabaseConfigured()) {
    return defaults;
  }

  try {
    const supabase = getServerSupabase();
    const { data } = await (supabase as any)
      .from('email_sequences')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (data) {
      return { ...defaults, ...data };
    }
  } catch (error) {
    console.error('Failed to fetch sequence settings:', error);
  }

  return defaults;
}

/**
 * Schedule the dunning email sequence for a failed payment
 */
export async function scheduleDunningSequence(params: {
  organizationId: string;
  context: EmailContext;
  invoiceId: string;
}): Promise<{ success: boolean; scheduledCount?: number; error?: string }> {
  const { organizationId, context, invoiceId } = params;

  const settings = await getSequenceSettings(organizationId);

  if (!settings.dunning_enabled) {
    return { success: true, scheduledCount: 0 };
  }

  const now = new Date();
  const scheduled: Array<{ type: EmailTemplateType; days: number }> = [
    { type: 'dunning_1', days: settings.dunning_1_days },
    { type: 'dunning_2', days: settings.dunning_2_days },
    { type: 'dunning_3', days: settings.dunning_3_days },
    { type: 'dunning_4', days: settings.dunning_4_days },
  ];

  let scheduledCount = 0;

  for (const { type, days } of scheduled) {
    const scheduledFor = new Date(now);
    scheduledFor.setDate(scheduledFor.getDate() + days);

    // If days is 0, send immediately
    if (days === 0) {
      await sendTemplateEmail({
        organizationId,
        templateType: type,
        context,
        invoiceId,
      });
    } else {
      await scheduleEmail({
        organizationId,
        templateType: type,
        context,
        scheduledFor,
        invoiceId,
      });
    }
    scheduledCount++;
  }

  return { success: true, scheduledCount };
}

/**
 * Schedule win-back email sequence after cancellation
 */
export async function scheduleWinbackSequence(params: {
  organizationId: string;
  context: EmailContext;
}): Promise<{ success: boolean; scheduledCount?: number; error?: string }> {
  const { organizationId, context } = params;

  const settings = await getSequenceSettings(organizationId);

  // Send goodbye email immediately if enabled
  if (settings.goodbye_enabled) {
    await sendTemplateEmail({
      organizationId,
      templateType: 'cancel_goodbye',
      context,
    });
  }

  if (!settings.winback_enabled) {
    return { success: true, scheduledCount: settings.goodbye_enabled ? 1 : 0 };
  }

  const now = new Date();
  const scheduled: Array<{ type: EmailTemplateType; days: number }> = [
    { type: 'winback_1', days: settings.winback_1_days },
    { type: 'winback_2', days: settings.winback_2_days },
    { type: 'winback_3', days: settings.winback_3_days },
  ];

  let scheduledCount = settings.goodbye_enabled ? 1 : 0;

  for (const { type, days } of scheduled) {
    const scheduledFor = new Date(now);
    scheduledFor.setDate(scheduledFor.getDate() + days);

    await scheduleEmail({
      organizationId,
      templateType: type,
      context,
      scheduledFor,
    });
    scheduledCount++;
  }

  return { success: true, scheduledCount };
}
