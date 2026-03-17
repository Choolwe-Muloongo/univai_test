import { AlertTriangle, Clock3, FileCheck2, ListChecks, ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ExceptionType = {
  id: string;
  title: string;
  owner: string;
  sla: string;
  safeFallback: string;
};

const EXCEPTION_QUEUE: ExceptionType[] = [
  {
    id: 'EA-001',
    title: 'Admissions appeals',
    owner: 'Admissions council lead',
    sla: 'Initial triage in 4 business hours',
    safeFallback: 'Freeze rejection actions until appeal review is complete.',
  },
  {
    id: 'FP-002',
    title: 'Fee/payment disputes',
    owner: 'Finance operations manager',
    sla: 'Initial triage in 2 business hours',
    safeFallback: 'Suspend late penalties while dispute is open.',
  },
  {
    id: 'LC-003',
    title: 'Lecturer assignment conflicts',
    owner: 'Academic scheduling coordinator',
    sla: 'Initial triage in 1 business day',
    safeFallback: 'Assign temporary proctor and preserve timetable continuity.',
  },
  {
    id: 'RC-004',
    title: 'Route-change escalations',
    owner: 'Program director',
    sla: 'Initial triage in 4 business hours',
    safeFallback: 'Hold enrolment switches until capacity and progression checks pass.',
  },
  {
    id: 'PO-005',
    title: 'Policy override requests',
    owner: 'Compliance officer',
    sla: 'Initial triage in 1 business day',
    safeFallback: 'Enforce default policy set until override receives final approval.',
  },
];

const CONTROL_REQUIREMENTS = [
  'Reason code (standardized taxonomy + free-text context)',
  'Evidence attachment (document, ledger snapshot, or schedule proof)',
  'Approval chain (requester → reviewer → final approver)',
  'Expiry / rollback rule (automatic reversion date + rollback owner)',
  'Automatic audit log entry on create, update, approval, rollback, and closure',
];

const EMERGENCY_PLAYBOOK = [
  {
    title: 'When to activate Emergency Mode',
    items: [
      'Platform outage causing blocked decisions for more than 15 minutes.',
      'Peak periods where exception backlog exceeds 2x baseline for two consecutive hours.',
      'Third-party dependency incident (payments, identity, scheduling) impacting approvals.',
    ],
  },
  {
    title: 'Safe temporary controls',
    items: [
      'Restrict submissions to the dedicated exception queue only (disable ad-hoc bypass channels).',
      'Allow only pre-authorized reason codes and pre-approved approvers during the incident window.',
      'Enforce a maximum temporary approval validity of 72 hours with mandatory rollback timer.',
      'Capture immutable audit records for all emergency actions and tag with incident ID.',
    ],
  },
  {
    title: 'Recovery and rollback',
    items: [
      'Run post-incident reconciliation: confirm each temporary approval is either converted or rolled back.',
      'Send automated summaries to admissions, finance, scheduling, and compliance stakeholders.',
      'Perform compliance sign-off before disabling Emergency Mode and restoring normal routing.',
    ],
  },
];

export default function AdminExceptionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exception Queue</h1>
        <p className="text-muted-foreground">
          Dedicated queue for high-impact exceptions with controlled approvals, traceability, and rollback safety.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Exception classes in scope
          </CardTitle>
          <CardDescription>Each exception must pass the same governance controls before resolution.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {EXCEPTION_QUEUE.map((exception) => (
            <div key={exception.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{exception.title}</p>
                  <p className="text-sm text-muted-foreground">Owner: {exception.owner}</p>
                </div>
                <Badge variant="secondary">{exception.id}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <p>
                  <span className="font-medium">SLA:</span> {exception.sla}
                </p>
                <p>
                  <span className="font-medium">Safe fallback:</span> {exception.safeFallback}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Mandatory controls per exception
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {CONTROL_REQUIREMENTS.map((requirement) => (
              <li key={requirement} className="flex items-start gap-2 rounded-md border px-3 py-2">
                <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Emergency Mode playbook
          </CardTitle>
          <CardDescription>
            Outage and peak-period protocol that keeps decisions moving without sacrificing control.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {EMERGENCY_PLAYBOOK.map((section) => (
            <div key={section.title} className="rounded-lg border p-4">
              <p className="mb-2 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {section.title}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
