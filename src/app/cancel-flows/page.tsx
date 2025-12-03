'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Loader2,
  AlertCircle,
  Check,
  Trash2,
  Eye,
  Star,
  Pencil,
  BarChart3,
  Users,
  Shield,
  ArrowLeft,
  ArrowRight,
  Copy,
  CheckCircle2,
  Code,
  Zap,
  Heart,
  RotateCcw,
  Tag,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';
import {
  YourFeedbackModal,
  ConsiderOtherPlansModal,
  SpecialOfferModal,
} from '@/components/modals';

interface FeedbackOption {
  id: string;
  label: string;
  letter: string;
}

interface Plan {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  period: string;
  highlights: string[];
}

interface CancelFlow {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  targetType: 'all' | 'product' | 'plan' | 'custom';
  targetPlanIds: string[];
  feedbackOptions: FeedbackOption[];
  alternativePlans: Plan[];
  discountPercent: number;
  discountDuration: number;
  impressions: number;
  cancellations: number;
  saves: number;
}

const DEFAULT_FEEDBACK_OPTIONS: FeedbackOption[] = [
  { id: 'too_expensive', label: 'Too expensive for what I get', letter: 'A' },
  { id: 'not_using', label: "I'm not using it enough", letter: 'B' },
  { id: 'missing_features', label: 'Missing features I need', letter: 'C' },
  { id: 'found_alternative', label: 'Found a better alternative', letter: 'D' },
  { id: 'other', label: 'Other reason', letter: 'E' },
];

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    originalPrice: 29,
    discountedPrice: 5.80,
    period: '/mo',
    highlights: ['5 projects', 'Basic analytics', 'Email support', '1GB storage'],
  },
  {
    id: 'pro',
    name: 'Pro',
    originalPrice: 79,
    discountedPrice: 15.80,
    period: '/mo',
    highlights: ['25 projects', 'Advanced analytics', 'Priority support', '10GB storage'],
  },
];

type PreviewStep = 'feedback' | 'plans' | 'offer';

// Code snippet component
function CodeSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </>
        )}
      </Button>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  iconColor,
  children,
  defaultOpen = true,
  stepNumber,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  stepNumber: number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white`}
          style={{ backgroundColor: iconColor }}
        >
          {stepNumber}
        </div>
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
        <span className="font-medium flex-1 text-left">{title}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-2 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

// Upgrade Modal Component
function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  currentFlowsCount,
  flowsLimit,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string | null;
  currentFlowsCount: number;
  flowsLimit: number;
}) {
  if (!isOpen) return null;

  const getUpgradePlan = () => {
    if (currentPlan === 'starter') return { name: 'Growth', price: '$19/mo', flows: 5 };
    if (currentPlan === 'growth') return { name: 'Scale', price: '$49/mo', flows: 'Unlimited' };
    return { name: 'Growth', price: '$19/mo', flows: 5 };
  };

  const upgradePlan = getUpgradePlan();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-md hover:bg-white/20 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Upgrade to Create More</h2>
          </div>
          <p className="text-white/80 text-sm">
            You've reached the limit of {flowsLimit} cancel flow{flowsLimit !== 1 ? 's' : ''} on your current plan.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Current Usage */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Usage</span>
              <Badge variant="secondary" className="capitalize">{currentPlan || 'Free'} Plan</Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-violet-600 h-2 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
              <span className="text-sm font-medium">{currentFlowsCount}/{flowsLimit}</span>
            </div>
          </div>

          {/* Upgrade Option */}
          <div className="mb-6 p-4 border-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{upgradePlan.name} Plan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{upgradePlan.price}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-violet-600">{upgradePlan.flows}</p>
                <p className="text-xs text-gray-500">cancel flows</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                {typeof upgradePlan.flows === 'number' ? `${upgradePlan.flows} Cancel Flows` : 'Unlimited Cancel Flows'}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Advanced analytics
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Priority support
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button asChild className="flex-1 bg-violet-600 hover:bg-violet-700">
              <Link href="/pricing">
                <Zap className="mr-2 h-4 w-4" />
                Upgrade Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CancelFlowsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [flows, setFlows] = useState<CancelFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editor state
  const [editingFlow, setEditingFlow] = useState<CancelFlow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Preview state
  const [previewStep, setPreviewStep] = useState<PreviewStep>('feedback');

  // Subscription limits
  const [cancelFlowsLimit, setCancelFlowsLimit] = useState<number>(-1); // -1 = unlimited
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  // Get edit mode from URL
  const editId = searchParams.get('edit');
  const isNew = searchParams.get('new') === 'true';
  const isEditing = !!(editId || isNew);

  // Map API response to CancelFlow
  const mapFlowFromApi = useCallback((f: Record<string, unknown>): CancelFlow => ({
    id: f.id as string,
    name: f.name as string,
    description: (f.description as string) || '',
    isActive: (f.is_active ?? f.isActive ?? true) as boolean,
    isDefault: (f.is_default ?? f.isDefault ?? false) as boolean,
    targetType: (f.target_type ?? f.targetType ?? 'all') as CancelFlow['targetType'],
    targetPlanIds: (f.target_plan_ids ?? f.targetPlanIds ?? []) as string[],
    feedbackOptions: (f.feedback_options ?? f.feedbackOptions ?? DEFAULT_FEEDBACK_OPTIONS) as FeedbackOption[],
    alternativePlans: (f.alternative_plans ?? f.alternativePlans ?? DEFAULT_PLANS) as Plan[],
    discountPercent: (f.discount_percent ?? f.discountPercent ?? 50) as number,
    discountDuration: (f.discount_duration ?? f.discountDuration ?? 3) as number,
    impressions: (f.impressions || 0) as number,
    cancellations: (f.cancellations || 0) as number,
    saves: (f.saves || 0) as number,
  }), []);

  const fetchFlows = useCallback(async () => {
    try {
      const response = await fetch('/api/cancel-flows');
      const data = await response.json();
      const mappedFlows = (data.flows || []).map(mapFlowFromApi);
      setFlows(mappedFlows);
      return mappedFlows;
    } catch (err) {
      setError('Failed to load cancel flows');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [mapFlowFromApi]);

  const fetchSubscriptionLimits = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        if (data.hasSubscription) {
          setCancelFlowsLimit(data.cancelFlowsLimit || -1);
          setCurrentPlan(data.plan);
        }
      }
    } catch (err) {
      console.error('Failed to fetch subscription limits:', err);
    }
  }, []);

  // Initial load and handle URL params for editing
  useEffect(() => {
    const loadData = async () => {
      const [loadedFlows] = await Promise.all([
        fetchFlows(),
        fetchSubscriptionLimits(),
      ]);

      if (editId && loadedFlows.length > 0) {
        const flowToEdit = loadedFlows.find((f: CancelFlow) => f.id === editId);
        if (flowToEdit) {
          setEditingFlow({ ...flowToEdit });
        } else {
          router.replace('/cancel-flows');
        }
      } else if (isNew) {
        setEditingFlow({
          id: '',
          name: 'My Cancel Flow',
          description: '',
          isActive: true,
          isDefault: false,
          targetType: 'all',
          targetPlanIds: [],
          feedbackOptions: [...DEFAULT_FEEDBACK_OPTIONS],
          alternativePlans: [...DEFAULT_PLANS],
          discountPercent: 50,
          discountDuration: 3,
          impressions: 0,
          cancellations: 0,
          saves: 0,
        });
      }
    };

    loadData();
  }, [editId, isNew, fetchFlows, fetchSubscriptionLimits, router]);

  // Check if user can create new flow
  const canCreateNewFlow = cancelFlowsLimit === -1 || flows.length < cancelFlowsLimit;

  const handleCreateNew = () => {
    if (!canCreateNewFlow) {
      setShowUpgradeModal(true);
      return;
    }
    router.push('/cancel-flows?new=true');
  };

  const handleEdit = (flow: CancelFlow) => {
    router.push(`/cancel-flows?edit=${flow.id}`);
  };

  const handleBack = () => {
    setEditingFlow(null);
    setShowSuccess(false);
    router.push('/cancel-flows');
  };

  const handleSave = async () => {
    if (!editingFlow) return;

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        id: editingFlow.id || undefined,
        name: editingFlow.name,
        description: editingFlow.description,
        is_active: editingFlow.isActive,
        is_default: editingFlow.isDefault,
        target_type: editingFlow.targetType,
        target_plan_ids: editingFlow.targetPlanIds,
        feedback_options: editingFlow.feedbackOptions,
        alternative_plans: editingFlow.alternativePlans,
        discount_percent: editingFlow.discountPercent,
        discount_duration: editingFlow.discountDuration,
      };

      const response = await fetch('/api/cancel-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save');

      const data = await response.json();
      const savedFlow = data.flow ? mapFlowFromApi(data.flow) : null;

      if (savedFlow) {
        setEditingFlow(savedFlow);
        if (!editingFlow.id) {
          router.replace(`/cancel-flows?edit=${savedFlow.id}`);
        }
      }

      setShowSuccess(true);
      fetchFlows();
    } catch (err) {
      setError('Failed to save cancel flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cancel flow?')) return;

    try {
      const response = await fetch(`/api/cancel-flows?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to delete');
        return;
      }

      setSuccess('Cancel flow deleted');
      setTimeout(() => setSuccess(null), 3000);
      fetchFlows();
    } catch (err) {
      setError('Failed to delete cancel flow');
    }
  };

  const handleToggleActive = async (flow: CancelFlow) => {
    try {
      await fetch('/api/cancel-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: flow.id,
          is_active: !flow.isActive
        }),
      });
      fetchFlows();
    } catch (err) {
      setError('Failed to update cancel flow');
    }
  };

  const handleSetDefault = async (flow: CancelFlow) => {
    try {
      await fetch('/api/cancel-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: flow.id,
          is_default: true
        }),
      });
      fetchFlows();
    } catch (err) {
      setError('Failed to set default flow');
    }
  };

  const updateEditingFlow = (field: string, value: unknown) => {
    if (!editingFlow) return;
    setEditingFlow({ ...editingFlow, [field]: value });
  };

  const updateFeedbackOption = (index: number, field: keyof FeedbackOption, value: string) => {
    if (!editingFlow) return;
    const newOptions = [...editingFlow.feedbackOptions];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setEditingFlow({ ...editingFlow, feedbackOptions: newOptions });
  };

  const addFeedbackOption = () => {
    if (!editingFlow) return;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nextLetter = letters[editingFlow.feedbackOptions.length] || 'X';
    const newOptions = [...editingFlow.feedbackOptions, { id: `option_${Date.now()}`, label: '', letter: nextLetter }];
    setEditingFlow({ ...editingFlow, feedbackOptions: newOptions });
  };

  const removeFeedbackOption = (index: number) => {
    if (!editingFlow) return;
    const newOptions = editingFlow.feedbackOptions.filter((_, i) => i !== index);
    // Re-assign letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const updatedOptions = newOptions.map((opt, i) => ({ ...opt, letter: letters[i] || 'X' }));
    setEditingFlow({ ...editingFlow, feedbackOptions: updatedOptions });
  };

  const updatePlan = (index: number, field: keyof Plan, value: string | number | string[]) => {
    if (!editingFlow) return;
    const newPlans = [...editingFlow.alternativePlans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setEditingFlow({ ...editingFlow, alternativePlans: newPlans });
  };

  const updatePlanHighlight = (planIndex: number, highlightIndex: number, value: string) => {
    if (!editingFlow) return;
    const newPlans = [...editingFlow.alternativePlans];
    const newHighlights = [...newPlans[planIndex].highlights];
    newHighlights[highlightIndex] = value;
    newPlans[planIndex] = { ...newPlans[planIndex], highlights: newHighlights };
    setEditingFlow({ ...editingFlow, alternativePlans: newPlans });
  };

  const addPlanHighlight = (planIndex: number) => {
    if (!editingFlow) return;
    const newPlans = [...editingFlow.alternativePlans];
    newPlans[planIndex] = {
      ...newPlans[planIndex],
      highlights: [...newPlans[planIndex].highlights, '']
    };
    setEditingFlow({ ...editingFlow, alternativePlans: newPlans });
  };

  const removePlanHighlight = (planIndex: number, highlightIndex: number) => {
    if (!editingFlow) return;
    const newPlans = [...editingFlow.alternativePlans];
    newPlans[planIndex] = {
      ...newPlans[planIndex],
      highlights: newPlans[planIndex].highlights.filter((_, i) => i !== highlightIndex)
    };
    setEditingFlow({ ...editingFlow, alternativePlans: newPlans });
  };

  const addPlan = () => {
    if (!editingFlow) return;
    const newPlan: Plan = {
      id: `plan_${Date.now()}`,
      name: 'New Plan',
      originalPrice: 49,
      discountedPrice: 9.80,
      period: '/mo',
      highlights: ['Feature 1', 'Feature 2'],
    };
    setEditingFlow({ ...editingFlow, alternativePlans: [...editingFlow.alternativePlans, newPlan] });
  };

  const removePlan = (index: number) => {
    if (!editingFlow) return;
    const newPlans = editingFlow.alternativePlans.filter((_, i) => i !== index);
    setEditingFlow({ ...editingFlow, alternativePlans: newPlans });
  };

  // Generate integration code
  const getIntegrationCode = (flowId: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    return `<!-- ChurnBuddy Cancel Flow -->
<script src="${baseUrl}/embed/churnbuddy.js"></script>
<script>
  ChurnBuddy.init({
    flowId: '${flowId}',
    onCancel: function(data) {
      console.log('User cancelled:', data);
    },
    onSave: function(data) {
      console.log('User saved:', data);
    }
  });
</script>`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading cancel flows...</p>
        </div>
      </div>
    );
  }

  // Success screen after saving
  if (showSuccess && editingFlow?.id) {
    return (
      <div className="min-h-screen bg-background">
        {/* Simple Header */}
        <header className="border-b bg-background">
          <div className="flex items-center justify-between px-6 h-14">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">ChurnBuddy</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center py-24">
          <div className="max-w-2xl w-full mx-auto px-6">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl">Your cancel flow is ready!</CardTitle>
                <CardDescription>
                  Add the following code to your website to enable the cancel flow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Flow Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{editingFlow.name}</span>
                    <Badge variant="default" className="bg-emerald-600">Active</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Feedback options: {editingFlow.feedbackOptions.length}</p>
                    <p>Alternative plans: {editingFlow.alternativePlans.length}</p>
                    <p>Special offer: {editingFlow.discountPercent}% off for {editingFlow.discountDuration} months</p>
                  </div>
                </div>

                {/* Integration Code */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Integration Code</label>
                  </div>
                  <CodeSnippet code={getIntegrationCode(editingFlow.id)} />
                </div>

                {/* Flow ID */}
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Flow ID</p>
                  <code className="text-sm font-mono">{editingFlow.id}</code>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowSuccess(false)} className="flex-1">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Flow
                  </Button>
                  <Button onClick={handleBack} className="flex-1">
                    Done
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Editor view - Full screen with 40/60 split
  if (isEditing && editingFlow) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Simple Header */}
        <header className="border-b bg-background shrink-0">
          <div className="flex items-center justify-between px-6 h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <input
                type="text"
                value={editingFlow.name}
                onChange={(e) => updateEditingFlow('name', e.target.value)}
                className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 min-w-[200px]"
                placeholder="Flow name..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBack}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Flow
              </Button>
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">×</button>
          </div>
        )}

        {/* Main Content - 40/60 Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Editor (40%) */}
          <div className="w-[40%] border-r overflow-y-auto p-6 space-y-4">
            {/* Step Selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setPreviewStep('feedback')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  previewStep === 'feedback'
                    ? 'bg-background shadow text-[#9333EA]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                1. Feedback
              </button>
              <button
                onClick={() => setPreviewStep('plans')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  previewStep === 'plans'
                    ? 'bg-background shadow text-[#606C80]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                2. Plans
              </button>
              <button
                onClick={() => setPreviewStep('offer')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  previewStep === 'offer'
                    ? 'bg-background shadow text-[#DC2626]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                3. Offer
              </button>
            </div>

            {/* Step 1: Feedback Options */}
            <CollapsibleSection
              title="Feedback Survey"
              icon={Heart}
              iconColor="#9333EA"
              stepNumber={1}
              defaultOpen={previewStep === 'feedback'}
            >
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Configure the exit survey options shown to users
                </p>
                {editingFlow.feedbackOptions.map((option, index) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#F5F3FF] text-[#9333EA] flex items-center justify-center text-xs font-medium shrink-0">
                      {option.letter}
                    </div>
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => updateFeedbackOption(index, 'label', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
                      placeholder="Feedback option..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFeedbackOption(index)}
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addFeedbackOption} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </CollapsibleSection>

            {/* Step 2: Alternative Plans */}
            <CollapsibleSection
              title="Alternative Plans"
              icon={RotateCcw}
              iconColor="#606C80"
              stepNumber={2}
              defaultOpen={previewStep === 'plans'}
            >
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure the alternative plans to offer
                </p>
                {editingFlow.alternativePlans.map((plan, planIndex) => (
                  <div key={plan.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={plan.name}
                        onChange={(e) => updatePlan(planIndex, 'name', e.target.value)}
                        className="font-medium bg-transparent border-none focus:outline-none text-base"
                        placeholder="Plan name..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlan(planIndex)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Original Price</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">$</span>
                          <input
                            type="number"
                            value={plan.originalPrice}
                            onChange={(e) => updatePlan(planIndex, 'originalPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded border border-input bg-background text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Discounted Price</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={plan.discountedPrice}
                            onChange={(e) => updatePlan(planIndex, 'discountedPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded border border-input bg-background text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-muted-foreground mb-2 block">Features</label>
                      <div className="space-y-2">
                        {plan.highlights.map((highlight, hIndex) => (
                          <div key={hIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={highlight}
                              onChange={(e) => updatePlanHighlight(planIndex, hIndex, e.target.value)}
                              className="flex-1 px-2 py-1 rounded border border-input bg-background text-sm"
                              placeholder="Feature..."
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePlanHighlight(planIndex, hIndex)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addPlanHighlight(planIndex)}
                          className="w-full h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Feature
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPlan} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Plan
                </Button>
              </div>
            </CollapsibleSection>

            {/* Step 3: Special Offer */}
            <CollapsibleSection
              title="Special Offer"
              icon={Tag}
              iconColor="#DC2626"
              stepNumber={3}
              defaultOpen={previewStep === 'offer'}
            >
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure the final discount offer
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount %</label>
                    <input
                      type="number"
                      min="5"
                      max="90"
                      value={editingFlow.discountPercent}
                      onChange={(e) => updateEditingFlow('discountPercent', parseInt(e.target.value) || 50)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (months)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={editingFlow.discountDuration}
                      onChange={(e) => updateEditingFlow('discountDuration', parseInt(e.target.value) || 3)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                    />
                  </div>
                </div>
                <div className="p-4 bg-[#FEF2F2] rounded-lg border border-red-200">
                  <p className="text-sm text-[#DC2626] font-medium">
                    Preview: {editingFlow.discountPercent}% off for {editingFlow.discountDuration} months
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    This offer will be shown as the last step before cancellation
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* Right Side - Preview (60%) */}
          <div
            className="w-[60%] overflow-y-auto flex items-center justify-center"
            style={{
              backgroundColor: '#f5f5f5',
              backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            <div className="relative">
              {/* Step Navigation */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={() => setPreviewStep('feedback')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    previewStep === 'feedback'
                      ? 'bg-[#9333EA] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Step 1
                </button>
                <button
                  onClick={() => setPreviewStep('plans')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    previewStep === 'plans'
                      ? 'bg-[#606C80] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Step 2
                </button>
                <button
                  onClick={() => setPreviewStep('offer')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    previewStep === 'offer'
                      ? 'bg-[#DC2626] text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Step 3
                </button>
              </div>

              {/* Modal Previews */}
              <YourFeedbackModal
                isOpen={previewStep === 'feedback'}
                onClose={() => {}}
                onBack={() => {}}
                onNext={() => setPreviewStep('plans')}
                options={editingFlow.feedbackOptions}
                previewMode
              />
              <ConsiderOtherPlansModal
                isOpen={previewStep === 'plans'}
                onClose={() => {}}
                onBack={() => setPreviewStep('feedback')}
                onDecline={() => setPreviewStep('offer')}
                onSwitchPlan={() => {}}
                plans={editingFlow.alternativePlans}
                previewMode
              />
              <SpecialOfferModal
                isOpen={previewStep === 'offer'}
                onClose={() => {}}
                onBack={() => setPreviewStep('plans')}
                onDecline={() => {}}
                onAcceptOffer={() => {}}
                discountPercent={editingFlow.discountPercent}
                discountDuration={`${editingFlow.discountDuration} months`}
                previewMode
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View - with sidebar
  return (
    <AppLayout
      title="Cancel Flows"
      description="Create cancel flows for different products or customer segments to maximize retention."
      actions={
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Cancel Flow
        </Button>
      }
    >
      <div className="max-w-5xl">
        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">×</button>
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 p-4 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        {flows.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No cancel flows yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first cancel flow to start reducing churn.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Cancel Flow
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {flows.map((flow) => {
              const saveRate = flow.impressions > 0
                ? Math.round((flow.saves / flow.impressions) * 100)
                : 0;

              return (
                <Card key={flow.id} className={`${!flow.isActive ? 'opacity-60' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{flow.name}</h3>
                          {flow.isDefault && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3 w-3" />
                              Default
                            </Badge>
                          )}
                          <Badge variant={flow.isActive ? 'default' : 'secondary'} className={flow.isActive ? 'bg-emerald-600' : ''}>
                            {flow.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {flow.description || `Target: ${flow.targetType === 'all' ? 'All customers' : flow.targetType}`}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{flow.impressions} impressions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span>{flow.saves} saves ({saveRate}%)</span>
                          </div>
                          <div className="text-muted-foreground">
                            {flow.discountPercent}% off for {flow.discountDuration} months
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(flow)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(flow)}
                        >
                          {flow.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        {!flow.isDefault && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(flow)}
                            >
                              Set Default
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(flow.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={currentPlan}
          currentFlowsCount={flows.length}
          flowsLimit={cancelFlowsLimit}
        />
      </div>
    </AppLayout>
  );
}

// Loading fallback for Suspense
function CancelFlowsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading cancel flows...</p>
      </div>
    </div>
  );
}

// Wrapper with Suspense boundary for useSearchParams
export default function CancelFlowsPage() {
  return (
    <Suspense fallback={<CancelFlowsLoading />}>
      <CancelFlowsPageContent />
    </Suspense>
  );
}
