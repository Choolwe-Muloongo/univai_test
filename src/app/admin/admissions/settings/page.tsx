'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Save, Settings2, UserCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getAdmissionsSettings, updateAdmissionsSettings } from '@/lib/api';

type SettingsState = {
  isOpen: boolean;
  message: string;
  lecturerApplicationsOpen: boolean;
  lecturerApplicationsMessage: string;
};

const defaultSettings: SettingsState = {
  isOpen: true,
  message: '',
  lecturerApplicationsOpen: false,
  lecturerApplicationsMessage: 'Lecturer applications are currently closed.',
};

export default function AdminAdmissionsSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadSettings() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await getAdmissionsSettings();
      setSettings({
        isOpen: Boolean(data.isOpen),
        message: typeof data.message === 'string' ? data.message : '',
        lecturerApplicationsOpen: Boolean(data.lecturerApplicationsOpen),
        lecturerApplicationsMessage: typeof data.lecturerApplicationsMessage === 'string'
          ? data.lecturerApplicationsMessage
          : 'Lecturer applications are currently closed.',
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load admissions settings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const saved = await updateAdmissionsSettings({
        isOpen: settings.isOpen,
        message: settings.message.trim() || null,
        lecturerApplicationsOpen: settings.lecturerApplicationsOpen,
        lecturerApplicationsMessage: settings.lecturerApplicationsMessage.trim() || null,
      });
      setSettings({
        isOpen: Boolean(saved.isOpen),
        message: typeof saved.message === 'string' ? saved.message : '',
        lecturerApplicationsOpen: Boolean(saved.lecturerApplicationsOpen),
        lecturerApplicationsMessage: typeof saved.lecturerApplicationsMessage === 'string'
          ? saved.lecturerApplicationsMessage
          : '',
      });
      setMessage('Admissions settings saved successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save admissions settings.');
    } finally {
      setSaving(false);
    }
  }

  const lecturerPortalUrl = '/lecturer/applications';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Admissions</p>
          <h1 className="text-3xl font-bold tracking-tight">Admission Settings</h1>
          <p className="max-w-3xl text-muted-foreground">
            Open or close student admissions and lecturer applications. These settings control the public application portals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={lecturerPortalUrl} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" /> Lecturer Portal
            </Link>
          </Button>
          <Button variant="outline" onClick={loadSettings} disabled={loading || saving}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}

      <form onSubmit={saveSettings} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-primary" /> Student Admissions
                  </CardTitle>
                  <CardDescription>Controls the public formal programme application flow.</CardDescription>
                </div>
                <Badge variant={settings.isOpen ? 'default' : 'secondary'}>{settings.isOpen ? 'Open' : 'Closed'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <Label htmlFor="student-admissions-open" className="font-semibold">Accept student applications</Label>
                  <p className="text-sm text-muted-foreground">When off, new formal programme applications are blocked.</p>
                </div>
                <Switch
                  id="student-admissions-open"
                  checked={settings.isOpen}
                  onCheckedChange={(checked) => setSettings((current) => ({ ...current, isOpen: checked }))}
                  disabled={loading || saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-message">Closed / public message</Label>
                <Textarea
                  id="student-message"
                  value={settings.message}
                  onChange={(event) => setSettings((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Admissions are currently closed. Please check back soon."
                  disabled={loading || saving}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" /> Lecturer Applications
                  </CardTitle>
                  <CardDescription>Controls the lecturer recruitment application portal.</CardDescription>
                </div>
                <Badge variant={settings.lecturerApplicationsOpen ? 'default' : 'secondary'}>
                  {settings.lecturerApplicationsOpen ? 'Open' : 'Closed'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <Label htmlFor="lecturer-applications-open" className="font-semibold">Accept lecturer applications</Label>
                  <p className="text-sm text-muted-foreground">When on, applicants can submit from the lecturer portal.</p>
                </div>
                <Switch
                  id="lecturer-applications-open"
                  checked={settings.lecturerApplicationsOpen}
                  onCheckedChange={(checked) => setSettings((current) => ({ ...current, lecturerApplicationsOpen: checked }))}
                  disabled={loading || saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lecturer-message">Closed / public message</Label>
                <Textarea
                  id="lecturer-message"
                  value={settings.lecturerApplicationsMessage}
                  onChange={(event) => setSettings((current) => ({ ...current, lecturerApplicationsMessage: event.target.value }))}
                  placeholder="Lecturer applications are currently closed."
                  disabled={loading || saving}
                />
              </div>
              <div className="rounded-xl border bg-muted/40 p-4 text-sm">
                <p className="font-semibold">Public portal</p>
                <p className="mt-1 text-muted-foreground">Send applicants here after opening applications:</p>
                <Link className="mt-2 inline-flex items-center gap-2 text-primary underline" href={lecturerPortalUrl} target="_blank">
                  {lecturerPortalUrl} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={loading || saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving settings...' : 'Save admission settings'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/lecturer-applications">Review Lecturer Applications</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
