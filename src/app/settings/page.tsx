'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Mail,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Building2,
  Globe,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/AppLayout';
import { EmailSettingsTab } from '@/components/EmailSettingsTab';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    company: {
      fullName: '',
      companyName: '',
      website: '',
    },
    stripe: {
      isConnected: false,
      test: {
        secretKey: '',
        webhookSecret: '',
      },
      live: {
        secretKey: '',
        webhookSecret: '',
      },
    },
    email: {
      provider: 'resend' as const,
      apiKey: '',
      fromEmail: '',
      fromName: '',
      isConnected: false,
    },
    cancelFlow: {
      enabled: true,
      discountPercent: 20,
      discountDuration: 3,
      companyName: '',
    },
    dunning: {
      enabled: true,
      maxAttempts: 3,
    },
  });

  // Track which stripe mode is being viewed/edited
  const [stripeViewMode, setStripeViewMode] = useState<'test' | 'live'>('live');

  useEffect(() => {
    fetchCsrfToken();
    fetchSettings();
  }, []);

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch('/api/csrf');
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.token);
      }
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        // Map snake_case API response to camelCase for component
        setSettings(prev => ({
          ...prev,
          company: {
            ...prev.company,
            fullName: data.branding?.full_name || '',
            companyName: data.branding?.company_name || '',
            website: data.branding?.website || '',
          },
          stripe: {
            isConnected: data.stripe_config?.is_connected || false,
            test: {
              secretKey: data.stripe_config?.test?.secret_key || '',
              webhookSecret: data.stripe_config?.test?.webhook_secret || '',
            },
            live: {
              secretKey: data.stripe_config?.live?.secret_key || '',
              webhookSecret: data.stripe_config?.live?.webhook_secret || '',
            },
          },
          email: {
            ...prev.email,
            provider: data.email_config?.provider || 'resend',
            apiKey: data.email_config?.api_key || '',
            fromEmail: data.email_config?.from_email || '',
            fromName: data.email_config?.from_name || '',
            isConnected: data.email_config?.is_connected || false,
            replyTo: data.email_config?.reply_to || '',
          },
          cancelFlow: {
            ...prev.cancelFlow,
            enabled: data.cancel_flow_config?.enabled ?? true,
            discountPercent: data.cancel_flow_config?.discount_percent ?? 20,
            discountDuration: data.cancel_flow_config?.discount_duration ?? 3,
            companyName: data.cancel_flow_config?.company_name || '',
          },
          dunning: {
            ...prev.dunning,
            enabled: data.dunning_config?.enabled ?? true,
            maxAttempts: data.dunning_config?.max_attempts ?? 3,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (csrfToken) {
        headers['x-csrf-token'] = csrfToken;
      }

      // Transform company to branding format for API
      const payload = {
        ...settings,
        branding: {
          companyName: settings.company.companyName,
          fullName: settings.company.fullName,
          website: settings.company.website,
        },
      };

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...(prev as any)[section],
        [field]: value,
      },
    }));
  };

  // Helper to update nested stripe test/live config
  const updateStripeConfig = (mode: 'test' | 'live', field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      stripe: {
        ...prev.stripe,
        [mode]: {
          ...prev.stripe[mode],
          [field]: value,
        },
      },
    }));
  };

  const toggleSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const saveButton = (
    <Button onClick={saveSettings} disabled={isSaving}>
      {isSaving ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      Save Changes
    </Button>
  );

  if (isLoading) {
    return (
      <AppLayout title="Settings" description="Manage your account settings">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings" description="Manage your account settings" actions={saveButton}>
      <div className="max-w-4xl">
        {/* Messages */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 text-sm text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 flex items-center gap-2 p-4 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
            <Check className="h-4 w-4" />
            {success}
          </div>
        )}

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="stripe" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Stripe</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Your company and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={settings.company.fullName}
                    onChange={(e) => updateSettings('company', 'fullName', e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your name for personalizing communications
                  </p>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.company.companyName}
                    onChange={(e) => updateSettings('company', 'companyName', e.target.value)}
                    placeholder="Acme Inc"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Displayed in cancellation flows and customer emails
                  </p>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Website
                  </label>
                  <input
                    type="url"
                    value={settings.company.website}
                    onChange={(e) => updateSettings('company', 'website', e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your company website URL
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stripe Tab */}
          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Stripe Configuration</CardTitle>
                    <CardDescription>
                      Manage your Stripe integration. Configure both test and live keys to use different environments.
                    </CardDescription>
                  </div>
                  <Badge variant={settings.stripe.isConnected ? 'success' : 'secondary'}>
                    {settings.stripe.isConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test/Live Toggle */}
                <div className="flex items-center gap-2 p-1 rounded-lg bg-muted w-fit">
                  <Button
                    size="sm"
                    variant={stripeViewMode === 'live' ? 'default' : 'ghost'}
                    onClick={() => setStripeViewMode('live')}
                    className="gap-2"
                  >
                    <span className={`h-2 w-2 rounded-full ${settings.stripe.live.secretKey ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                    Live Keys
                  </Button>
                  <Button
                    size="sm"
                    variant={stripeViewMode === 'test' ? 'default' : 'ghost'}
                    onClick={() => setStripeViewMode('test')}
                    className="gap-2"
                  >
                    <span className={`h-2 w-2 rounded-full ${settings.stripe.test.secretKey ? 'bg-amber-500' : 'bg-muted-foreground/30'}`} />
                    Test Keys
                  </Button>
                </div>

                {/* Info Box */}
                <div className={`p-4 rounded-lg ${stripeViewMode === 'test' ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900' : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900'}`}>
                  <p className={`text-sm font-medium ${stripeViewMode === 'test' ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                    {stripeViewMode === 'test' ? 'Test Mode' : 'Live Mode'}
                  </p>
                  <p className={`text-sm ${stripeViewMode === 'test' ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {stripeViewMode === 'test'
                      ? 'Use test keys for staging environments. Add ?mode=test to your embed script URL.'
                      : 'Use live keys for production. This is the default mode when no mode parameter is specified.'}
                  </p>
                </div>

                {/* Secret Key */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {stripeViewMode === 'test' ? 'Test' : 'Live'} Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets[`stripeSecret_${stripeViewMode}`] ? 'text' : 'password'}
                      value={settings.stripe[stripeViewMode].secretKey}
                      onChange={(e) => updateStripeConfig(stripeViewMode, 'secretKey', e.target.value)}
                      placeholder={stripeViewMode === 'test' ? 'sk_test_...' : 'sk_live_...'}
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret(`stripeSecret_${stripeViewMode}`)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets[`stripeSecret_${stripeViewMode}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {stripeViewMode === 'test' ? 'Test' : 'Live'} Webhook Signing Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecrets[`webhookSecret_${stripeViewMode}`] ? 'text' : 'password'}
                      value={settings.stripe[stripeViewMode].webhookSecret}
                      onChange={(e) => updateStripeConfig(stripeViewMode, 'webhookSecret', e.target.value)}
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret(`webhookSecret_${stripeViewMode}`)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets[`webhookSecret_${stripeViewMode}`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Usage instructions */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Embed Script Usage</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Production (uses live keys by default):</p>
                    <code className="block px-3 py-2 bg-muted rounded text-xs font-mono">
                      {`<script src="https://your-domain.com/api/embed?flow=YOUR_FLOW_ID"></script>`}
                    </code>
                    <p className="mt-3">Staging (uses test keys):</p>
                    <code className="block px-3 py-2 bg-muted rounded text-xs font-mono">
                      {`<script src="https://your-domain.com/api/embed?flow=YOUR_FLOW_ID&mode=test"></script>`}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email">
            <EmailSettingsTab
              settings={settings.email}
              onUpdate={(field, value) => updateSettings('email', field, value)}
              showSecrets={showSecrets}
              toggleSecret={toggleSecret}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
