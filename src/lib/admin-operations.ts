import {
  getAdminAssignments,
  getAdminRouteChangeRequests,
  getApplications,
  getAuditLogs,
  getFinanceReport,
  getLecturerApplications,
} from '@/lib/api';
import type {
  AdminAssignment,
  ApplicationSummary,
  AuditLogEntry,
  FinanceReportRow,
  LecturerApplication,
  RouteChangeRequest,
} from '@/lib/api/types';

export type OpsLane =
  | 'Admissions Ops'
  | 'Academic Ops'
  | 'People Ops'
  | 'Finance Ops'
  | 'Compliance & Audit'
  | 'Incidents';

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type OpsQueueItem = {
  id: string;
  lane: OpsLane;
  title: string;
  pendingQueue: string;
  severity: Severity;
  slaDueAt: string;
  slaBreachRisk: number;
  assignedOwner: string;
  nextBestAction: string;
  summary: string;
  escalationPath: string[];
};

const severityScore: Record<Severity, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export const opsLanes: OpsLane[] = [
  'Admissions Ops',
  'Academic Ops',
  'People Ops',
  'Finance Ops',
  'Compliance & Audit',
  'Incidents',
];

export function getSortedLaneItems(items: OpsQueueItem[]): OpsQueueItem[] {
  return [...items].sort((a, b) => {
    if (severityScore[b.severity] !== severityScore[a.severity]) {
      return severityScore[b.severity] - severityScore[a.severity];
    }

    if (b.slaBreachRisk !== a.slaBreachRisk) {
      return b.slaBreachRisk - a.slaBreachRisk;
    }

    return new Date(a.slaDueAt).getTime() - new Date(b.slaDueAt).getTime();
  });
}

export function formatSlaCountdown(slaDueAt: string): string {
  const diffMs = new Date(slaDueAt).getTime() - Date.now();
  const breached = diffMs < 0;
  const totalMinutes = Math.abs(Math.round(diffMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const timeLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return breached ? `Breached by ${timeLabel}` : `${timeLabel} remaining`;
}

function getAgeHours(createdAt?: string | null): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, (Date.now() - created) / 3_600_000);
}

function getSeverityByRisk(risk: number): Severity {
  if (risk >= 90) return 'Critical';
  if (risk >= 70) return 'High';
  if (risk >= 45) return 'Medium';
  return 'Low';
}

function buildSla(createdAt: string | undefined | null, laneHours: number) {
  const base = createdAt ? new Date(createdAt).getTime() : Date.now();
  const due = new Date(base + laneHours * 3_600_000);
  const remainingMs = due.getTime() - Date.now();
  const elapsedRatio = 1 - remainingMs / (laneHours * 3_600_000);
  const risk = Math.max(0, Math.min(100, Math.round(elapsedRatio * 100)));

  return {
    dueAt: due.toISOString(),
    risk,
    severity: getSeverityByRisk(risk),
  };
}

function ownerOrUnassigned(value?: string | null): string {
  return value?.trim() ? value : 'Unassigned';
}

function mapAdmissions(applications: ApplicationSummary[]): OpsQueueItem[] {
  return applications
    .filter((app) => ['submitted', 'under_review', 'needs_info', 'fee_paid'].includes(app.status))
    .map((app) => {
      const sla = buildSla(app.submittedAt, 48);
      return {
        id: `admissions-${app.id}`,
        lane: 'Admissions Ops',
        title: `Application review: ${app.fullName}`,
        pendingQueue: 'Application Triage',
        severity: sla.severity,
        slaDueAt: sla.dueAt,
        slaBreachRisk: sla.risk,
        assignedOwner: 'Admissions Team',
        nextBestAction: app.status === 'needs_info' ? 'Follow up for missing documents' : 'Complete review decision',
        summary: `Status is ${app.status}. Program ${app.programId} and intake ${app.intakeId ?? 'unassigned'} are awaiting action.`,
        escalationPath: ['Admissions Lead', 'Registrar'],
      };
    });
}

function mapAcademic(assignments: AdminAssignment[]): OpsQueueItem[] {
  return assignments
    .filter((assignment) => !assignment.meetingUrl)
    .map((assignment) => {
      const createdHint = new Date(Date.now() - assignment.id * 86_400).toISOString();
      const sla = buildSla(createdHint, 72);
      return {
        id: `academic-${assignment.id}`,
        lane: 'Academic Ops',
        title: `Assignment setup: ${assignment.courseTitle ?? assignment.courseId}`,
        pendingQueue: 'Teaching Assignment Coordination',
        severity: sla.severity,
        slaDueAt: sla.dueAt,
        slaBreachRisk: sla.risk,
        assignedOwner: ownerOrUnassigned(assignment.lecturerName),
        nextBestAction: 'Attach meeting details and confirm module/intake pairing',
        summary: `Role ${assignment.role ?? 'lecturer'} for ${assignment.intakeName ?? 'unspecified intake'} still lacks meeting setup.`,
        escalationPath: ['Academic Coordinator', 'Dean of Faculty'],
      };
    });
}

function mapPeople(applications: LecturerApplication[]): OpsQueueItem[] {
  return applications
    .filter((application) => !['approved', 'rejected'].includes(application.status))
    .map((application) => {
      const age = getAgeHours(application.submittedAt);
      const risk = Math.max(25, Math.min(100, Math.round((age / 72) * 100)));
      const severity = getSeverityByRisk(risk);
      const dueAt = new Date(new Date(application.submittedAt ?? Date.now()).getTime() + 72 * 3_600_000).toISOString();

      return {
        id: `people-${application.id}`,
        lane: 'People Ops',
        title: `Lecturer application: ${application.fullName}`,
        pendingQueue: 'Hiring & Onboarding',
        severity,
        slaDueAt: dueAt,
        slaBreachRisk: risk,
        assignedOwner: ownerOrUnassigned(application.department),
        nextBestAction: 'Review profile and record hiring decision notes',
        summary: `Application status is ${application.status} for ${application.programInterest ?? 'general pool'}.`,
        escalationPath: ['People Ops Lead', 'Academic HR Partner'],
      };
    });
}

function mapFinance(rows: FinanceReportRow[]): OpsQueueItem[] {
  return rows
    .filter((row) => row.status.toLowerCase() !== 'settled')
    .map((row, index) => {
      const risk = row.status.toLowerCase().includes('overdue') ? 92 : 64;
      const dueAt = new Date(Date.now() + (row.status.toLowerCase().includes('overdue') ? -1 : 8) * 3_600_000).toISOString();
      return {
        id: `finance-${index}-${row.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        lane: 'Finance Ops',
        title: row.label,
        pendingQueue: 'Finance Exceptions',
        severity: getSeverityByRisk(risk),
        slaDueAt: dueAt,
        slaBreachRisk: risk,
        assignedOwner: 'Finance Desk',
        nextBestAction: 'Validate amount variance and post reconciliation note',
        summary: `Current amount is ${row.amount} with report status ${row.status}.`,
        escalationPath: ['Finance Controller', 'CFO'],
      };
    });
}

function mapCompliance(logs: AuditLogEntry[]): OpsQueueItem[] {
  return logs
    .filter((log) => ['policy', 'security', 'admin', 'permission'].some((needle) => log.action.toLowerCase().includes(needle)))
    .slice(0, 20)
    .map((log) => {
      const sla = buildSla(log.createdAt, 24);
      return {
        id: `compliance-${log.id}`,
        lane: 'Compliance & Audit',
        title: `Audit event: ${log.action}`,
        pendingQueue: 'Audit Review',
        severity: sla.severity,
        slaDueAt: sla.dueAt,
        slaBreachRisk: sla.risk,
        assignedOwner: ownerOrUnassigned(log.actorRole),
        nextBestAction: 'Review payload and confirm control evidence is attached',
        summary: `Target ${log.targetType ?? 'system'} ${log.targetId ?? 'n/a'} from ${log.ipAddress ?? 'unknown IP'}.`,
        escalationPath: ['Compliance Manager', 'Data Protection Officer'],
      };
    });
}

function mapIncidents(routeRequests: RouteChangeRequest[]): OpsQueueItem[] {
  return routeRequests
    .filter((req) => req.status === 'pending')
    .map((req) => {
      const sla = buildSla(req.createdAt, 12);
      return {
        id: `incident-${req.id}`,
        lane: 'Incidents',
        title: `Route escalation: ${req.studentName ?? req.studentEmail ?? `Request ${req.id}`}`,
        pendingQueue: 'Operational Escalations',
        severity: sla.severity,
        slaDueAt: sla.dueAt,
        slaBreachRisk: sla.risk,
        assignedOwner: 'Student Success Desk',
        nextBestAction: 'Resolve intake change block and notify requester',
        summary: `Requested transfer to ${req.requestedIntakeName ?? req.requestedIntakeId}. Reason: ${req.reason ?? 'not supplied'}.`,
        escalationPath: ['Student Operations Lead', 'Registrar'],
      };
    });
}

export async function getAdminOperationsQueue(): Promise<OpsQueueItem[]> {
  const [
    admissionsResult,
    assignmentsResult,
    lecturerAppsResult,
    financeResult,
    auditResult,
    incidentsResult,
  ] = await Promise.allSettled([
    getApplications(),
    getAdminAssignments(),
    getLecturerApplications(),
    getFinanceReport(),
    getAuditLogs(),
    getAdminRouteChangeRequests(),
  ]);

  const admissions = admissionsResult.status === 'fulfilled' ? admissionsResult.value : [];
  const assignments = assignmentsResult.status === 'fulfilled' ? assignmentsResult.value.assignments : [];
  const lecturerApps = lecturerAppsResult.status === 'fulfilled' ? lecturerAppsResult.value : [];
  const financeRows = financeResult.status === 'fulfilled' ? financeResult.value : [];
  const auditLogs = auditResult.status === 'fulfilled' ? auditResult.value : [];
  const routeRequests = incidentsResult.status === 'fulfilled' ? incidentsResult.value : [];

  const items = [
    ...mapAdmissions(admissions),
    ...mapAcademic(assignments),
    ...mapPeople(lecturerApps),
    ...mapFinance(financeRows),
    ...mapCompliance(auditLogs),
    ...mapIncidents(routeRequests),
  ];

  return getSortedLaneItems(items);
}

export function getOpsItemById(items: OpsQueueItem[], id: string): OpsQueueItem | undefined {
  return items.find((item) => item.id === id);
}
