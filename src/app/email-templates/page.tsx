'use client';

import React, { useEffect, useState } from 'react';
import {
  Mail,
  Plus,
  Pencil,
  Trash2,
  Save,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Eye,
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

interface EmailTemplate {
  id: string;
  type: 'payment_failed' | 'payment_reminder' | 'subscription_canceled' | 'offer_accepted' | 'custom';
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  variables: string[];
}

const TEMPLATE_TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'warning' | 'success' }> = {
  payment_failed: { label: 'Payment Failed', variant: 'destructive' },
  payment_reminder: { label: 'Payment Reminder', variant: 'warning' },
  subscription_canceled: { label: 'Canceled', variant: 'secondary' },
  offer_accepted: { label: 'Offer Accepted', variant: 'success' },
  custom: { label: 'Custom', variant: 'default' },
};

const AVAILABLE_VARIABLES = [
  { name: 'customer_name', description: 'Customer\'s name' },
  { name: 'customer_email', description: 'Customer\'s email' },
  { name: 'amount', description: 'Payment amount' },
  { name: 'company_name', description: 'Your company name' },
  { name: 'plan_name', description: 'Subscription plan name' },
  { name: 'update_payment_link', description: 'Link to update payment' },
  { name: 'days_remaining', description: 'Days until cancellation' },
  { name: 'cancel_attempts', description: 'Number of cancel attempts' },
  { name: 'discount_percent', description: 'Discount percentage' },
  { name: 'discount_duration', description: 'How long discount lasts' },
  { name: 'end_date', description: 'Subscription end date' },
];

// Sample preview data
const PREVIEW_DATA: Record<string, string> = {
  customer_name: 'John Smith',
  customer_email: 'john@example.com',
  amount: '$49.00',
  company_name: 'Your Company',
  plan_name: 'Pro Plan',
  update_payment_link: 'https://example.com/update-payment',
  days_remaining: '3',
  cancel_attempts: '2',
  discount_percent: '20',
  discount_duration: '3 months',
  end_date: 'January 15, 2025',
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'custom' as EmailTemplate['type'],
    name: '',
    subject: '',
    body: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      name: template.name,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
    setIsCreating(false);
    setIsEditing(true);
    setError(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setFormData({
      type: 'custom',
      name: '',
      subject: '',
      body: '',
      isActive: true,
    });
    setIsEditing(true);
    setError(null);
  };

  const handleBack = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate?.id,
          ...formData,
          variables: extractVariables(formData.body),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      await fetchTemplates();
      handleBack();
    } catch (err) {
      setError('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/email-templates?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const extractVariables = (body: string): string[] => {
    const matches = body.match(/\{\{([^}]+)\}\}/g) || [];
    return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, ''))));
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setCopiedVar(variable);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  // Replace variables with preview data
  const renderPreview = (text: string) => {
    let result = text;
    Object.entries(PREVIEW_DATA).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const headerActions = (
    <Button onClick={handleCreate}>
      <Plus className="mr-2 h-4 w-4" />
      New Template
    </Button>
  );

  if (loading) {
    return (
      <AppLayout title="Email Templates" description="Customize your notification emails" actions={headerActions}>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Editor view - Full screen with 40/60 split
  if (isEditing) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <header className="border-b bg-background shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between px-6 h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="text-lg font-semibold">
                {isCreating ? 'New Email Template' : 'Edit Email Template'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBack}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Template
              </Button>
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg shrink-0">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">×</button>
          </div>
        )}

        {/* Main Content - 40/60 Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Editor (40%) */}
          <div className="w-[40%] border-r overflow-y-auto p-6 space-y-6">
            {/* Template Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Type</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as EmailTemplate['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment_failed">Payment Failed</SelectItem>
                  <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                  <SelectItem value="subscription_canceled">Subscription Canceled</SelectItem>
                  <SelectItem value="offer_accepted">Offer Accepted</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Payment Failed - First Notice"
              />
            </div>

            {/* Subject Line */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject Line *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Action required: Update your payment method"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Body *</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full min-h-[250px] px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
                placeholder="Hi {{customer_name}},&#10;&#10;Your payment for {{amount}} failed...&#10;&#10;Best,&#10;{{company_name}}"
              />
            </div>

            {/* Available Variables */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Available Variables</label>
              <p className="text-xs text-muted-foreground">
                Click to copy and paste into your template
              </p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    onClick={() => copyVariable(v.name)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-secondary hover:bg-secondary/80 transition-colors"
                    title={v.description}
                  >
                    {copiedVar === v.name ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                    <code>{`{{${v.name}}}`}</code>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Template is active
              </label>
            </div>
          </div>

          {/* Right Side - Preview (60%) */}
          <div className="w-[60%] bg-muted/30 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Email Preview</span>
              </div>

              {/* Email Preview Card */}
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-muted/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>To:</span>
                      <span>{PREVIEW_DATA.customer_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>From:</span>
                      <span>{PREVIEW_DATA.company_name} &lt;hello@yourcompany.com&gt;</span>
                    </div>
                  </div>
                  <CardTitle className="text-base pt-2">
                    {formData.subject ? renderPreview(formData.subject) : 'Subject line preview...'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {formData.body ? renderPreview(formData.body) : (
                      <p className="text-muted-foreground italic">
                        Start typing in the body field to see a preview of your email...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Variables Used */}
              {formData.body && extractVariables(formData.body).length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Variables used in this template:</p>
                  <div className="flex flex-wrap gap-1">
                    {extractVariables(formData.body).map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <AppLayout title="Email Templates" description="Customize your notification emails" actions={headerActions}>
      <div className="space-y-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Create your first email template to customize your customer communications.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="group hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEdit(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={TEMPLATE_TYPE_LABELS[template.type]?.variant || 'default'} className="text-xs">
                          {TEMPLATE_TYPE_LABELS[template.type]?.label || template.type}
                        </Badge>
                        {!template.isActive && (
                          <Badge variant="outline" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <CardTitle className="text-base truncate">{template.name}</CardTitle>
                      <CardDescription className="text-xs truncate">
                        {template.subject}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(template);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans line-clamp-3">
                    {template.body}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
