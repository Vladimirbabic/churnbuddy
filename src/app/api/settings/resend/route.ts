import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Validate a Resend API key and fetch domains
export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || !apiKey.startsWith('re_')) {
      return NextResponse.json(
        { error: 'Invalid API key format. Resend API keys start with "re_"' },
        { status: 400 }
      );
    }

    // Test the API key by fetching domains
    const resend = new Resend(apiKey);

    // First, try to list domains to validate the key
    const { data: domains, error: domainsError } = await resend.domains.list();

    if (domainsError) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check and try again.' },
        { status: 401 }
      );
    }

    // Filter to only verified domains
    const verifiedDomains = domains?.data?.filter(
      (domain: { status: string }) => domain.status === 'verified'
    ) || [];

    // Get the possible sender emails (from verified domains)
    const senderOptions = verifiedDomains.map((domain: { name: string }) => ({
      domain: domain.name,
      suggestions: [
        `hello@${domain.name}`,
        `noreply@${domain.name}`,
        `billing@${domain.name}`,
        `support@${domain.name}`,
      ],
    }));

    return NextResponse.json({
      success: true,
      domains: verifiedDomains,
      senderOptions,
      hasVerifiedDomains: verifiedDomains.length > 0,
      message: verifiedDomains.length > 0
        ? `Found ${verifiedDomains.length} verified domain(s)`
        : 'No verified domains found. Please verify a domain in Resend first.',
    });
  } catch (error) {
    console.error('Resend validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate API key. Please try again.' },
      { status: 500 }
    );
  }
}

// Send a test email
export async function PUT(request: NextRequest) {
  try {
    const { apiKey, fromEmail, fromName, toEmail } = await request.json();

    if (!apiKey || !fromEmail || !toEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to: toEmail,
      subject: 'Exit Loop - Test Email Connection',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1f2937; margin-bottom: 20px;">✅ Email Connection Successful!</h1>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your Resend integration is working correctly. Emails from Exit Loop will now be sent from:
          </p>
          <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0; font-weight: 600; color: #1f2937;">${fromName || 'No name set'}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;">${fromEmail}</p>
          </div>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            You can now send dunning emails, cancellation emails, and win-back campaigns from your own domain.
          </p>
          <p style="margin-top: 30px; color: #9ca3af; font-size: 12px;">
            — Exit Loop
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
      message: `Test email sent to ${toEmail}`,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email. Please check your settings.' },
      { status: 500 }
    );
  }
}
