'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, Save, ShieldCheck } from 'lucide-react';

import { AdminSectionPage } from '@/components/admin/admin-section-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getPaymentSettings, updatePaymentSettings } from '@/lib/api';
import type { PaymentSettings } from '@/lib/api/types';

const defaultSettings: PaymentSettings = {
  lencoCollectionsEnabled: false,
  testModeMessage: 'Payment confirmed in test mode. No Lenco collection was created.',
};

export default function SystemPage() {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getPaymentSettings()
      .then((data) => {
        if (!mounted) return;
        setSettings(data);
        setError(null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Payment settings could not be loaded. Using local defaults until the backend is available.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function saveSettings() {
    setIsSaving(true);
    setNotice(null);
    setError(null);

    try {
      const saved = await updatePaymentSettings({
        lencoCollectionsEnabled: settings.lencoCollectionsEnabled,
        testModeMessage: settings.testModeMessage?.trim() || defaultSettings.testModeMessage,
      });
      setSettings(saved);
      setNotice(saved.lencoCollectionsEnabled ? 'Lenco payment collections are now enabled.' : 'Test mode is active. Payments will unlock access without creating Lenco collections.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment settings could not be saved.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminSectionPage
      title="System"
      description="Central settings for integrations, roles, permissions, audit trails and system health."
      items={['Settings', 'Integrations', 'Roles and permissions', 'Audit logs', 'System health']}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Lenco Payment Collections
                </CardTitle>
                <CardDescription>
                  Control whether UnivAI creates real Lenco payment collections or confirms invoices in local test mode.
                </CardDescription>
              </div>
              <Badge variant={settings.lencoCollectionsEnabled ? 'default' : 'secondary'} className="w-fit">
                {settings.lencoCollectionsEnabled ? 'Live collections' : 'Test mode'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            ) : null}

            {notice ? (
              <div className="flex gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{notice}</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-4 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label htmlFor="lenco-collections" className="text-base font-semibold">
                  Enable real Lenco collections
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, students are sent to Lenco checkout and UnivAI verifies the collection reference before unlocking access.
                </p>
              </div>
              <Switch
                id="lenco-collections"
                checked={settings.lencoCollectionsEnabled}
                disabled={isLoading || isSaving}
                onCheckedChange={(checked) => setSettings((current) => ({ ...current, lencoCollectionsEnabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-message">Test-mode payment message</Label>
              <Textarea
                id="test-message"
                value={settings.testModeMessage ?? ''}
                disabled={isLoading || isSaving}
                onChange={(event) => setSettings((current) => ({ ...current, testModeMessage: event.target.value }))}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                This is shown when Lenco collections are off and a payment is confirmed locally for testing.
              </p>
            </div>

            <Button onClick={saveSettings} disabled={isLoading || isSaving} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Payment Settings'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Payment Behavior
            </CardTitle>
            <CardDescription>Where this switch is applied.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border bg-background p-3">
              Short-course starter access, plan upgrades, bundles, certificate fees, and invoice payments use this setting.
            </div>
            <div className="rounded-lg border bg-background p-3">
              Test mode still creates a paid invoice and payment record, then unlocks the same access that a successful Lenco verification unlocks.
            </div>
            <div className="rounded-lg border bg-background p-3">
              Keep this off while testing. Turn it on only after the Lenco public key, secret key, webhook, and frontend checkout return URLs are ready.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminSectionPage>
  );
}
