'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, ShieldCheck, Activity, Database } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getSystemHealth, runSystemDiagnostics } from '@/lib/api';
import type { SystemHealthData, SystemHealthIncident } from '@/lib/api/types';

const severityBadgeVariant: Record<SystemHealthIncident['severity'], 'destructive' | 'secondary' | 'outline' | 'default'> = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const lifecycleStatusClasses: Record<string, string> = {
  completed: 'bg-emerald-500',
  in_progress: 'bg-amber-500',
  pending: 'bg-slate-300',
};

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    const health = await getSystemHealth();
    setData(health);
    setSelectedIncidentId((current) => current ?? health.incidentRecords[0]?.id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const selectedIncident = useMemo(
    () => data?.incidentRecords.find((incident) => incident.id === selectedIncidentId) ?? data?.incidentRecords[0],
    [data?.incidentRecords, selectedIncidentId]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Live status across UnivAI infrastructure.</p>
        </div>
        <Button
          variant="outline"
          disabled={running}
          onClick={async () => {
            setRunning(true);
            await runSystemDiagnostics();
            await loadHealth();
            setRunning(false);
          }}
        >
          Run Diagnostics
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime (30d)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.uptime ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Telemetry snapshot</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.incidents ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Monitoring feed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.apiRequests ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Throughput</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.dbThroughput ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Peak usage</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Latest status checks from core providers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Loading diagnostics...</div>
            ) : (
              <div className="space-y-2">
                {(data?.services ?? []).map((service) => (
                  <div key={service.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{service.name}</span>
                    <span className="text-xs capitalize text-muted-foreground">{service.status}</span>
                  </div>
                ))}
              </div>
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
                <span>{data?.utilization?.apiThroughput ?? 0}%</span>
              </div>
              <Progress value={data?.utilization?.apiThroughput ?? 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Database Load</span>
                <span>{data?.utilization?.dbLoad ?? 0}%</span>
              </div>
              <Progress value={data?.utilization?.dbLoad ?? 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Queue Latency</span>
                <span>{data?.utilization?.queueLatency ?? 0}%</span>
              </div>
              <Progress value={data?.utilization?.queueLatency ?? 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Incident Lifecycle Guide</CardTitle>
            <CardDescription>Standard guided workflow for every response.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(data?.incidentLifecycleGuide ?? []).map((step, idx) => (
              <div key={step.key} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <span className="text-xs font-semibold text-muted-foreground">{idx + 1}.</span>
                <span>{step.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Incidents</CardTitle>
            <CardDescription>
              Track severity, ownership, communications, timeline updates, and linked operational queues.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Loading incidents...</div>
            ) : (
              (data?.incidentRecords ?? []).map((incident) => (
                <button
                  key={incident.id}
                  type="button"
                  onClick={() => setSelectedIncidentId(incident.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    incident.id === selectedIncident?.id ? 'border-primary bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{incident.title}</h3>
                    <Badge variant={severityBadgeVariant[incident.severity]} className="capitalize">
                      {incident.severity}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Owner: {incident.owner} • ETA: {incident.eta}
                  </p>
                  <p className="text-sm text-muted-foreground">{incident.communicationStatus}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {incident.impactedModules.map((moduleName) => (
                      <Badge key={moduleName} variant="outline">
                        {moduleName}
                      </Badge>
                    ))}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incident Lifecycle Progress</CardTitle>
            <CardDescription>
              Acknowledge → Assign → Mitigate → Notify affected roles → Resolve → Postmortem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(selectedIncident?.lifecycle ?? []).map((step, idx) => (
              <div key={step.key} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${lifecycleStatusClasses[step.status] ?? lifecycleStatusClasses.pending}`} />
                    <span className="font-medium">{idx + 1}. {step.label}</span>
                  </div>
                  <Badge variant={step.status === 'completed' ? 'default' : step.status === 'in_progress' ? 'secondary' : 'outline'}>
                    {step.status.replace('_', ' ')}
                  </Badge>
                </div>
                {step.completedAt ? <p className="mt-1 text-xs text-muted-foreground">Completed: {step.completedAt}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline Updates</CardTitle>
            <CardDescription>Latest updates for the selected incident.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(selectedIncident?.timelineUpdates ?? []).map((update) => (
              <div key={`${update.at}-${update.actor}`} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{update.at} • {update.actor}</p>
                <p className="text-sm">{update.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affected Queue Pivot</CardTitle>
          <CardDescription>
            Pivot from an incident to the impacted operational queue (admissions, finance, exams, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(selectedIncident?.affectedQueues ?? []).map((queueImpact) => (
              <div key={`${queueImpact.queue}-${queueImpact.module}`} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium capitalize">{queueImpact.queue}</p>
                  <Badge variant={queueImpact.status === 'blocked' ? 'destructive' : queueImpact.status === 'degraded' ? 'secondary' : 'outline'}>
                    {queueImpact.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{queueImpact.module}</p>
                <p className="mt-1 text-sm">Backlog: {queueImpact.backlog}</p>
                <p className="text-sm">Delay: {queueImpact.delayedByMinutes} min</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
