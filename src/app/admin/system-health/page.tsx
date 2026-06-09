'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Database, Server, ShieldCheck } from 'lucide-react';

import { AdminActionPanel } from '@/components/admin/admin-action-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getSystemHealth, runSystemDiagnostics } from '@/lib/api';
import type { LaunchReadinessReport } from '@/lib/api/types';

type ServiceStatus = {
  name: string;
  status: string;
};

type IncidentRecord = {
  id: string;
  title: string;
  severity: string;
  owner?: string;
  eta?: string;
  communicationStatus?: string;
  impactedModules?: string[];
};

type HealthData = {
  uptime?: string;
  incidents?: number;
  apiRequests?: string | number;
  dbThroughput?: string | number;
  services?: ServiceStatus[];
  utilization?: {
    apiThroughput?: number;
    dbLoad?: number;
    queueLatency?: number;
  };
  incidentRecords?: IncidentRecord[];
  launchReadiness?: LaunchReadinessReport;
};

const fallbackHealth: HealthData = {
  uptime: '--',
  incidents: 0,
  apiRequests: '--',
  dbThroughput: '--',
  services: [],
  utilization: {
    apiThroughput: 0,
    dbLoad: 0,
    queueLatency: 0,
  },
  incidentRecords: [],
};

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'outline',
  medium: 'secondary',
  high: 'default',
  critical: 'destructive',
};

export default function SystemHealthPage() {
  const [data, setData] = useState<HealthData>(fallbackHealth);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const health = (await getSystemHealth()) as HealthData;
      setData({ ...fallbackHealth, ...health });
    } catch (loadError: any) {
      console.error('Failed to load system health', loadError);
      setData(fallbackHealth);
      setError(loadError?.message ?? 'Could not load system health data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const recommendedAction = useMemo(() => {
    const firstIncident = data.incidentRecords?.[0];
    if (firstIncident) {
      return `${firstIncident.id}: assign owner, communicate impact, and track resolution.`;
    }
    return 'No active incidents. Continue monitoring platform health.';
  }, [data.incidentRecords]);

  const runDiagnostics = async () => {
    setRunning(true);
    setError(null);

    try {
      await runSystemDiagnostics();
      await loadHealth();
    } catch (diagnosticError: any) {
      console.error('Failed to run diagnostics', diagnosticError);
      setError(diagnosticError?.message ?? 'Diagnostics could not be completed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Monitor infrastructure, diagnostics, and incident response.</p>
        </div>
        <Button variant="outline" disabled={running} onClick={runDiagnostics}>
          {running ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
      </div>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-4 text-sm text-amber-900">{error}</CardContent>
        </Card>
      ) : null}

      <AdminActionPanel
        title="System Response Panel"
        description="Optional response checklist for elevated platform-risk events."
        scenarios={['suspicious_account_activity']}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : data.uptime}</div>
            <p className="text-xs text-muted-foreground">Telemetry snapshot</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : data.incidents}</div>
            <p className="text-xs text-muted-foreground">Monitoring feed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : data.apiRequests}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Throughput</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '--' : data.dbThroughput}</div>
            <p className="text-xs text-muted-foreground">Peak usage</p>
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>V1 Launch Readiness</CardTitle>
          <CardDescription>University platform + Coursera-style short-course scope.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.launchReadiness ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={data.launchReadiness.readyForV1Launch ? 'default' : 'destructive'}>
                  {data.launchReadiness.releaseState}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {data.launchReadiness.version} · {data.launchReadiness.launchProfile} · target {data.launchReadiness.targetRegisteredUsers.toLocaleString()} registered users
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(data.launchReadiness.capabilities as Record<string, { label: string; ready: boolean }>).map(([key, capability]) => (
                  <div key={key} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{capability.label}</p>
                      <Badge variant={capability.ready ? 'default' : 'destructive'}>{capability.ready ? 'Ready' : 'Blocked'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                {data.launchReadiness.publicContentRule}
              </p>
              {(data.launchReadiness.missingRoutes.length > 0 || data.launchReadiness.missingPermissions.length > 0) && (
                <div className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">
                  Missing routes: {data.launchReadiness.missingRoutes.join(', ') || 'none'} · Missing permissions: {data.launchReadiness.missingPermissions.join(', ') || 'none'}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Launch readiness report has not loaded yet.</div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Latest status checks from core providers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Loading diagnostics...</div>
            ) : data.services && data.services.length > 0 ? (
              data.services.map((service) => (
                <div key={service.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>{service.name}</span>
                  <Badge variant={service.status === 'healthy' ? 'default' : 'secondary'}>{service.status}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No service checks returned yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
            <CardDescription>Current usage against thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>API Throughput</span>
                <span>{data.utilization?.apiThroughput ?? 0}%</span>
              </div>
              <Progress value={data.utilization?.apiThroughput ?? 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Database Load</span>
                <span>{data.utilization?.dbLoad ?? 0}%</span>
              </div>
              <Progress value={data.utilization?.dbLoad ?? 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Queue Latency</span>
                <span>{data.utilization?.queueLatency ?? 0}%</span>
              </div>
              <Progress value={data.utilization?.queueLatency ?? 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Response Board</CardTitle>
          <CardDescription>Ownership, impact, and recommended next action.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="rounded-lg border bg-muted/30 p-3 text-sm">
            <span className="font-medium">Recommended next action: </span>
            {running ? 'Diagnostics running...' : recommendedAction}
          </p>
          {data.incidentRecords && data.incidentRecords.length > 0 ? (
            data.incidentRecords.map((incident) => (
              <div key={incident.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{incident.id}</p>
                  <p className="text-sm text-muted-foreground">{incident.title}</p>
                  <Badge variant={severityVariant[String(incident.severity).toLowerCase()] ?? 'outline'}>{incident.severity}</Badge>
                </div>
                <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                  <p><span className="font-medium">Owner:</span> {incident.owner ?? 'Unassigned'}</p>
                  <p><span className="font-medium">ETA:</span> {incident.eta ?? 'Not set'}</p>
                  <p><span className="font-medium">Communication:</span> {incident.communicationStatus ?? 'Pending'}</p>
                  <p><span className="font-medium">Modules:</span> {(incident.impactedModules ?? []).join(', ') || 'Not specified'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No active incident records.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
