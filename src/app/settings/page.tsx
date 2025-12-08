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
    stripe: {
      secretKey: '',
      webhookSecret: '',
      isConnected: false,
      testMode: true,
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
          stripe: {
            ...prev.stripe,
            secretKey: data.stripe_config?.secret_key || '',
            webhookSecret: data.stripe_config?.webhook_secret || '',
            isConnected: data.stripe_config?.is_connected || false,
            testMode: data.stripe_config?.test_mode ?? true,
            publishableKey: data.stripe_config?.publishable_key || '',
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

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify(settings),
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

        <Tabs defaultValue="stripe" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stripe" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Stripe</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
          </TabsList>

          {/* Stripe Tab */}
          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Stripe Configuration</CardTitle>
                    <CardDescription>Manage your Stripe integration settings</CardDescription>
                  </div>
                  <Badge variant={settings.stripe.isConnected ? 'success' : 'secondary'}>
                    {settings.stripe.isConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Environment</p>
                    <p className="text-sm text-muted-foreground">
                      {settings.stripe.testMode ? 'Using test mode' : 'Using live mode'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={settings.stripe.testMode ? 'default' : 'outline'}
                      onClick={() => updateSettings('stripe', 'testMode', true)}
                    >
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant={!settings.stripe.testMode ? 'default' : 'outline'}
                      onClick={() => updateSettings('stripe', 'testMode', false)}
                    >
                      Live
                    </Button>
                  </div>
                </div>

                {/* Secret Key */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secret Key</label>
                  <div className="relative">
                    <input
                      type={showSecrets['stripeSecret'] ? 'text' : 'password'}
                      value={settings.stripe.secretKey}
                      onChange={(e) => updateSettings('stripe', 'secretKey', e.target.value)}
                      placeholder={settings.stripe.testMode ? 'sk_test_...' : 'sk_live_...'}
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('stripeSecret')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets['stripeSecret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook Signing Secret</label>
                  <div className="relative">
                    <input
                      type={showSecrets['webhookSecret'] ? 'text' : 'password'}
                      value={settings.stripe.webhookSecret}
                      onChange={(e) => updateSettings('stripe', 'webhookSecret', e.target.value)}
                      placeholder="whsec_..."
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('webhookSecret')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets['webhookSecret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
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
