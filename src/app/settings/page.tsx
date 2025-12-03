'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Mail,
  Settings,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Bell,
  Palette,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CancelFlowModal } from '@/components/CancelFlowModal';
import { AppLayout } from '@/components/AppLayout';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [settings, setSettings] = useState({
    stripe: {
      secretKey: '',
      webhookSecret: '',
      isConnected: false,
      testMode: true,
    },
    email: {
      provider: 'resend' as 'resend' | 'sendgrid',
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
    branding: {
      companyName: '',
      primaryColor: '#3b82f6',
      modalTheme: 'minimal',
    },
    notifications: {
      emailOnFailedPayment: true,
      emailOnCancellation: true,
      emailOnRecovery: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

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
          branding: {
            ...prev.branding,
            companyName: data.branding?.company_name || '',
            primaryColor: data.branding?.primary_color || '#3b82f6',
            modalTheme: data.branding?.modal_theme || 'minimal',
            logoUrl: data.branding?.logo_url || '',
          },
          notifications: {
            ...prev.notifications,
            emailOnFailedPayment: data.notifications?.email_on_failed_payment ?? true,
            emailOnCancellation: data.notifications?.email_on_cancellation ?? true,
            emailOnRecovery: data.notifications?.email_on_recovery ?? true,
            slackWebhookUrl: data.notifications?.slack_webhook_url || '',
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
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stripe" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Stripe</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="cancel-flow" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Cancel Flow</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Email Configuration</CardTitle>
                    <CardDescription>Configure your email provider for notifications</CardDescription>
                  </div>
                  <Badge variant={settings.email.isConnected ? 'success' : 'secondary'}>
                    {settings.email.isConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Provider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updateSettings('email', 'provider', 'resend')}
                      className={`p-4 rounded-lg border-2 text-left ${
                        settings.email.provider === 'resend' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <p className="font-medium">Resend</p>
                      <p className="text-sm text-muted-foreground">Modern email API</p>
                    </button>
                    <button
                      onClick={() => updateSettings('email', 'provider', 'sendgrid')}
                      className={`p-4 rounded-lg border-2 text-left ${
                        settings.email.provider === 'sendgrid' ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <p className="font-medium">SendGrid</p>
                      <p className="text-sm text-muted-foreground">Enterprise-grade</p>
                    </button>
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="relative">
                    <input
                      type={showSecrets['emailKey'] ? 'text' : 'password'}
                      value={settings.email.apiKey}
                      onChange={(e) => updateSettings('email', 'apiKey', e.target.value)}
                      placeholder={settings.email.provider === 'resend' ? 're_...' : 'SG...'}
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret('emailKey')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets['emailKey'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* From Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Email</label>
                  <input
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) => updateSettings('email', 'fromEmail', e.target.value)}
                    placeholder="billing@yourcompany.com"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  />
                </div>

                {/* From Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Name</label>
                  <input
                    type="text"
                    value={settings.email.fromName}
                    onChange={(e) => updateSettings('email', 'fromName', e.target.value)}
                    placeholder="Your Company"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cancel Flow Tab */}
          <TabsContent value="cancel-flow">
            <Card>
              <CardHeader>
                <CardTitle>Cancel Flow Settings</CardTitle>
                <CardDescription>Configure your cancellation save offers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Enable Cancel Flow</p>
                    <p className="text-sm text-muted-foreground">Show save offers to customers trying to cancel</p>
                  </div>
                  <Button
                    variant={settings.cancelFlow.enabled ? 'default' : 'outline'}
                    onClick={() => updateSettings('cancelFlow', 'enabled', !settings.cancelFlow.enabled)}
                  >
                    {settings.cancelFlow.enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                <Separator />

                {/* Discount Settings */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Discount Percentage</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={settings.cancelFlow.discountPercent}
                        onChange={(e) => updateSettings('cancelFlow', 'discountPercent', parseInt(e.target.value) || 20)}
                        className="w-20 px-3 py-2 rounded-lg border border-input bg-background"
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
                        value={settings.cancelFlow.discountDuration}
                        onChange={(e) => updateSettings('cancelFlow', 'discountDuration', parseInt(e.target.value) || 3)}
                        className="w-20 px-3 py-2 rounded-lg border border-input bg-background"
                      />
                      <span className="text-muted-foreground">months</span>
                    </div>
                  </div>
                </div>

                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name (for modal)</label>
                  <input
                    type="text"
                    value={settings.cancelFlow.companyName}
                    onChange={(e) => updateSettings('cancelFlow', 'companyName', e.target.value)}
                    placeholder="Your Company"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Customize how ChurnBuddy appears to your customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <input
                      type="text"
                      value={settings.branding.companyName}
                      onChange={(e) => updateSettings('branding', 'companyName', e.target.value)}
                      placeholder="Your Company"
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                    />
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.branding.primaryColor}
                        onChange={(e) => updateSettings('branding', 'primaryColor', e.target.value)}
                        className="h-10 w-14 rounded border border-input cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.branding.primaryColor}
                        onChange={(e) => updateSettings('branding', 'primaryColor', e.target.value)}
                        className="w-28 px-3 py-2 rounded-lg border border-input bg-background"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cancel Flow Preview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Cancel Flow Preview</CardTitle>
                        <CardDescription>Your 3-step cancellation flow to reduce churn</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowPreviewModal(true)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Step 1 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-purple-900 dark:text-purple-100">Your Feedback</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">Exit survey collection</p>
                      </div>
                    </div>
                    {/* Step 2 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                      <div className="w-8 h-8 rounded-full bg-slate-600 text-white flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">Consider Other Plans</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">Alternative plan offers at 80% off</p>
                      </div>
                    </div>
                    {/* Step 3 */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-100">Special Offer</p>
                        <p className="text-xs text-red-600 dark:text-red-400">{settings.cancelFlow.discountPercent}% off for {settings.cancelFlow.discountDuration} months</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure when you get notified about events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Failed Payment */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Failed Payment Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when a payment fails</p>
                  </div>
                  <Button
                    variant={settings.notifications.emailOnFailedPayment ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings('notifications', 'emailOnFailedPayment', !settings.notifications.emailOnFailedPayment)}
                  >
                    {settings.notifications.emailOnFailedPayment ? 'On' : 'Off'}
                  </Button>
                </div>

                {/* Cancellation */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Cancellation Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when a customer cancels</p>
                  </div>
                  <Button
                    variant={settings.notifications.emailOnCancellation ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings('notifications', 'emailOnCancellation', !settings.notifications.emailOnCancellation)}
                  >
                    {settings.notifications.emailOnCancellation ? 'On' : 'Off'}
                  </Button>
                </div>

                {/* Recovery */}
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Recovery Alerts</p>
                    <p className="text-sm text-muted-foreground">Get notified when a payment is recovered</p>
                  </div>
                  <Button
                    variant={settings.notifications.emailOnRecovery ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings('notifications', 'emailOnRecovery', !settings.notifications.emailOnRecovery)}
                  >
                    {settings.notifications.emailOnRecovery ? 'On' : 'Off'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Preview Modal */}
      <CancelFlowModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onCancelConfirmed={() => setShowPreviewModal(false)}
        onOfferAccepted={() => setShowPreviewModal(false)}
        onPlanSwitched={() => setShowPreviewModal(false)}
        customerId="preview"
        subscriptionId="preview"
        discountPercent={settings.cancelFlow.discountPercent}
        discountDuration={`${settings.cancelFlow.discountDuration} months`}
        companyName={settings.branding.companyName || settings.cancelFlow.companyName || 'Your Company'}
      />
      </div>
    </AppLayout>
  );
}
