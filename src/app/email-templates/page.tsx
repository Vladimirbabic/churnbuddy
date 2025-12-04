'use client';

import React, { useEffect, useState } from 'react';
import {
  Mail,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Copy,
  Check,
  AlertCircle,
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

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
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
    setError(null);
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
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
      setEditingTemplate(null);
      setIsCreating(false);
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

  return (
    <AppLayout title="Email Templates" description="Customize your notification emails" actions={headerActions}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Template list */}
            <div className="lg:col-span-2 space-y-4">
              {templates.length === 0 && !isCreating ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Mail className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first email template to customize your communications.
                    </p>
                    <Button onClick={handleCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                templates.map((template) => (
                  <Card
                    key={template.id}
                    className={editingTemplate?.id === template.id ? 'ring-2 ring-primary' : ''}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant={TEMPLATE_TYPE_LABELS[template.type]?.variant || 'default'}>
                              {TEMPLATE_TYPE_LABELS[template.type]?.label || template.type}
                            </Badge>
                            {!template.isActive && (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                          <CardDescription className="text-sm">
                            Subject: {template.subject}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(template)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(template.id)}
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
                ))
              )}
            </div>

            {/* Editor panel */}
            {(editingTemplate || isCreating) && (
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {isCreating ? 'New Template' : 'Edit Template'}
                    </CardTitle>
                    <CardDescription>
                      {isCreating ? 'Create a new email template' : 'Modify the selected template'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    )}

                    {isCreating && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
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
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Template name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject *</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Email subject line"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Body *</label>
                      <textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        className="w-full min-h-[200px] px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
                        placeholder="Email body content..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Available Variables</label>
                      <div className="flex flex-wrap gap-1">
                        {AVAILABLE_VARIABLES.map((v) => (
                          <button
                            key={v.name}
                            type="button"
                            onClick={() => copyVariable(v.name)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-secondary hover:bg-secondary/80 transition-colors"
                            title={v.description}
                          >
                            {copiedVar === v.name ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {`{{${v.name}}}`}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Click to copy a variable to clipboard
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-input"
                      />
                      <label htmlFor="isActive" className="text-sm">
                        Active
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button className="flex-1" onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
    </AppLayout>
  );
}
