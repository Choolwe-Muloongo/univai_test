'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { getAdmissionsSettings, getApplications, updateAdmissionsSettings } from '@/lib/api';
import type { ApplicationSummary, ApplicationStatus } from '@/lib/api/types';
import { ClipboardCheck, Filter, Search } from 'lucide-react';
import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';

type RecordState = 'active' | 'archived' | 'deleted';

const statusLabels: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  fee_paid: 'Fee Paid',
  under_review: 'Under Review',
  needs_info: 'Needs Info',
  offer_sent: 'Offer Sent',
  approved: 'Approved',
  rejected: 'Rejected',
  admitted: 'Admitted',
};

const statusBadgeVariant: Record<ApplicationStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  submitted: 'secondary',
  fee_paid: 'secondary',
  under_review: 'default',
  needs_info: 'outline',
  offer_sent: 'default',
  approved: 'default',
  rejected: 'destructive',
  admitted: 'default',
};

export default function AdmissionsDashboardPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [admissionsOpen, setAdmissionsOpen] = useState(true);
  const [admissionsMessage, setAdmissionsMessage] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>('under_review');
  const [recordStates, setRecordStates] = useState<Record<string, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      const [data, settings] = await Promise.all([getApplications(), getAdmissionsSettings()]);
      setApplications(data);
      setAdmissionsOpen(settings.isOpen);
      setAdmissionsMessage(settings.message ?? '');
      setRecordStates(Object.fromEntries(data.map((app) => [app.id, 'active'])));
      setLoading(false);
    };
    loadApplications();
  }, []);

  const pushHistory = (entityId: string, action: string) => {
    setHistory((prev) => [
      {
        id: `${entityId}-${Date.now()}-${Math.random()}`,
        entity: 'Admission',
        entityId,
        action,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const setLifecycleState = (id: string, next: RecordState) => {
    setRecordStates((prev) => ({ ...prev, [id]: next }));
    if (next !== 'active') pushHistory(id, next === 'archived' ? 'archived' : 'hard deleted');
    if (next === 'active') pushHistory(id, 'restored');
  };

  const handleBulkStatus = () => {
    if (selectedIds.length === 0) return;
    setApplications((prev) => prev.map((app) => (selectedIds.includes(app.id) ? { ...app, status: bulkStatus } : app)));
    selectedIds.forEach((id) => pushHistory(id, `bulk status transition to ${bulkStatus}`));
    setSelectedIds([]);
  };

  const handleToggleAdmissions = async (nextOpen: boolean) => {
    setAdmissionsOpen(nextOpen);
    setSavingSettings(true);
    try {
      const updated = await updateAdmissionsSettings({
        isOpen: nextOpen,
        message: admissionsMessage || null,
      });
      setAdmissionsOpen(updated.isOpen);
      setAdmissionsMessage(updated.message ?? '');
    } finally {
      setSavingSettings(false);
    }
  };

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const lifecycle = recordStates[app.id] ?? 'active';
      const matchesQuery =
        app.fullName.toLowerCase().includes(query.toLowerCase()) ||
        app.email.toLowerCase().includes(query.toLowerCase()) ||
        app.programId.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || app.status === status;
      return lifecycle !== 'deleted' && matchesQuery && matchesStatus;
    });
  }, [applications, query, status, recordStates]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissions & Enrollment</h1>
          <p className="text-muted-foreground">Review applications, verify requirements, and move qualified students to enrollment.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/reports">View Admission Reports</Link>
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Admissions Window</CardTitle><CardDescription>Open or close applications globally.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="admissions-switch">Admissions</Label>
            <Switch id="admissions-switch" checked={admissionsOpen} onCheckedChange={handleToggleAdmissions} disabled={savingSettings} />
          </div>
          {!admissionsOpen && (
            <Textarea value={admissionsMessage} onChange={(event) => setAdmissionsMessage(event.target.value)} placeholder="Closure message." className="min-h-24" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Application Queue</CardTitle>
            <CardDescription>Includes explicit archive/restore controls and bulk status transitions.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applicant" className="pl-8" /></div>
            <Select value={status} onValueChange={(value) => setStatus(value as ApplicationStatus | 'all')}>
              <SelectTrigger className="w-44"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.keys(statusLabels).map((key) => <SelectItem key={key} value={key}>{statusLabels[key as ApplicationStatus]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded border p-2">
            <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as ApplicationStatus)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.keys(statusLabels).map((key) => <SelectItem key={key} value={key}>{statusLabels[key as ApplicationStatus]}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={handleBulkStatus} disabled={selectedIds.length === 0}>Bulk transition ({selectedIds.length})</Button>
          </div>
          {loading ? <p className="text-sm text-muted-foreground">Loading applications...</p> : filtered.map((app) => {
            const state = recordStates[app.id] ?? 'active';
            return (
              <div key={app.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={selectedIds.includes(app.id)} onCheckedChange={(checked) => setSelectedIds((prev) => checked ? [...prev, app.id] : prev.filter((id) => id !== app.id))} />
                  <div>
                    <p className="font-semibold">{app.fullName}</p>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                    <p className="text-xs text-muted-foreground">Program: {app.programId.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusBadgeVariant[app.status]}>{statusLabels[app.status]}</Badge>
                  <Badge variant={state === 'active' ? 'secondary' : 'outline'}>{state}</Badge>
                  <Button asChild size="sm"><Link href={`/admin/admissions/${app.id}`}>Review</Link></Button>
                  {state === 'active' ? <Button size="sm" variant="outline" onClick={() => setLifecycleState(app.id, 'archived')}>Archive</Button> : <Button size="sm" variant="outline" onClick={() => setLifecycleState(app.id, 'active')}>Restore</Button>}
                  <Button size="sm" variant="destructive" onClick={() => setLifecycleState(app.id, 'deleted')} disabled>Hard Delete (blocked)</Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ImmutableHistoryPanel title="Admissions destructive history" entries={history} />
    </div>
  );
}
