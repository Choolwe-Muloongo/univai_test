'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, ShieldCheck, Activity, Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSystemHealth, runSystemDiagnostics } from '@/lib/api';
import { AdminActionPanel } from '@/components/admin/admin-action-panel';

type IncidentAction = 'Acknowledge' | 'Assign owner' | 'Mitigate' | 'Communicate to affected roles' | 'Resolve' | 'Postmortem';

type IncidentSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
type IncidentStatus = 'Investigating' | 'Mitigating' | 'Monitoring' | 'Resolved';
type ImpactedModule = 'admissions' | 'payments' | 'exams' | 'AI tutor';

type IncidentTimelineEntry = {
  at: string;
  update: string;
};

type Incident = {
  id: string;
  title: string;
  severity: IncidentSeverity;
  impactScope: string;
  owner: string;
  eta: string;
  status: IncidentStatus;
  impactedModules: ImpactedModule[];
  currentAction: IncidentAction;
  timeline: IncidentTimelineEntry[];
};

const guidedActions: IncidentAction[] = [
  'Acknowledge',
  'Assign owner',
  'Mitigate',
  'Communicate to affected roles',
  'Resolve',
  'Postmortem',
];

const fallbackIncidents: Incident[] = [
  {
    id: 'INC-3421',
    title: 'Admissions decision emails delayed',
    severity: 'High',
    impactScope: 'Applicants in the current intake receiving delayed status updates.',
    owner: 'Admissions Ops',
    eta: '35 mins',
    status: 'Mitigating',
    impactedModules: ['admissions'],
    currentAction: 'Communicate to affected roles',
    timeline: [
      { at: '09:15 UTC', update: 'Alert triggered for outbound email queue saturation.' },
      { at: '09:22 UTC', update: 'Incident acknowledged and escalation started.' },
      { at: '09:30 UTC', update: 'Retry workers scaled to drain backlog.' },
    ],
  },
  {
    id: 'INC-3422',
    title: 'Payment confirmation lag',
    severity: 'Medium',
    impactScope: 'Students in checkout can see delayed invoice state for up to 5 minutes.',
    owner: 'Finance Platform',
    eta: '20 mins',
    status: 'Investigating',
    impactedModules: ['payments'],
    currentAction: 'Assign owner',
    timeline: [
      { at: '09:05 UTC', update: 'Monitoring shows increased webhook retries from PSP.' },
      { at: '09:12 UTC', update: 'Ops reviewing callback signature mismatch pattern.' },
    ],
  },
  {
    id: 'INC-3423',
    title: 'AI Tutor response timeout in exam prep',
    severity: 'Critical',
    impactScope: 'Exam prep sessions fail to return AI hints for affected students.',
    owner: 'AI Learning Systems',
    eta: '45 mins',
    status: 'Monitoring',
    impactedModules: ['exams', 'AI tutor'],
    currentAction: 'Resolve',
    timeline: [
      { at: '08:50 UTC', update: 'Rate limits exceeded on inference provider.' },
      { at: '08:58 UTC', update: 'Fallback model activated for exam-prep requests.' },
      { at: '09:18 UTC', update: 'Latency restored; monitoring for recurrence.' },
    ],
  },
];

const severityVariant: Record<IncidentSeverity, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Low: 'outline',
  Medium: 'secondary',
  High: 'default',
  Critical: 'destructive',
};

const statusVariant: Record<IncidentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Investigating: 'secondary',
  Mitigating: 'default',
  Monitoring: 'outline',
  Resolved: 'default',
};

const nextRecommendedAction = (incidents: Incident[]): string => {
  const firstOpenIncident = incidents.find((incident) => incident.status !== 'Resolved');

  if (firstOpenIncident) {
    const currentIndex = guidedActions.indexOf(firstOpenIncident.currentAction);
    const nextAction = guidedActions[Math.min(currentIndex + 1, guidedActions.length - 1)];
    return `${firstOpenIncident.id}: ${nextAction}`;
  }

  return 'No active incidents. Publish a system-wide status confirmation update.';
};

export default function SystemHealthPage() {
  const [data, setData] = useState<any | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>(fallbackIncidents);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [recommendedAction, setRecommendedAction] = useState('Review current incident queue and acknowledge untriaged alerts.');

  const loadHealth = async () => {
    setLoading(true);
    const health = await getSystemHealth();
    setData(health);
    const mappedIncidents = (health?.incidentObjects as Incident[] | undefined) ?? fallbackIncidents;
    setIncidents(mappedIncidents);
    setRecommendedAction(nextRecommendedAction(mappedIncidents));
    setLoading(false);
  };

  useEffect(() => {
    loadHealth();
  }, []);

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

      <AdminActionPanel
        title="System Response Panel"
        description="Optional response checklist for elevated platform-risk events."
        scenarios={['suspicious_account_activity']}
      />

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
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Loading diagnostics...
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.services ?? []).map((service: any) => (
                  <div key={service.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{service.name}</span>
                    <span className="text-xs text-muted-foreground">{service.status}</span>
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

      <Card>
        <CardHeader>
          <CardTitle>Diagnostics Guidance</CardTitle>
          <CardDescription>Run diagnostics is always followed by a recommended next action.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border bg-muted/30 p-3 text-sm">
            <span className="font-medium">Recommended next action: </span>
            {running ? 'Diagnostics running... collect results and prepare communications.' : recommendedAction}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Incident Response Board</CardTitle>
          <CardDescription>
            Structured incident objects with ownership, ETA, impacted modules, and guided actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {incidents.map((incident) => {
            const currentActionIndex = guidedActions.indexOf(incident.currentAction);
            return (
              <div key={incident.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{incident.id}</p>
                  <p className="text-sm text-muted-foreground">{incident.title}</p>
                  <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
                  <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <p>
                    <span className="font-medium">Impact scope:</span> {incident.impactScope}
                  </p>
                  <p>
                    <span className="font-medium">Owner:</span> {incident.owner}
                  </p>
                  <p>
                    <span className="font-medium">ETA:</span> {incident.eta}
                  </p>
                  <p>
                    <span className="font-medium">Impacted modules:</span> {incident.impactedModules.join(', ')}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Guided actions</p>
                  <ol className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
                    {guidedActions.map((action, index) => (
                      <li key={action} className={index <= currentActionIndex ? 'font-medium text-foreground' : ''}>
                        {index + 1}. {action}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Timeline</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {incident.timeline.map((entry) => (
                      <li key={`${incident.id}-${entry.at}`}>
                        <span className="font-medium text-foreground">{entry.at}</span> — {entry.update}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
