'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  Globe,
  ChevronRight,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmailSettings {
  provider: 'resend';
  apiKey: string;
  fromEmail: string;
  fromName: string;
  isConnected: boolean;
}

interface Domain {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface EmailSettingsTabProps {
  settings: EmailSettings;
  onUpdate: (field: string, value: any) => void;
  showSecrets: Record<string, boolean>;
  toggleSecret: (field: string) => void;
}

export function EmailSettingsTab({
  settings,
  onUpdate,
  showSecrets,
  toggleSecret,
}: EmailSettingsTabProps) {
  const [step, setStep] = useState<'initial' | 'connecting' | 'domains' | 'configure' | 'test'>('initial');
  const [isValidating, setIsValidating] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [testEmail, setTestEmail] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');

  // Define handleSendTestEmail before early return so it's available in connected state
  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setError('Please enter an email address');
      return;
    }

    setIsSendingTest(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/settings/resend', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.apiKey,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName,
          toEmail: testEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send test email');
        return;
      }

      setSuccess('Test email sent! Check your inbox.');
    } catch (err) {
      setError('Failed to send test email. Please try again.');
    } finally {
      setIsSendingTest(false);
    }
  };

  // If already connected, show connected state
  if (settings.isConnected && settings.apiKey && (step === 'initial' || step === 'test')) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Emails will be sent from your domain</CardDescription>
            </div>
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connected Status */}
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">
                  {settings.fromName || 'Your Company'}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {settings.fromEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Edit */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Name</label>
              <input
                type="text"
                value={settings.fromName}
                onChange={(e) => onUpdate('fromName', e.target.value)}
                placeholder="Your Company"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From Email</label>
              <input
                type="email"
                value={settings.fromEmail}
                onChange={(e) => onUpdate('fromEmail', e.target.value)}
                placeholder="hello@yourcompany.com"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep('test');
                setTestEmail('');
              }}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send Test Email
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                onUpdate('isConnected', false);
                onUpdate('apiKey', '');
                setStep('initial');
              }}
              className="text-muted-foreground"
            >
              Disconnect
            </Button>
          </div>

          {/* Test Email Section */}
          {step === 'test' && (
            <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Send test email to</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSendTestEmail()}
                  disabled={isSendingTest || !testEmail}
                >
                  {isSendingTest ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Test
                </Button>
                <Button variant="ghost" onClick={() => setStep('initial')}>
                  Cancel
                </Button>
              </div>
              {success && (
                <p className="text-sm text-emerald-600 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {success}
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const handleValidateApiKey = async () => {
    if (!tempApiKey) {
      setError('Please enter your Resend API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: tempApiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to validate API key');
        return;
      }

      // Save API key and domains
      onUpdate('apiKey', tempApiKey);
      setDomains(data.domains || []);

      if (data.hasVerifiedDomains) {
        setStep('domains');
      } else {
        setError('No verified domains found. Please verify a domain in Resend first.');
      }
    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSelectDomain = (domain: string) => {
    onUpdate('fromEmail', `hello@${domain}`);
    setStep('configure');
  };

  const handleComplete = () => {
    onUpdate('isConnected', true);
    setStep('initial');
    setSuccess('Email provider connected successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Initial state - not connected
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>Connect Resend to send emails from your domain</CardDescription>
          </div>
          <Badge variant="secondary">Not Connected</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {step === 'initial' && (
          <div className="space-y-6">
            {/* Benefits */}
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Send from your domain</p>
                  <p className="text-sm text-muted-foreground">
                    Emails come from your brand, not Exit Loop
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Better deliverability</p>
                  <p className="text-sm text-muted-foreground">
                    Verified domains have higher inbox rates
                  </p>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <Button
              onClick={() => setStep('connecting')}
              className="w-full gap-2"
              size="lg"
            >
              Connect Resend
              <ChevronRight className="h-4 w-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Don&apos;t have a Resend account?{' '}
              <a
                href="https://resend.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Create one for free
              </a>
            </p>
          </div>
        )}

        {step === 'connecting' && (
          <div className="space-y-6">
            {/* Steps Guide */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Resend</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Open your Resend dashboard and copy your API key
                  </p>
                  <a
                    href="https://resend.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Open Resend API Keys
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-2">Paste your API key</p>
                  <div className="relative">
                    <input
                      type={showSecrets['emailKey'] ? 'text' : 'password'}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="re_..."
                      className="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background"
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
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('initial')}>
                Back
              </Button>
              <Button
                onClick={handleValidateApiKey}
                disabled={isValidating || !tempApiKey}
                className="flex-1"
              >
                {isValidating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Validate & Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'domains' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1">Select your domain</h3>
              <p className="text-sm text-muted-foreground">
                Choose which verified domain to send emails from
              </p>
            </div>

            <div className="space-y-2">
              {domains.map((domain) => (
                <button
                  key={domain.id}
                  onClick={() => handleSelectDomain(domain.name)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{domain.name}</p>
                      <p className="text-sm text-muted-foreground">
                        hello@{domain.name}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>

            <Button variant="outline" onClick={() => setStep('connecting')}>
              Back
            </Button>
          </div>
        )}

        {step === 'configure' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-1">Configure sender details</h3>
              <p className="text-sm text-muted-foreground">
                Set up how your emails will appear to recipients
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Name</label>
                <input
                  type="text"
                  value={settings.fromName}
                  onChange={(e) => onUpdate('fromName', e.target.value)}
                  placeholder="Your Company"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  This is the name recipients will see
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From Email</label>
                <input
                  type="email"
                  value={settings.fromEmail}
                  onChange={(e) => onUpdate('fromEmail', e.target.value)}
                  placeholder="hello@yourcompany.com"
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                PREVIEW
              </p>
              <p className="font-medium">
                {settings.fromName || 'Your Company'}{' '}
                <span className="text-muted-foreground font-normal">
                  &lt;{settings.fromEmail || 'hello@yourcompany.com'}&gt;
                </span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('domains')}>
                Back
              </Button>
              <Button
                onClick={handleComplete}
                disabled={!settings.fromEmail}
                className="flex-1"
              >
                <Check className="mr-2 h-4 w-4" />
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
