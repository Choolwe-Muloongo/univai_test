'use client';

import { ChangeEvent, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Camera, Loader2, Save } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/components/providers/session-provider';
import { uploadAccountAvatar } from '@/lib/api/account';
import { getAccountProfile, updateAccountProfile } from '@/lib/api';

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
  bio: string;
  avatar: string;
};

const emptyForm: ProfileForm = {
  name: '',
  email: '',
  phone: '',
  country: '',
  timezone: 'Africa/Lusaka',
  bio: '',
  avatar: '',
};

const timezones = [
  'Africa/Lusaka',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Europe/London',
  'UTC',
];

export default function SettingsPage() {
  const { session, refresh } = useSession();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const title = useMemo(() => {
    const role = session?.user?.role || 'user';
    if (role.includes('employer')) return 'Company Account Settings';
    if (role.includes('lecturer')) return 'Lecturer Account Settings';
    if (role.includes('instructor')) return 'Instructor Account Settings';
    if (role.includes('admin')) return 'Admin Account Settings';
    return 'Account Settings';
  }, [session?.user?.role]);

  useEffect(() => {
    let mounted = true;
    getAccountProfile()
      .then((data) => {
        if (!mounted) return;
        setForm({
          name: data.user?.name || data.profile.displayName || '',
          email: data.user?.email || '',
          phone: data.profile.phone || '',
          country: data.profile.country || '',
          timezone: data.profile.timezone || 'Africa/Lusaka',
          bio: data.profile.bio || '',
          avatar: data.profile.avatar || data.user?.avatar || '',
        });
      })
      .catch((cause) => {
        if (!mounted) return;
        setError(cause instanceof Error ? cause.message : 'Unable to load account settings.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  function update(patch: Partial<ProfileForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your profile photo.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    setMessage(null);
    try {
      const response = await uploadAccountAvatar(file);
      update({ avatar: response.avatar || response.url });
      await refresh();
      setMessage('Profile photo uploaded.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to upload profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateAccountProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        country: form.country.trim() || null,
        timezone: form.timezone || null,
        bio: form.bio.trim() || null,
        avatar: form.avatar || null,
      });
      await refresh();
      setMessage('Profile updated.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading account settings..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">Update your name, contact details, timezone, and profile photo.</p>
      </div>

      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-2xl border bg-primary/5 p-4 text-sm">{message}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>These details appear across your dashboard, profile menu, and learning activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input value={form.name} onChange={(event) => update({ name: event.target.value })} />
              </Field>
              <Field label="Email address">
                <Input type="email" value={form.email} onChange={(event) => update({ email: event.target.value })} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(event) => update({ phone: event.target.value })} placeholder="+260..." />
              </Field>
              <Field label="Country">
                <Input value={form.country} onChange={(event) => update({ country: event.target.value })} placeholder="Zambia" />
              </Field>
              <Field label="Timezone">
                <Select value={form.timezone} onValueChange={(value) => update({ timezone: value })}>
                  <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Bio">
              <Textarea rows={5} value={form.bio} onChange={(event) => update({ bio: event.target.value })} placeholder="Short professional or learning profile." />
            </Field>
            <Button onClick={saveProfile} disabled={saving || uploadingAvatar || !form.name.trim() || !form.email.trim()}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
              <CardDescription>Upload a real image file. UnivAI stores it and keeps only the image URL on your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-24 border">
                  <AvatarImage src={form.avatar} alt={form.name || 'Profile photo'} />
                  <AvatarFallback>{(form.name || form.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="profile-photo" className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                    {uploadingAvatar ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Camera className="mr-2 size-4" />}
                    {uploadingAvatar ? 'Uploading...' : 'Upload photo'}
                  </Label>
                  <Input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploadingAvatar} />
                  <p className="text-xs text-muted-foreground">For best results, use a clear square image.</p>
                </div>
              </div>
              <Input value={form.avatar} onChange={(event) => update({ avatar: event.target.value })} placeholder="Or paste an image URL" />
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Notification controls are being prepared for device-level preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PreferenceRow title="Academic updates" description="Grades, announcements, and schedule changes." status="On by default" />
              <PreferenceRow title="Course activity" description="Short-course access, certificates, and payments." status="On by default" />
              <PreferenceRow title="Career opportunities" description="Jobs, internships, and portfolio activity." status="Coming soon" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function PreferenceRow({ title, description, status }: { title: string; description: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">{status}</span>
    </div>
  );
}
