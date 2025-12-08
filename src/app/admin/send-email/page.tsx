'use client';

import React, { useEffect, useState } from 'react';
import {
  Mail,
  Send,
  AlertCircle,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/AppLayout';

interface TemplateInfo {
  id: string;
  name: string;
  category: string;
}

interface SendResult {
  success: boolean;
  message?: string;
  error?: string;
  message_id?: string;
}

// Preview data for template rendering
const PREVIEW_DATA: Record<string, string> = {
  name: 'Sarah',
  email: 'sarah@example.com',
  amount: '$49.00',
  plan_name: 'Pro Plan',
  end_date: 'January 15, 2025',
  days_remaining: '7',
  company_name: 'Your Company',
  team_name: 'The Team',
  update_link: 'https://example.com/update-payment',
  billing_portal_link: 'https://example.com/billing',
  discount_percent: '20',
  discount_duration: '3 months',
  discount_link: 'https://example.com/claim-discount',
  return_to_cancel_flow_link: 'https://example.com/cancel',
  reactivate_link: 'https://example.com/reactivate',
  return_link: 'https://example.com/pricing',
  new_feature_1: 'Improved performance and reliability',
  new_feature_2: 'New intuitive dashboard',
  new_feature_3: 'Better customer support',
};

// Default templates for preview
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
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
  cancel_goodbye: {
    subject: "We're sad to see you go",
    body: `Hi {{name}},

Your cancellation is complete. Even though we're sad to see you leave, we're grateful you spent time with us.

Whenever you're ready — next month, next year, or whenever life makes space — we'll welcome you back with everything right where you left it.

Thank you for being part of our story.
It meant more than you know.

— {{team_name}}`,
  },
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
  winback_2: {
    subject: 'If you ever want to come back, we made this for you',
    body: `Hi {{name}},

We've created a simpler, more flexible plan because we realized the old one didn't fit everyone's needs — especially users who felt overwhelmed.

If you want to take another look, here it is:
{{return_link}}

No expectations. Just an open door.

— {{team_name}}`,
  },
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
  expiration_reminder_30: {
    subject: 'Your subscription renews in 30 days',
    body: `Hi {{name}},

Just a friendly heads up — your {{plan_name}} subscription will renew on {{end_date}}.

Everything is set up for automatic renewal, so you don't need to do anything. But if you'd like to review your plan or update your payment method, you can do that here:
{{billing_portal_link}}

If you have any questions, just reply to this email.

— {{team_name}}`,
  },
  expiration_reminder_14: {
    subject: 'Your subscription renews in 2 weeks',
    body: `Hey {{name}},

Your {{plan_name}} subscription will renew on {{end_date}} — that's just 2 weeks away.

If you want to make any changes to your plan or payment method, now's a good time:
{{billing_portal_link}}

No action needed if everything looks good. We'll take care of the rest.

— {{team_name}}`,
  },
  expiration_reminder_7: {
    subject: 'One week until your subscription renews',
    body: `Hi {{name}},

Quick reminder: your {{plan_name}} subscription renews in 7 days on {{end_date}}.

If you need to update your payment method or have any questions about your plan, you can manage everything here:
{{billing_portal_link}}

Thanks for being with us!

— {{team_name}}`,
  },
  expiration_reminder_3: {
    subject: 'Your subscription renews in 3 days',
    body: `Hey {{name}},

Just a heads up — your {{plan_name}} subscription will renew in 3 days on {{end_date}}.

If you need to make any last-minute changes:
{{billing_portal_link}}

We're here if you need anything.

— {{team_name}}`,
  },
  expiration_reminder_1: {
    subject: 'Your subscription renews tomorrow',
    body: `Hi {{name}},

Your {{plan_name}} subscription will renew tomorrow on {{end_date}}.

If everything looks good, no action needed — we'll handle the renewal automatically.

Need to make changes? You still have time:
{{billing_portal_link}}

Thanks for being a valued customer.

— {{team_name}}`,
  },
};

export default function AdminSendEmailPage() {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/send-email');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        setIsAdmin(true);
      } else if (response.status === 401 || response.status === 403) {
        setIsAdmin(false);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate || !recipientEmail) {
      setError('Please select a template and enter a recipient email');
      return;
    }

    setSending(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          template: selectedTemplate,
          customer_name: customerName || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult({ success: true, message: 'Email sent successfully!', message_id: data.message_id });
      } else {
        setResult({ success: false, error: data.error || 'Failed to send email' });
      }
    } catch (err) {
      setResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const renderPreview = (text: string) => {
    let result = text;
    // Replace with customer name if provided
    if (customerName) {
      result = result.replace(/\{\{name\}\}/g, customerName);
    }
    // Replace remaining variables with preview data
    Object.entries(PREVIEW_DATA).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const selectedTemplateData = selectedTemplate ? DEFAULT_TEMPLATES[selectedTemplate] : null;

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, TemplateInfo[]>);

  if (loading) {
    return (
      <AppLayout title="Admin: Send Email" description="Send test emails to any recipient">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isAdmin === false) {
    return (
      <AppLayout title="Admin: Send Email" description="Send test emails to any recipient">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You must be an admin to access this page.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to request admin access. Admin users are flagged in the
              <code className="mx-1 px-1 py-0.5 bg-muted rounded">user_profiles</code> table with
              <code className="mx-1 px-1 py-0.5 bg-muted rounded">is_admin = true</code>.
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin: Send Email" description="Send test emails to any recipient">
      <div className="max-w-6xl mx-auto">
        {/* Admin Badge */}
        <div className="mb-6">
          <Badge variant="outline" className="gap-2 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30">
            <ShieldCheck className="h-4 w-4" />
            Admin Mode
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Send Test Email</CardTitle>
                  <CardDescription>
                    Send any email template to test recipients
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Template *</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                      <React.Fragment key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          {category}
                        </div>
                        {categoryTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient Email *</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="test@example.com"
                />
              </div>

              {/* Customer Name (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Customer Name <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="John Doe"
                />
                <p className="text-xs text-muted-foreground">
                  If not provided, the email will use "Valued Customer"
                </p>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {result && (
                <div className={`flex items-center gap-2 p-3 text-sm rounded-lg ${
                  result.success
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'text-red-600 bg-red-50 dark:bg-red-950/30'
                }`}>
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <div>
                    {result.success ? result.message : result.error}
                    {result.message_id && (
                      <span className="block text-xs opacity-75 mt-1">
                        Message ID: {result.message_id}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sending || !selectedTemplate || !recipientEmail}
                className="w-full"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Email
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Email Preview</span>
              </div>
            </CardHeader>
            <CardContent>
              {selectedTemplateData ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="border-b bg-muted/50 p-4">
                    <div className="space-y-1 text-xs text-muted-foreground mb-2">
                      <div>To: {recipientEmail || 'recipient@example.com'}</div>
                      <div>From: Exit Loop &lt;noreply@exitloop.com&gt;</div>
                    </div>
                    <p className="font-medium">
                      {renderPreview(selectedTemplateData.subject)}
                    </p>
                  </div>
                  <div className="p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans" style={{ lineHeight: '1.8' }}>
                      {renderPreview(selectedTemplateData.body)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mb-4 opacity-50" />
                  <p>Select a template to see the preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Variables Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Available Template Variables</CardTitle>
            <CardDescription>
              These variables are automatically replaced with actual values when sending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PREVIEW_DATA).map((variable) => (
                <button
                  key={variable}
                  type="button"
                  onClick={() => copyVariable(variable)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  {copiedVar === variable ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                  <code>{`{{${variable}}}`}</code>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
