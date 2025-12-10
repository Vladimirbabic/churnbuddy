import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Default dunning email template
const DUNNING_1_TEMPLATE = {
  subject: 'Hey {{name}}, something small needs your attention',
  body: `Hi {{name}},

We tried processing your latest payment, but something didn't go through.
It's usually something tiny — an expired card, a bank hiccup, nothing serious.

You can update your info here:
{{update_link}}

No pressure. Just don't want you to lose access to the work you've already put in.

If you need help, reply. A real human will answer.

— {{team_name}}`,
};

function textToHtml(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color: #3b82f6; text-decoration: underline;">$1</a>'
  );

  html = html.replace(/\n/g, '<br>');

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
      &copy; ${new Date().getFullYear()} Exit Loop
    </p>
  </div>
</body>
</html>
  `.trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'basic';

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    let subject: string;
    let html: string;

    if (type === 'dunning') {
      // Send dunning email
      const context = {
        name: 'Vlad',
        update_link: 'https://exitloop.app/update-payment',
        team_name: 'Exit Loop',
      };

      subject = DUNNING_1_TEMPLATE.subject.replace('{{name}}', context.name);
      const bodyText = DUNNING_1_TEMPLATE.body
        .replace(/\{\{name\}\}/g, context.name)
        .replace(/\{\{update_link\}\}/g, context.update_link)
        .replace(/\{\{team_name\}\}/g, context.team_name);
      html = textToHtml(bodyText);
    } else {
      // Basic test email
      subject = 'Exit Loop - Test Email';
      html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1f2937; margin-bottom: 20px;">🎉 Email Test Successful!</h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Congratulations! Your Resend integration is working correctly.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            This test email was sent from <strong>Exit Loop</strong> at ${new Date().toLocaleString()}.
          </p>
          <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Next steps:</strong><br>
              • Set up a custom domain in Resend for branded emails<br>
              • Configure email templates in your dashboard<br>
              • Enable email sequences for dunning and win-back flows
            </p>
          </div>
          <p style="margin-top: 30px; color: #9ca3af; font-size: 12px;">
            — Exit Loop Team
          </p>
        </div>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's default until domain is verified
      to: 'vldbbc@gmail.com',
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      type,
      message: `Test ${type} email sent to vldbbc@gmail.com`
    });
  } catch (err) {
    console.error('Email send error:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
