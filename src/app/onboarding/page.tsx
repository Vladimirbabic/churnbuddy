'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  CreditCard,
  Mail,
  Settings,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AuthGuard } from '@/components/AuthGuard';

// Types
interface OnboardingData {
  stripe: {
    secretKey: string;
    webhookSecret: string;
    testMode: boolean;
  };
  email: {
    provider: 'resend' | 'sendgrid';
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  cancelFlow: {
    enabled: boolean;
    discountPercent: number;
    discountDuration: number;
    companyName: string;
  };
  branding: {
    companyName: string;
    primaryColor: string;
  };
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'stripe', title: 'Connect Stripe', icon: CreditCard },
  { id: 'email', title: 'Email Setup', icon: Mail },
  { id: 'cancel-flow', title: 'Cancel Flow', icon: Settings },
  { id: 'complete', title: 'Complete', icon: Check },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    stripe: {
      secretKey: '',
      webhookSecret: '',
      testMode: true,
    },
    email: {
      provider: 'resend',
      apiKey: '',
      fromEmail: '',
      fromName: '',
    },
    cancelFlow: {
      enabled: true,
      discountPercent: 20,
      discountDuration: 3,
      companyName: '',
    },
    branding: {
      companyName: '',
      primaryColor: '#3b82f6',
    },
  });

  const progress = ((currentStep) / (STEPS.length - 1)) * 100;

  const updateData = (section: keyof OnboardingData, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const validateStep = (): boolean => {
    setError(null);

    switch (STEPS[currentStep].id) {
      case 'stripe':
        if (!data.stripe.secretKey) {
          setError('Please enter your Stripe Secret Key');
          return false;
        }
        if (!data.stripe.secretKey.startsWith('sk_')) {
          setError('Invalid Stripe Secret Key format. It should start with sk_');
          return false;
        }
        break;
      case 'email':
        if (!data.email.apiKey) {
          setError('Please enter your email provider API key');
          return false;
        }
        if (!data.email.fromEmail) {
          setError('Please enter a from email address');
          return false;
        }
        if (!data.email.fromEmail.includes('@')) {
          setError('Please enter a valid email address');
          return false;
        }
        break;
      case 'cancel-flow':
        // Company name is optional
        break;
    }

    return true;
  };

  const nextStep = async () => {
    if (!validateStep()) return;

    if (currentStep === STEPS.length - 2) {
      // Save all settings before going to complete
      setIsLoading(true);
      try {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            onboardingCompleted: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save settings');
        }

        setCurrentStep(prev => prev + 1);
      } catch (err) {
        setError('Failed to save settings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/stripe`
    : 'https://your-domain.com/api/webhooks/stripe';

  return (
    <AuthGuard>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Exit Loop</span>
          </div>
          <Badge variant="secondary">Setup Wizard</Badge>
        </div>
      </header>

      <main className="container max-w-3xl py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium">{STEPS[currentStep].title}</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isComplete
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isCurrent
                        ? 'border-primary bg-primary/10'
                        : 'border-muted'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Step Content */}
        <Card>
          {/* Welcome Step */}
          {STEPS[currentStep].id === 'welcome' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Welcome to Exit Loop!</CardTitle>
                <CardDescription className="text-base">
                  Let's get you set up in just a few minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Connect Stripe</h3>
                      <p className="text-sm text-muted-foreground">
                        We'll listen to payment events to handle failed payments automatically
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Set Up Email</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure email delivery for dunning and notification emails
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg border">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                      <Settings className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Configure Cancel Flow</h3>
                      <p className="text-sm text-muted-foreground">
                        Customize your save offers and exit surveys
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  This should take about 5 minutes. You can always change these settings later.
                </p>
              </CardContent>
            </>
          )}

          {/* Stripe Step */}
          {STEPS[currentStep].id === 'stripe' && (
            <>
              <CardHeader>
                <CardTitle>Connect Stripe</CardTitle>
                <CardDescription>
                  Enter your Stripe API keys to enable payment monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test/Live mode toggle */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Start with test mode to verify your integration
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={data.stripe.testMode ? 'default' : 'outline'}
                      onClick={() => updateData('stripe', 'testMode', true)}
                    >
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant={!data.stripe.testMode ? 'default' : 'outline'}
                      onClick={() => updateData('stripe', 'testMode', false)}
                    >
                      Live
                    </Button>
                  </div>
                </div>

                {/* Secret Key */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Secret Key <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets['stripeSecret'] ? 'text' : 'password'}
                      value={data.stripe.secretKey}
                      onChange={(e) => updateData('stripe', 'secretKey', e.target.value)}
                      placeholder={data.stripe.testMode ? 'sk_test_...' : 'sk_live_...'}
                      className="w-full px-3 py-2 pr-20 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('stripeSecret')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets['stripeSecret'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Find this in your{' '}
                    <a
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Stripe Dashboard <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook Endpoint</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={webhookUrl}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-muted text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                    >
                      {copiedField === 'webhook' ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add this URL in{' '}
                    <a
                      href="https://dashboard.stripe.com/webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Stripe Webhooks <ExternalLink className="h-3 w-3" />
                    </a>
                    {' '}and select these events: invoice.payment_failed, customer.subscription.deleted, customer.subscription.updated
                  </p>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook Signing Secret</label>
                  <div className="relative">
                    <input
                      type={showSecrets['webhookSecret'] ? 'text' : 'password'}
                      value={data.stripe.webhookSecret}
                      onChange={(e) => updateData('stripe', 'webhookSecret', e.target.value)}
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('webhookSecret')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets['webhookSecret'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Revealed after creating the webhook endpoint in Stripe
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Email Step */}
          {STEPS[currentStep].id === 'email' && (
            <>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Set up your email provider to send dunning and notification emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Provider</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updateData('email', 'provider', 'resend')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        data.email.provider === 'resend'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium">Resend</p>
                      <p className="text-sm text-muted-foreground">Modern email API</p>
                    </button>
                    <button
                      onClick={() => updateData('email', 'provider', 'sendgrid')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        data.email.provider === 'sendgrid'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium">SendGrid</p>
                      <p className="text-sm text-muted-foreground">Enterprise-grade</p>
                    </button>
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    API Key <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets['emailKey'] ? 'text' : 'password'}
                      value={data.email.apiKey}
                      onChange={(e) => updateData('email', 'apiKey', e.target.value)}
                      placeholder={data.email.provider === 'resend' ? 're_...' : 'SG...'}
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('emailKey')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets['emailKey'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.email.provider === 'resend' ? (
                      <>
                        Get your API key from{' '}
                        <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Resend Dashboard
                        </a>
                      </>
                    ) : (
                      <>
                        Get your API key from{' '}
                        <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          SendGrid Dashboard
                        </a>
                      </>
                    )}
                  </p>
                </div>

                {/* From Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    From Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={data.email.fromEmail}
                    onChange={(e) => updateData('email', 'fromEmail', e.target.value)}
                    placeholder="billing@yourcompany.com"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be a verified domain in your email provider
                  </p>
                </div>

                {/* From Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Name</label>
                  <input
                    type="text"
                    value={data.email.fromName}
                    onChange={(e) => updateData('email', 'fromName', e.target.value)}
                    placeholder="Your Company"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Cancel Flow Step */}
          {STEPS[currentStep].id === 'cancel-flow' && (
            <>
              <CardHeader>
                <CardTitle>Cancel Flow Configuration</CardTitle>
                <CardDescription>
                  Customize the save offer shown to customers trying to cancel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={data.cancelFlow.companyName || data.branding.companyName}
                    onChange={(e) => {
                      updateData('cancelFlow', 'companyName', e.target.value);
                      updateData('branding', 'companyName', e.target.value);
                    }}
                    placeholder="Acme Inc"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Shown in emails and the cancel flow modal
                  </p>
                </div>

                {/* Discount Settings */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <h3 className="font-medium">Save Offer</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Discount Percentage</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="5"
                          max="50"
                          value={data.cancelFlow.discountPercent}
                          onChange={(e) => updateData('cancelFlow', 'discountPercent', parseInt(e.target.value) || 20)}
                          className="w-20 px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={data.cancelFlow.discountDuration}
                          onChange={(e) => updateData('cancelFlow', 'discountDuration', parseInt(e.target.value) || 3)}
                          className="w-20 px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <span className="text-muted-foreground">months</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Preview: Customers will see an offer for{' '}
                      <strong>{data.cancelFlow.discountPercent}% off</strong> for{' '}
                      <strong>{data.cancelFlow.discountDuration} months</strong>
                    </p>
                  </div>
                </div>

                {/* Brand Color */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={data.branding.primaryColor}
                      onChange={(e) => updateData('branding', 'primaryColor', e.target.value)}
                      className="h-10 w-14 rounded border border-input cursor-pointer"
                    />
                    <input
                      type="text"
                      value={data.branding.primaryColor}
                      onChange={(e) => updateData('branding', 'primaryColor', e.target.value)}
                      className="w-28 px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Complete Step */}
          {STEPS[currentStep].id === 'complete' && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl">You're all set!</CardTitle>
                <CardDescription className="text-base">
                  Exit Loop is now configured and ready to help you reduce churn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                    <Check className="h-5 w-5" />
                    <span>Stripe connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                    <Check className="h-5 w-5" />
                    <span>Email configured</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                    <Check className="h-5 w-5" />
                    <span>Cancel flow ready</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <h3 className="font-medium mb-2">Next Steps</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">1.</span>
                      Add the cancel flow component to your app's settings page
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">2.</span>
                      Test a failed payment in Stripe test mode
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">3.</span>
                      Monitor your dashboard for events
                    </li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          {STEPS[currentStep].id !== 'complete' && (
            <div className="flex items-center justify-between p-6 pt-0">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={nextStep} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {currentStep === STEPS.length - 2 ? 'Complete Setup' : 'Continue'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
    </AuthGuard>
  );
}
