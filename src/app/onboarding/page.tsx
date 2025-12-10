'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Building2,
  CreditCard,
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
  Mail,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AuthGuard } from '@/components/AuthGuard';

// Types
interface OnboardingData {
  company: {
    fullName: string;
    name: string;
    website: string;
  };
  stripe: {
    secretKey: string;
    webhookSecret: string;
    testMode: boolean;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'company', title: 'Company Info', icon: Building2 },
  { id: 'stripe', title: 'Connect Stripe', icon: CreditCard },
  { id: 'resend', title: 'Connect Resend', icon: Mail },
  { id: 'complete', title: 'Complete', icon: Check },
];

const WEBHOOK_URL = 'https://churnbuddy.vercel.app/api/billing/webhook';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [data, setData] = useState<OnboardingData>({
    company: {
      fullName: '',
      name: '',
      website: '',
    },
    stripe: {
      secretKey: '',
      webhookSecret: '',
      testMode: false,
    },
    resend: {
      apiKey: '',
      fromEmail: '',
      fromName: '',
    },
  });

  const progress = ((currentStep) / (STEPS.length - 1)) * 100;

  const updateData = (section: keyof OnboardingData, field: string, value: string | boolean) => {
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
      case 'company':
        if (!data.company.fullName.trim()) {
          setError('Please enter your full name');
          return false;
        }
        if (!data.company.name.trim()) {
          setError('Please enter your company name');
          return false;
        }
        break;
      case 'stripe':
        if (!data.stripe.secretKey) {
          setError('Please enter your Stripe Secret Key');
          return false;
        }
        if (!data.stripe.secretKey.startsWith('sk_')) {
          setError('Invalid Stripe Secret Key format. It should start with sk_');
          return false;
        }
        if (!data.stripe.webhookSecret) {
          setError('Please enter your Webhook Signing Secret');
          return false;
        }
        if (!data.stripe.webhookSecret.startsWith('whsec_')) {
          setError('Invalid Webhook Secret format. It should start with whsec_');
          return false;
        }
        break;
      case 'resend':
        if (!data.resend.apiKey) {
          setError('Please enter your Resend API Key');
          return false;
        }
        if (!data.resend.apiKey.startsWith('re_')) {
          setError('Invalid Resend API Key format. It should start with re_');
          return false;
        }
        if (!data.resend.fromEmail) {
          setError('Please enter your from email address');
          return false;
        }
        if (!data.resend.fromEmail.includes('@')) {
          setError('Please enter a valid email address');
          return false;
        }
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
            onboarding_completed: true,
            branding: {
              companyName: data.company.name,
              fullName: data.company.fullName,
              website: data.company.website,
            },
            stripe: {
              secretKey: data.stripe.secretKey,
              webhookSecret: data.stripe.webhookSecret,
              testMode: data.stripe.testMode,
            },
            email: {
              provider: 'resend',
              apiKey: data.resend.apiKey,
              fromEmail: data.resend.fromEmail,
              fromName: data.resend.fromName || data.company.name,
            },
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

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/img/logo.svg"
              alt="Exit Loop"
              width={90}
              height={24}
              className="h-6 w-auto dark:hidden"
            />
            <Image
              src="/img/logo-dark-mode.svg"
              alt="Exit Loop"
              width={90}
              height={24}
              className="h-6 w-auto hidden dark:block"
            />
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">Setup Wizard</Badge>
        </div>
      </header>

      <main className="container max-w-3xl py-12 px-4">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-semibold text-primary">{STEPS[currentStep].title}</span>
          </div>
          <Progress value={progress} className="h-2 bg-muted/50" />

          {/* Step indicators with connecting lines */}
          <div className="relative flex justify-between mt-8">
            {/* Connecting line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted mx-12" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-primary mx-12 transition-all duration-500"
              style={{ width: `calc(${(currentStep / (STEPS.length - 1)) * 100}% - 6rem)` }}
            />

            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div
                  key={step.id}
                  className={`relative flex flex-col items-center gap-2 transition-all duration-300 ${
                    index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background shadow-sm ${
                      isComplete
                        ? 'bg-primary border-primary text-primary-foreground shadow-primary/25'
                        : isCurrent
                        ? 'border-primary bg-primary/10 shadow-primary/20 ring-4 ring-primary/10'
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className={`h-5 w-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                    )}
                  </div>
                  <span className={`text-xs hidden sm:block font-medium transition-colors ${isCurrent ? 'text-primary' : ''}`}>
                    {step.title}
                  </span>
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
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          {/* Welcome Step */}
          {STEPS[currentStep].id === 'welcome' && (
            <>
              <CardHeader className="text-center pb-2 pt-8">
                <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10 ring-1 ring-primary/10">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Welcome to Exit Loop!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Let's get you set up in just a few minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <div className="grid gap-3">
                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 hover:shadow-md transition-all duration-200 group">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Tell us about you</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Your name and company details for personalization
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 hover:shadow-md transition-all duration-200 group">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Connect Stripe</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Set up webhooks and API keys for subscription management
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20 hover:shadow-md transition-all duration-200 group">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Connect Resend</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Enable automated email sequences to recover customers
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  This should take about 5 minutes. You can always change these settings later.
                </p>
              </CardContent>
            </>
          )}

          {/* Company Info Step */}
          {STEPS[currentStep].id === 'company' && (
            <>
              <CardHeader>
                <CardTitle>Tell us about yourself</CardTitle>
                <CardDescription>
                  This information helps us personalize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.company.fullName}
                    onChange={(e) => updateData('company', 'fullName', e.target.value)}
                    placeholder="John Smith"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.company.name}
                    onChange={(e) => updateData('company', 'name', e.target.value)}
                    placeholder="Acme Inc"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be shown in your cancel flows and customer emails
                  </p>
                </div>

                {/* Company Website */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Website
                  </label>
                  <input
                    type="url"
                    value={data.company.website}
                    onChange={(e) => updateData('company', 'website', e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Stripe Step */}
          {STEPS[currentStep].id === 'stripe' && (
            <>
              <CardHeader>
                <CardTitle>Connect Stripe</CardTitle>
                <CardDescription>
                  Follow these steps to connect your Stripe account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test/Live mode toggle */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use live mode for production, or test mode to try things out
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={!data.stripe.testMode ? 'default' : 'outline'}
                      onClick={() => updateData('stripe', 'testMode', false)}
                    >
                      Live
                    </Button>
                    <Button
                      size="sm"
                      variant={data.stripe.testMode ? 'default' : 'outline'}
                      onClick={() => updateData('stripe', 'testMode', true)}
                    >
                      Test
                    </Button>
                  </div>
                </div>

                {/* Step 1: Create Webhook */}
                <div className="space-y-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <h3 className="font-medium">Create a Webhook in Stripe</h3>
                  </div>

                  <ol className="space-y-3 text-sm text-muted-foreground ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">a.</span>
                      <span>
                        Go to your{' '}
                        <a
                          href="https://dashboard.stripe.com/developers"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Stripe Developer Dashboard <ExternalLink className="h-3 w-3" />
                        </a>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">b.</span>
                      <span>Click on <strong>"Webhooks"</strong> in the left sidebar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">c.</span>
                      <span>Click <strong>"Add endpoint"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">d.</span>
                      <span>Enter this URL as the endpoint:</span>
                    </li>
                  </ol>

                  <div className="flex gap-2 ml-8">
                    <input
                      type="text"
                      value={WEBHOOK_URL}
                      readOnly
                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-muted text-sm font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(WEBHOOK_URL, 'webhook')}
                    >
                      {copiedField === 'webhook' ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <ol className="space-y-3 text-sm text-muted-foreground ml-8" start={5}>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">e.</span>
                      <span>Select events to listen to: <code className="bg-muted px-1 rounded">invoice.payment_failed</code>, <code className="bg-muted px-1 rounded">customer.subscription.deleted</code>, <code className="bg-muted px-1 rounded">customer.subscription.updated</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">f.</span>
                      <span>Click <strong>"Add endpoint"</strong> to create it</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">g.</span>
                      <span>Click on the newly created webhook, then click <strong>"Reveal"</strong> under Signing secret</span>
                    </li>
                  </ol>
                </div>

                {/* Webhook Secret Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Webhook Signing Secret <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets['webhookSecret'] ? 'text' : 'password'}
                      value={data.stripe.webhookSecret}
                      onChange={(e) => updateData('stripe', 'webhookSecret', e.target.value)}
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
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
                    Copy the signing secret that starts with <code className="bg-muted px-1 rounded">whsec_</code>
                  </p>
                </div>

                {/* Step 2: Get API Key */}
                <div className="space-y-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <h3 className="font-medium">Get your API Secret Key</h3>
                  </div>

                  <ol className="space-y-3 text-sm text-muted-foreground ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">a.</span>
                      <span>
                        Go to{' '}
                        <a
                          href="https://dashboard.stripe.com/apikeys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Stripe API Keys <ExternalLink className="h-3 w-3" />
                        </a>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">b.</span>
                      <span>Under <strong>"Standard keys"</strong>, find the <strong>"Secret key"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">c.</span>
                      <span>Click <strong>"Reveal {data.stripe.testMode ? 'test' : 'live'} key"</strong> and copy it</span>
                    </li>
                  </ol>
                </div>

                {/* Secret Key Input */}
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
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
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
                    Your secret key starts with <code className="bg-muted px-1 rounded">{data.stripe.testMode ? 'sk_test_' : 'sk_live_'}</code>
                  </p>
                </div>

                {/* Security Note */}
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Security:</strong> Your API keys are encrypted and stored securely. We never share your keys with third parties.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Resend Step */}
          {STEPS[currentStep].id === 'resend' && (
            <>
              <CardHeader>
                <CardTitle>Connect Resend</CardTitle>
                <CardDescription>
                  Set up Resend to send automated email sequences to your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Get API Key */}
                <div className="space-y-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <h3 className="font-medium">Get your Resend API Key</h3>
                  </div>

                  <ol className="space-y-3 text-sm text-muted-foreground ml-8">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">a.</span>
                      <span>
                        Go to{' '}
                        <a
                          href="https://resend.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Resend API Keys <ExternalLink className="h-3 w-3" />
                        </a>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">b.</span>
                      <span>Click <strong>"Create API Key"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">c.</span>
                      <span>Give it a name (e.g., "Exit Loop") and set permissions to <strong>"Full access"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-medium">d.</span>
                      <span>Copy the API key that starts with <code className="bg-muted px-1 rounded">re_</code></span>
                    </li>
                  </ol>
                </div>

                {/* API Key Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Resend API Key <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets['resendKey'] ? 'text' : 'password'}
                      value={data.resend.apiKey}
                      onChange={(e) => updateData('resend', 'apiKey', e.target.value)}
                      placeholder="re_..."
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('resendKey')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets['resendKey'] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 2: Configure sender */}
                <div className="space-y-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <h3 className="font-medium">Configure your sender details</h3>
                  </div>

                  <p className="text-sm text-muted-foreground ml-8">
                    Make sure you've verified your domain in Resend before using a custom from email.
                    <a
                      href="https://resend.com/domains"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 ml-1"
                    >
                      Manage domains <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>

                {/* From Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    From Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={data.resend.fromEmail}
                    onChange={(e) => updateData('resend', 'fromEmail', e.target.value)}
                    placeholder="hello@yourcompany.com"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    The email address your customers will see in their inbox
                  </p>
                </div>

                {/* From Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={data.resend.fromName}
                    onChange={(e) => updateData('resend', 'fromName', e.target.value)}
                    placeholder={data.company.name || 'Your Company'}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">
                    Defaults to your company name if left empty
                  </p>
                </div>

                {/* Info Note */}
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    <strong>Tip:</strong> Resend offers 3,000 free emails per month. This is enough for most SaaS businesses starting out.
                  </p>
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
                    <span>Company info saved</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                    <Check className="h-5 w-5" />
                    <span>Stripe connected</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                    <Check className="h-5 w-5" />
                    <span>Resend connected</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg border bg-muted/30">
                  <h3 className="font-medium mb-2">Next Steps</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">1.</span>
                      Create your first cancel flow in the Cancel Flows section
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">2.</span>
                      Add the cancel flow script to your app
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">3.</span>
                      Monitor your dashboard for saved customers
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
            <div className="flex items-center justify-between p-6 pt-0 border-t bg-muted/30">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="hover:bg-background"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={nextStep}
                disabled={isLoading}
                size="lg"
                className="px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
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
