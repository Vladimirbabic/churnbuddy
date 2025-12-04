// =============================================================================
// Email Sending Logic (Resend with SendGrid fallback)
// =============================================================================
// Handles transactional emails for dunning (payment retry notices) and account
// updates. Uses Resend as primary provider with SendGrid as documented fallback.

import { Resend } from 'resend';

// Initialize Resend client with API key from environment (lazy initialization)
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

// Email configuration from environment
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@exitloop.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Types for email parameters
interface DunningEmailParams {
  customerEmail: string;
  customerName?: string;
  invoiceId: string;
  amountDue: number;          // Amount in cents
  currency: string;           // e.g., 'usd'
  hostedInvoiceUrl: string;   // Stripe hosted invoice payment page
  billingPortalUrl?: string;  // Stripe customer portal URL
  failureReason?: string;     // Human-readable failure reason
  companyName?: string;       // SaaS company name (configurable)
}

interface CancellationConfirmEmailParams {
  customerEmail: string;
  customerName?: string;
  cancellationDate: Date;
  companyName?: string;
}

interface SaveOfferEmailParams {
  customerEmail: string;
  customerName?: string;
  discountPercent: number;
  discountDuration: string;   // e.g., "3 months"
  companyName?: string;
}

/**
 * Send a dunning email when a payment fails
 * Includes a link to the Stripe hosted invoice page and billing portal
 */
export async function sendDunningEmail(params: DunningEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const {
    customerEmail,
    customerName = 'Valued Customer',
    invoiceId,
    amountDue,
    currency,
    hostedInvoiceUrl,
    billingPortalUrl,
    failureReason,
    companyName = 'Our Service',
  } = params;

  // Format amount for display (convert cents to dollars)
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountDue / 100);

  // Build email HTML content
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Update Required</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Payment Update Required</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hi ${customerName},</p>

        <p>We were unable to process your recent payment of <strong>${formattedAmount}</strong> for your ${companyName} subscription.</p>

        ${failureReason ? `<p style="background: #fef3cd; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0;"><strong>Reason:</strong> ${failureReason}</p>` : ''}

        <p>To avoid any interruption to your service, please update your payment method or retry the payment:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${hostedInvoiceUrl}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Pay Invoice Now
          </a>
        </div>

        ${billingPortalUrl ? `
        <p style="text-align: center;">
          <a href="${billingPortalUrl}" style="color: #3b82f6; text-decoration: underline;">
            Update Payment Method
          </a>
        </p>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions or need assistance, please reply to this email or contact our support team.
        </p>

        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
          Invoice ID: ${invoiceId}
        </p>
      </div>

      <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
        <p style="color: #9ca3af; margin: 0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;

  // Plain text fallback
  const emailText = `
Hi ${customerName},

We were unable to process your recent payment of ${formattedAmount} for your ${companyName} subscription.

${failureReason ? `Reason: ${failureReason}\n` : ''}

To avoid any interruption to your service, please update your payment method or retry the payment:

Pay Invoice: ${hostedInvoiceUrl}
${billingPortalUrl ? `Update Payment Method: ${billingPortalUrl}` : ''}

Invoice ID: ${invoiceId}

If you have any questions, please reply to this email.

Best regards,
${companyName} Team
  `.trim();

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Action Required: Payment Failed for ${companyName}`,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    console.log('Dunning email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('Failed to send dunning email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send a follow-up dunning email (e.g., 3 days after initial failure)
 */
export async function sendFollowUpDunningEmail(params: DunningEmailParams & { attemptNumber: number }): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { attemptNumber, ...dunningParams } = params;
  const { customerEmail, customerName = 'Valued Customer', companyName = 'Our Service', hostedInvoiceUrl, billingPortalUrl } = dunningParams;

  const urgencyLevel = attemptNumber >= 3 ? 'final' : attemptNumber >= 2 ? 'urgent' : 'reminder';

  const subjects: Record<string, string> = {
    reminder: `Reminder: Please Update Your Payment Method`,
    urgent: `Urgent: Your Subscription May Be Cancelled`,
    final: `Final Notice: Action Required to Keep Your Account`,
  };

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subjects[urgencyLevel]}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${urgencyLevel === 'final' ? '#dc2626' : urgencyLevel === 'urgent' ? '#f59e0b' : '#3b82f6'}; padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${subjects[urgencyLevel]}</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hi ${customerName},</p>

        <p>This is ${attemptNumber === 1 ? 'a reminder' : `attempt #${attemptNumber}`} that we still haven't been able to process your payment for ${companyName}.</p>

        ${urgencyLevel === 'final' ? `
        <p style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 12px; margin: 20px 0;">
          <strong>Important:</strong> Your subscription will be cancelled if payment is not received within 24 hours.
        </p>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${hostedInvoiceUrl}" style="background: ${urgencyLevel === 'final' ? '#dc2626' : '#3b82f6'}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Pay Now
          </a>
        </div>

        ${billingPortalUrl ? `
        <p style="text-align: center;">
          <a href="${billingPortalUrl}" style="color: #3b82f6;">Update Payment Method</a>
        </p>
        ` : ''}
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `${subjects[urgencyLevel]} - ${companyName}`,
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send confirmation email when subscription is cancelled
 */
export async function sendCancellationConfirmEmail(params: CancellationConfirmEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { customerEmail, customerName = 'Valued Customer', cancellationDate, companyName = 'Our Service' } = params;

  const formattedDate = cancellationDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1f2937;">We're Sorry to See You Go</h1>

      <p>Hi ${customerName},</p>

      <p>This email confirms that your ${companyName} subscription has been cancelled as of <strong>${formattedDate}</strong>.</p>

      <p>You'll continue to have access to your account until the end of your current billing period.</p>

      <p>If you change your mind, you can resubscribe at any time from your account settings.</p>

      <p>Thank you for being a customer. We'd love to have you back!</p>

      <p style="color: #6b7280; margin-top: 30px;">Best regards,<br>The ${companyName} Team</p>
    </body>
    </html>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Your ${companyName} Subscription Has Been Cancelled`,
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Send email when user accepts a save offer
 */
export async function sendSaveOfferAcceptedEmail(params: SaveOfferEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { customerEmail, customerName = 'Valued Customer', discountPercent, discountDuration, companyName = 'Our Service' } = params;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Your Discount Has Been Applied!</h1>
      </div>

      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p>Hi ${customerName},</p>

        <p>Great news! Your <strong>${discountPercent}% discount</strong> for ${discountDuration} has been applied to your ${companyName} subscription.</p>

        <p>We're thrilled you've decided to stay with us. Your new pricing will be reflected in your next invoice.</p>

        <p style="color: #6b7280; margin-top: 30px;">Thank you for your continued support!</p>

        <p>Best regards,<br>The ${companyName} Team</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Your ${discountPercent}% Discount is Now Active - ${companyName}`,
      html: emailHtml,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// =============================================================================
// SendGrid Fallback (Alternative Implementation)
// =============================================================================
// If using SendGrid instead of Resend, uncomment and configure the following:
//
// import sgMail from '@sendgrid/mail';
// sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
//
// export async function sendDunningEmailSendGrid(params: DunningEmailParams) {
//   const msg = {
//     to: params.customerEmail,
//     from: FROM_EMAIL,
//     subject: `Action Required: Payment Failed`,
//     html: '...email HTML content...',
//     text: '...plain text fallback...',
//   };
//
//   try {
//     await sgMail.send(msg);
//     return { success: true };
//   } catch (error) {
//     console.error('SendGrid error:', error);
//     return { success: false, error: error.message };
//   }
// }
