'use client';

import React, { useEffect, useState } from 'react';
import {
  Mail,
  Pencil,
  Save,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Eye,
  CreditCard,
  UserX,
  Heart,
  ChevronDown,
  ChevronRight,
  Send,
  Timer,
  GitBranch,
  Zap,
  ArrowDown,
  Activity,
  CheckCircle,
  MousePointerClick,
  MailOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';
import { Switch } from '@/components/ui/switch';

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

type EnabledFieldType = 'dunning_enabled' | 'cancel_save_enabled' | 'winback_enabled';

interface SequenceStep {
  type: string;
  title: string;
  subtitle: string;
  dayField?: string;
  emailType?: string;
  conditionField?: string;
}

interface SequenceDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  enabledField: EnabledFieldType;
  trigger: {
    title: string;
    subtitle: string;
  };
  steps: SequenceStep[];
  extraSteps?: SequenceStep[];
}

interface EmailLogEntry {
  id: string;
  templateType: string;
  customerId: string;
  customerEmail: string;
  messageId: string | null;
  sentAt: string;
  openedAt: string | null;
  clickedAt: string | null;
  subscriptionId: string | null;
  invoiceId: string | null;
  status: 'sent' | 'opened' | 'clicked';
}

// Sequence definitions with workflow steps
const SEQUENCES: Record<string, SequenceDefinition> = {
  dunning: {
    id: 'dunning',
    name: 'Dunning Sequence',
    description: 'Recover failed payments with empathetic reminders',
    icon: CreditCard,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    enabledField: 'dunning_enabled',
    trigger: {
      title: 'Payment Failed',
      subtitle: 'When a payment attempt fails',
    },
    steps: [
      { type: 'email', title: 'Gentle Notice', subtitle: 'First payment reminder', dayField: 'dunning_1_days', emailType: 'dunning_1' },
      { type: 'email', title: 'Friendly Reminder', subtitle: 'Second payment reminder', dayField: 'dunning_2_days', emailType: 'dunning_2' },
      { type: 'email', title: 'Concerned Follow-up', subtitle: 'Third payment reminder', dayField: 'dunning_3_days', emailType: 'dunning_3' },
      { type: 'email', title: 'Final Notice', subtitle: 'Last chance before pause', dayField: 'dunning_4_days', emailType: 'dunning_4' },
    ],
  },
  cancel: {
    id: 'cancel',
    name: 'Cancel Save Sequence',
    description: 'Re-engage customers who abandon the cancel flow',
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    borderColor: 'border-rose-200 dark:border-rose-800',
    enabledField: 'cancel_save_enabled',
    trigger: {
      title: 'Cancel Flow Abandoned',
      subtitle: 'When a customer leaves without canceling',
    },
    steps: [
      { type: 'email', title: 'Check-in Email', subtitle: 'Offer help & alternatives', dayField: 'cancel_save_1_days', emailType: 'cancel_save_1' },
      { type: 'email', title: 'Discount Offer', subtitle: 'Special offer to stay', dayField: 'cancel_save_2_days', emailType: 'cancel_save_2' },
    ],
    extraSteps: [
      { type: 'condition', title: 'If Cancelled', subtitle: 'Customer completed cancellation' },
      { type: 'email', title: 'Goodbye Email', subtitle: 'Graceful farewell', emailType: 'cancel_goodbye', conditionField: 'goodbye_enabled' },
    ],
  },
  winback: {
    id: 'winback',
    name: 'Win-back Sequence',
    description: 'Bring back cancelled customers',
    icon: UserX,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    enabledField: 'winback_enabled',
    trigger: {
      title: 'Subscription Cancelled',
      subtitle: 'When a subscription ends',
    },
    steps: [
      { type: 'email', title: 'New Features', subtitle: "What's improved since they left", dayField: 'winback_1_days', emailType: 'winback_1' },
      { type: 'email', title: 'New Plans', subtitle: 'More flexible options', dayField: 'winback_2_days', emailType: 'winback_2' },
      { type: 'email', title: 'Data Warning', subtitle: 'Data deletion notice', dayField: 'winback_3_days', emailType: 'winback_3' },
    ],
  },
};

// Available variables for templates
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

// Workflow Node Component
function WorkflowNode({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  badge,
  isLast,
  onClick,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  isLast?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="relative">
      {/* Node */}
      <div
        className={`relative flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        {badge}
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div className="flex justify-center py-2">
          <div className="w-0.5 h-8 bg-border relative">
            <ArrowDown className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}

// Sequence Card with Visual Workflow
function SequenceCard({
  sequence,
  settings,
  templates,
  onToggle,
  onEditEmail,
  onUpdateDay,
  saving,
  alwaysExpanded = false,
}: {
  sequence: SequenceDefinition;
  settings: SequenceSettings | null;
  templates: EmailTemplate[];
  onToggle: (field: string, value: boolean) => void;
  onEditEmail: (type: string, template?: EmailTemplate) => void;
  onUpdateDay: (field: string, value: number) => void;
  saving: boolean;
  alwaysExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(alwaysExpanded);
  const isExpanded = alwaysExpanded || expanded;
  const Icon = sequence.icon;
  const isEnabled = settings ? (settings as unknown as Record<string, boolean>)[sequence.enabledField] : false;

  const getTemplateForType = (type: string) => templates.find(t => t.type === type);

  return (
    <Card className={`overflow-hidden transition-all ${!isEnabled ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div
        className={`px-6 py-4 ${sequence.bgColor} border-b ${sequence.borderColor} ${!alwaysExpanded ? 'cursor-pointer' : ''}`}
        onClick={() => !alwaysExpanded && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/80 dark:bg-gray-900/50 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${sequence.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-base">{sequence.name}</h3>
              <p className="text-sm text-muted-foreground">{sequence.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm text-muted-foreground">{isEnabled ? 'Active' : 'Paused'}</span>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => onToggle(sequence.enabledField, checked)}
                disabled={saving}
              />
            </div>
            {!alwaysExpanded && (
              isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )
            )}
          </div>
        </div>
      </div>

      {/* Workflow */}
      {isExpanded && (
        <CardContent className="p-6">
          <div className="max-w-md mx-auto">
            {/* Trigger */}
            <WorkflowNode
              icon={Zap}
              iconBg="bg-purple-100 dark:bg-purple-900/50"
              iconColor="text-purple-600"
              title={sequence.trigger.title}
              subtitle={sequence.trigger.subtitle}
              badge={<Badge variant="secondary" className="text-xs">Trigger</Badge>}
            />

            {/* Email Steps */}
            {sequence.steps.map((step, index) => {
              const template = step.emailType ? getTemplateForType(step.emailType) : undefined;
              const dayValue = step.dayField && settings
                ? (settings as unknown as Record<string, number>)[step.dayField]
                : 0;
              const isLastMain = index === sequence.steps.length - 1 && !sequence.extraSteps;

              return (
                <div key={step.emailType || index}>
                  {/* Delay indicator */}
                  {step.dayField && (
                    <div className="flex justify-center py-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
                        <Timer className="h-3 w-3" />
                        <span>Wait</span>
                        <input
                          type="number"
                          min="0"
                          max="90"
                          value={dayValue}
                          onChange={(e) => step.dayField && onUpdateDay(step.dayField, parseInt(e.target.value) || 0)}
                          className="w-12 px-1.5 py-0.5 rounded border border-input bg-background text-center text-xs"
                          disabled={saving || !isEnabled}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>days</span>
                      </div>
                    </div>
                  )}

                  <WorkflowNode
                    icon={Send}
                    iconBg={sequence.bgColor}
                    iconColor={sequence.color}
                    title={step.title}
                    subtitle={step.subtitle}
                    isLast={isLastMain && index === sequence.steps.length - 1}
                    badge={
                      <Badge
                        variant={template ? 'default' : 'outline'}
                        className={`text-xs cursor-pointer ${template ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:bg-muted'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          step.emailType && onEditEmail(step.emailType, template);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        {template ? 'Edit' : 'Setup'}
                      </Badge>
                    }
                    onClick={() => step.emailType && onEditEmail(step.emailType, template)}
                  />
                </div>
              );
            })}

            {/* Extra Steps (like goodbye email with condition) */}
            {sequence.extraSteps && sequence.extraSteps.map((step, index) => {
              if (step.type === 'condition') {
                return (
                  <WorkflowNode
                    key={`condition-${index}`}
                    icon={GitBranch}
                    iconBg="bg-gray-100 dark:bg-gray-800"
                    iconColor="text-gray-600"
                    title={step.title}
                    subtitle={step.subtitle}
                    badge={<Badge variant="outline" className="text-xs">Condition</Badge>}
                  />
                );
              }

              const template = step.emailType ? getTemplateForType(step.emailType) : undefined;
              const conditionEnabled = step.conditionField && settings
                ? (settings as unknown as Record<string, boolean>)[step.conditionField]
                : true;

              return (
                <div key={step.emailType || index}>
                  <WorkflowNode
                    icon={Send}
                    iconBg={conditionEnabled ? sequence.bgColor : 'bg-muted'}
                    iconColor={conditionEnabled ? sequence.color : 'text-muted-foreground'}
                    title={step.title}
                    subtitle={step.subtitle}
                    isLast={index === sequence.extraSteps!.length - 1}
                    badge={
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {step.conditionField && (
                          <Switch
                            checked={conditionEnabled}
                            onCheckedChange={(checked) => step.conditionField && onToggle(step.conditionField, checked)}
                            disabled={saving}
                          />
                        )}
                        <Badge
                          variant={template ? 'default' : 'outline'}
                          className={`text-xs cursor-pointer ${template ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:bg-muted'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            step.emailType && onEditEmail(step.emailType, template);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          {template ? 'Edit' : 'Setup'}
                        </Badge>
                      </div>
                    }
                    onClick={() => step.emailType && onEditEmail(step.emailType, template)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function EmailSequencesPage() {
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
  const [selectedSequence, setSelectedSequence] = useState<string>('dunning');
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
      const response = await fetch('/api/email-sequences');
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

  const fetchEmailLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/email-logs?limit=100');
      if (response.ok) {
        const data = await response.json();
        setEmailLogs(data.emails || []);
      }
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch logs when activity tab is selected
  useEffect(() => {
    if (selectedSequence === 'activity') {
      fetchEmailLogs();
    }
  }, [selectedSequence]);

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
      const defaultTemplate = DEFAULT_TEMPLATES[type];
      setEditingTemplate(null);
      setFormData({
        type,
        name: getTemplateName(type),
        subject: defaultTemplate?.subject || '',
        body: defaultTemplate?.body || '',
        is_active: true,
      });
      setIsCreating(true);
    }
    setIsEditing(true);
    setError(null);
  };

  const getTemplateName = (type: string): string => {
    const names: Record<string, string> = {
      dunning_1: 'Payment Failed - Gentle Notice',
      dunning_2: 'Payment Failed - Friendly Reminder',
      dunning_3: 'Payment Failed - Concerned Follow-up',
      dunning_4: 'Payment Failed - Final Notice',
      cancel_save_1: 'Cancel Save - Check-in',
      cancel_save_2: 'Cancel Save - Discount Offer',
      cancel_goodbye: 'Cancellation Confirmed',
      winback_1: 'Win-back - New Features',
      winback_2: 'Win-back - New Plans',
      winback_3: 'Win-back - Data Deletion Warning',
    };
    return names[type] || type;
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
      const response = await fetch('/api/email-sequences', {
        method: 'PUT',
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

  if (loading) {
    return (
      <AppLayout title="Email Sequences" description="Automated email workflows for customer retention">
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Loading sequences...</p>
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
                {isCreating ? 'Create Email' : 'Edit Email'}
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
                Save Email
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
              <label className="text-sm font-medium">Email Name *</label>
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
                Email is active
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

  // Get current sequence
  const currentSequence = SEQUENCES[selectedSequence];

  // Main view - Sidebar Layout
  return (
    <AppLayout title="Email Sequences" description="Automated email workflows for customer retention">
      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* Left Sidebar - Sequence List */}
        <div className="w-72 shrink-0">
          <div className="space-y-2">
            {Object.values(SEQUENCES).map((sequence) => {
              const Icon = sequence.icon;
              const isSelected = selectedSequence === sequence.id;
              const isEnabled = sequenceSettings
                ? (sequenceSettings as unknown as Record<string, boolean>)[sequence.enabledField]
                : false;

              return (
                <button
                  key={sequence.id}
                  onClick={() => setSelectedSequence(sequence.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? `${sequence.bgColor} ${sequence.borderColor} shadow-sm`
                      : 'bg-card hover:bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${isSelected ? 'bg-white/80 dark:bg-gray-900/50' : sequence.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${sequence.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium truncate ${isSelected ? '' : 'text-foreground'}`}>
                          {sequence.name.replace(' Sequence', '')}
                        </p>
                        <Badge
                          variant={isEnabled ? 'default' : 'secondary'}
                          className={`ml-2 text-xs ${isEnabled ? 'bg-emerald-600' : ''}`}
                        >
                          {isEnabled ? 'On' : 'Off'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {sequence.steps.length + (sequence.extraSteps?.length || 0)} emails
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Activity Tab */}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setSelectedSequence('activity')}
              className={`w-full p-4 rounded-xl border text-left transition-all ${
                selectedSequence === 'activity'
                  ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 shadow-sm'
                  : 'bg-card hover:bg-muted/50 border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${selectedSequence === 'activity' ? 'bg-white/80 dark:bg-gray-900/50' : 'bg-violet-50 dark:bg-violet-950/30'} flex items-center justify-center`}>
                  <Activity className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">Activity Log</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All sent emails
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Select a sequence to configure timing and customize email templates.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Selected Sequence Details or Activity Log */}
        <div className="flex-1 overflow-y-auto">
          {selectedSequence === 'activity' ? (
            // Activity Log View
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-violet-600" />
                      Email Activity Log
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      All emails sent by your sequences
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchEmailLogs}
                    disabled={loadingLogs}
                  >
                    {loadingLogs ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Refresh'
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : emailLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">No emails sent yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Emails will appear here once your sequences start sending
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-[2fr_1.5fr_1fr_100px] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                      <div>Recipient</div>
                      <div>Email Type</div>
                      <div>Sent</div>
                      <div>Status</div>
                    </div>
                    {/* Rows */}
                    {emailLogs.map((log) => (
                      <div
                        key={log.id}
                        className="grid grid-cols-[2fr_1.5fr_1fr_100px] gap-4 px-4 py-3 items-center hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium truncate">{log.customerEmail}</p>
                          <p className="text-xs text-muted-foreground truncate">{log.customerId}</p>
                        </div>
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {log.templateType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.sentAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        <div>
                          {log.status === 'clicked' ? (
                            <Badge className="bg-emerald-600 text-xs">
                              <MousePointerClick className="h-3 w-3 mr-1" />
                              Clicked
                            </Badge>
                          ) : log.status === 'opened' ? (
                            <Badge className="bg-blue-600 text-xs">
                              <MailOpen className="h-3 w-3 mr-1" />
                              Opened
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Sent
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : currentSequence ? (
            <SequenceCard
              sequence={currentSequence}
              settings={sequenceSettings}
              templates={templates}
              onToggle={(field, value) => saveSequenceSettings({ [field]: value } as Partial<SequenceSettings>)}
              onEditEmail={handleEdit}
              onUpdateDay={(field, value) => saveSequenceSettings({ [field]: value } as Partial<SequenceSettings>)}
              saving={savingSettings}
              alwaysExpanded
            />
          ) : null}
        </div>
      </div>
    </AppLayout>
  );
}
