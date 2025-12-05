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
  Clock,
  CreditCard,
  UserX,
  Heart,
  Settings2,
  ChevronDown,
  ChevronRight,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
  variables: string[];
}

interface SequenceSettings {
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
}

// Template categories
const TEMPLATE_CATEGORIES = {
  dunning: {
    label: 'Dunning Emails',
    description: 'Recover failed payments with empathetic reminders',
    icon: CreditCard,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    templates: [
      { type: 'dunning_1', name: 'Payment Failed - Gentle Notice', dayField: 'dunning_1_days' },
      { type: 'dunning_2', name: 'Payment Failed - Friendly Reminder', dayField: 'dunning_2_days' },
      { type: 'dunning_3', name: 'Payment Failed - Concerned Follow-up', dayField: 'dunning_3_days' },
      { type: 'dunning_4', name: 'Payment Failed - Final Notice', dayField: 'dunning_4_days' },
    ],
  },
  cancel: {
    label: 'Cancel Flow Emails',
    description: 'Re-engage customers who start canceling',
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    templates: [
      { type: 'cancel_save_1', name: 'Cancel Save - Check-in', dayField: 'cancel_save_1_days' },
      { type: 'cancel_save_2', name: 'Cancel Save - Discount Offer', dayField: 'cancel_save_2_days' },
      { type: 'cancel_goodbye', name: 'Cancellation Confirmed', dayField: null },
    ],
  },
  winback: {
    label: 'Win-back Emails',
    description: 'Bring back cancelled customers',
    icon: UserX,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    templates: [
      { type: 'winback_1', name: 'Win-back - New Features', dayField: 'winback_1_days' },
      { type: 'winback_2', name: 'Win-back - New Plans', dayField: 'winback_2_days' },
      { type: 'winback_3', name: 'Win-back - Data Deletion Warning', dayField: 'winback_3_days' },
    ],
  },
};

const AVAILABLE_VARIABLES = [
  { name: 'name', description: "Customer's name" },
  { name: 'email', description: "Customer's email" },
  { name: 'amount', description: 'Payment amount' },
  { name: 'company_name', description: 'Your company name' },
  { name: 'team_name', description: 'Your team name (for sign-off)' },
  { name: 'update_link', description: 'Link to update payment' },
  { name: 'discount_percent', description: 'Discount percentage' },
  { name: 'discount_duration', description: 'How long discount lasts' },
  { name: 'discount_link', description: 'Link to claim discount' },
  { name: 'return_to_cancel_flow_link', description: 'Link back to cancel flow' },
  { name: 'reactivate_link', description: 'Link to reactivate subscription' },
  { name: 'return_link', description: 'Link to return/pricing page' },
  { name: 'end_date', description: 'Subscription end date' },
  { name: 'new_feature_1', description: 'New feature highlight 1' },
  { name: 'new_feature_2', description: 'New feature highlight 2' },
  { name: 'new_feature_3', description: 'New feature highlight 3' },
];

// Sample preview data
const PREVIEW_DATA: Record<string, string> = {
  name: 'Sarah',
  email: 'sarah@example.com',
  amount: '$49.00',
  company_name: 'Your Company',
  team_name: 'The Team',
  update_link: 'https://example.com/update-payment',
  discount_percent: '20',
  discount_duration: '3 months',
  discount_link: 'https://example.com/claim-discount',
  return_to_cancel_flow_link: 'https://example.com/cancel',
  reactivate_link: 'https://example.com/reactivate',
  return_link: 'https://example.com/pricing',
  end_date: 'January 15, 2025',
  new_feature_1: 'Improved performance and reliability',
  new_feature_2: 'New intuitive dashboard',
  new_feature_3: 'Better customer support',
};

// Default template content
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
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sequenceSettings, setSequenceSettings] = useState<SequenceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    dunning: true,
    cancel: true,
    winback: true,
  });
  const [activeTab, setActiveTab] = useState('templates');

  // Form state
  const [formData, setFormData] = useState({
    type: 'dunning_1',
    name: '',
    subject: '',
    body: '',
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
    fetchSequenceSettings();
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

  const fetchSequenceSettings = async () => {
    try {
      const response = await fetch('/api/email-sequences');
      if (response.ok) {
        const data = await response.json();
        setSequenceSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch sequence settings:', err);
    }
  };

  const saveSequenceSettings = async (newSettings: Partial<SequenceSettings>) => {
    setSavingSettings(true);
    try {
      const response = await fetch('/api/email-sequences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sequenceSettings, ...newSettings }),
      });
      if (response.ok) {
        const data = await response.json();
        setSequenceSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const getTemplateForType = (type: string): EmailTemplate | undefined => {
    return templates.find(t => t.type === type);
  };

  const handleEdit = (type: string, existingTemplate?: EmailTemplate) => {
    if (existingTemplate) {
      setEditingTemplate(existingTemplate);
      setFormData({
        type: existingTemplate.type,
        name: existingTemplate.name,
        subject: existingTemplate.subject,
        body: existingTemplate.body,
        is_active: existingTemplate.is_active,
      });
      setIsCreating(false);
    } else {
      // Create from default template
      const defaultTemplate = DEFAULT_TEMPLATES[type];
      setEditingTemplate(null);
      setFormData({
        type,
        name: Object.values(TEMPLATE_CATEGORIES)
          .flatMap(c => c.templates)
          .find(t => t.type === type)?.name || type,
        subject: defaultTemplate?.subject || '',
        body: defaultTemplate?.body || '',
        is_active: true,
      });
      setIsCreating(true);
    }
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
    if (!confirm('Are you sure you want to delete this template? It will revert to the default.')) return;

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

  const renderPreview = (text: string) => {
    let result = text;
    Object.entries(PREVIEW_DATA).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });
    return result;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  if (loading) {
    return (
      <AppLayout title="Email Templates" description="Customize your automated emails">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Editor view
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
                {isCreating ? 'Create Email Template' : 'Edit Email Template'}
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
            {/* Template Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="e.g., Payment Failed - Gentle Notice"
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
                placeholder="e.g., Hey {{name}}, something needs your attention"
              />
            </div>

            {/* Email Body */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Body *</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full min-h-[300px] px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono"
                placeholder="Hi {{name}},&#10;&#10;Write your email here...&#10;&#10;— {{team_name}}"
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
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
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

              <Card className="shadow-lg">
                <CardHeader className="border-b bg-muted/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>To:</span>
                      <span>{PREVIEW_DATA.email}</span>
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
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap" style={{ lineHeight: '1.8' }}>
                    {formData.body ? renderPreview(formData.body) : (
                      <p className="text-muted-foreground italic">
                        Start typing in the body field to see a preview...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {formData.body && extractVariables(formData.body).length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Variables used:</p>
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
    <AppLayout title="Email Templates" description="Customize your automated email sequences">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Sequence Timing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories[key];

            return (
              <Card key={key}>
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCategory(key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.bgColor}`}>
                        <Icon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.label}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {category.templates.map((templateInfo) => {
                        const existingTemplate = getTemplateForType(templateInfo.type);
                        const isCustomized = !!existingTemplate;
                        const dayValue = templateInfo.dayField && sequenceSettings
                          ? (sequenceSettings as Record<string, number | boolean>)[templateInfo.dayField]
                          : null;

                        return (
                          <div
                            key={templateInfo.type}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                {dayValue !== null && (
                                  <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    Day {dayValue}
                                  </Badge>
                                )}
                                {templateInfo.dayField === null && (
                                  <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    Immediate
                                  </Badge>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{templateInfo.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {isCustomized ? (
                                    <span className="text-emerald-600">Customized</span>
                                  ) : (
                                    'Using default template'
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(templateInfo.type, existingTemplate)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                {isCustomized ? 'Edit' : 'Customize'}
                              </Button>
                              {isCustomized && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDelete(existingTemplate.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {sequenceSettings && (
            <>
              {/* Dunning Sequence */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <CreditCard className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle>Dunning Email Sequence</CardTitle>
                        <CardDescription>
                          Sent after a payment fails
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Enabled</span>
                      <input
                        type="checkbox"
                        checked={sequenceSettings.dunning_enabled}
                        onChange={(e) => saveSequenceSettings({ dunning_enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-input"
                        disabled={savingSettings}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Email 1', field: 'dunning_1_days' },
                      { label: 'Email 2', field: 'dunning_2_days' },
                      { label: 'Email 3', field: 'dunning_3_days' },
                      { label: 'Email 4', field: 'dunning_4_days' },
                    ].map(({ label, field }) => (
                      <div key={field} className="space-y-2">
                        <label className="text-sm font-medium">{label}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Day</span>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={(sequenceSettings as Record<string, number>)[field]}
                            onChange={(e) => saveSequenceSettings({ [field]: parseInt(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 rounded border border-input bg-background text-sm"
                            disabled={savingSettings || !sequenceSettings.dunning_enabled}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cancel Save Sequence */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                        <Heart className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <CardTitle>Cancel Save Emails</CardTitle>
                        <CardDescription>
                          Sent after someone abandons the cancel flow
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Enabled</span>
                      <input
                        type="checkbox"
                        checked={sequenceSettings.cancel_save_enabled}
                        onChange={(e) => saveSequenceSettings({ cancel_save_enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-input"
                        disabled={savingSettings}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Email 1', field: 'cancel_save_1_days' },
                      { label: 'Email 2', field: 'cancel_save_2_days' },
                    ].map(({ label, field }) => (
                      <div key={field} className="space-y-2">
                        <label className="text-sm font-medium">{label}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Day</span>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={(sequenceSettings as Record<string, number>)[field]}
                            onChange={(e) => saveSequenceSettings({ [field]: parseInt(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 rounded border border-input bg-background text-sm"
                            disabled={savingSettings || !sequenceSettings.cancel_save_enabled}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Goodbye Email</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Enabled</span>
                        <input
                          type="checkbox"
                          checked={sequenceSettings.goodbye_enabled}
                          onChange={(e) => saveSequenceSettings({ goodbye_enabled: e.target.checked })}
                          className="h-4 w-4 rounded border-input"
                          disabled={savingSettings}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Win-back Sequence */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                        <UserX className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle>Win-back Email Sequence</CardTitle>
                        <CardDescription>
                          Sent after a subscription is cancelled
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Enabled</span>
                      <input
                        type="checkbox"
                        checked={sequenceSettings.winback_enabled}
                        onChange={(e) => saveSequenceSettings({ winback_enabled: e.target.checked })}
                        className="h-4 w-4 rounded border-input"
                        disabled={savingSettings}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Email 1', field: 'winback_1_days' },
                      { label: 'Email 2', field: 'winback_2_days' },
                      { label: 'Email 3', field: 'winback_3_days' },
                    ].map(({ label, field }) => (
                      <div key={field} className="space-y-2">
                        <label className="text-sm font-medium">{label}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Day</span>
                          <input
                            type="number"
                            min="0"
                            max="90"
                            value={(sequenceSettings as Record<string, number>)[field]}
                            onChange={(e) => saveSequenceSettings({ [field]: parseInt(e.target.value) || 0 })}
                            className="w-16 px-2 py-1 rounded border border-input bg-background text-sm"
                            disabled={savingSettings || !sequenceSettings.winback_enabled}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
