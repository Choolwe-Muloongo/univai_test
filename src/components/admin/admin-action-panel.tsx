'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ScenarioKey =
  | 'intake_overcapacity'
  | 'high_rejection_spike'
  | 'low_lecturer_coverage'
  | 'unpaid_invoices_concentration'
  | 'suspicious_account_activity';

type ScenarioTemplate = {
  label: string;
  whatChanged: string;
  atRisk: string;
  doNow: string;
  notify: string;
  deadline: string;
};

const scenarioTemplates: Record<ScenarioKey, ScenarioTemplate> = {
  intake_overcapacity: {
    label: 'Intake overcapacity',
    whatChanged: 'Confirmed enrollments exceeded planned seats for the active intake.',
    atRisk: 'Timetables, class sizes, support capacity, and student onboarding quality.',
    doNow: 'Freeze auto-accept for this intake, create overflow section options, and publish a short waitlist update.',
    notify: 'Admissions lead, registrar operations, program director, and student support.',
    deadline: 'Within 24 hours before the next admissions communication cycle.',
  },
  high_rejection_spike: {
    label: 'High rejection spike',
    whatChanged: 'Rejection rate increased above recent baseline for submitted applications.',
    atRisk: 'Enrollment targets, fairness perception, and conversion from qualified applicants.',
    doNow: 'Audit top rejection reasons, sample borderline files, and confirm policy/config changes this week.',
    notify: 'Admissions reviewers, policy owner, and marketing/recruitment team.',
    deadline: 'Same business day; publish findings by end of day.',
  },
  low_lecturer_coverage: {
    label: 'Low lecturer coverage',
    whatChanged: 'Open courses/modules no longer have enough assigned lecturer capacity.',
    atRisk: 'Teaching continuity, grading turnaround, and learner satisfaction.',
    doNow: 'Prioritize critical modules, add backup lecturers, and rebalance assignments by workload.',
    notify: 'Academic operations, program heads, and lecturer management.',
    deadline: 'Resolve coverage plan within 48 hours.',
  },
  unpaid_invoices_concentration: {
    label: 'Unpaid invoices concentration',
    whatChanged: 'A large share of overdue balances is clustered in one cohort or billing cycle.',
    atRisk: 'Cash flow, student retention, and compliance with payment policy.',
    doNow: 'Segment affected students, trigger reminder cadence, and offer approved payment-plan options.',
    notify: 'Finance operations, student success, and compliance/bursar contacts.',
    deadline: 'Start outreach within 1 business day; review recovery trend in 7 days.',
  },
  suspicious_account_activity: {
    label: 'Suspicious account activity',
    whatChanged: 'Account behavior patterns indicate potential abuse or unauthorized access.',
    atRisk: 'Data privacy, platform trust, and operational security posture.',
    doNow: 'Apply risk controls (session reset/step-up auth), log incident details, and isolate impacted accounts.',
    notify: 'Security response lead, platform engineering on-call, and compliance officer.',
    deadline: 'Immediate triage in under 1 hour; incident update within 4 hours.',
  },
};

const defaultScenarioOrder: ScenarioKey[] = [
  'intake_overcapacity',
  'high_rejection_spike',
  'low_lecturer_coverage',
  'unpaid_invoices_concentration',
  'suspicious_account_activity',
];

type AdminActionPanelProps = {
  title?: string;
  description?: string;
  scenarios?: ScenarioKey[];
};

export function AdminActionPanel({
  title = 'Admin Action Panel',
  description = 'Use a scenario template when you need lightweight next steps.',
  scenarios = defaultScenarioOrder,
}: AdminActionPanelProps) {
  const availableScenarios = useMemo(() => scenarios.filter((id) => scenarioTemplates[id]), [scenarios]);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>(availableScenarios[0] ?? 'intake_overcapacity');
  const [showGuidance, setShowGuidance] = useState(false);

  const template = scenarioTemplates[selectedScenario];

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowGuidance((prev) => !prev)}>
            {showGuidance ? 'Hide guidance' : 'Show guidance'}
          </Button>
        </div>
        {showGuidance && (
          <div className="space-y-2">
            <Label htmlFor="admin-action-scenario">Scenario template</Label>
            <Select value={selectedScenario} onValueChange={(value) => setSelectedScenario(value as ScenarioKey)}>
              <SelectTrigger id="admin-action-scenario" className="md:w-[320px]">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                {availableScenarios.map((scenarioId) => (
                  <SelectItem key={scenarioId} value={scenarioId}>
                    {scenarioTemplates[scenarioId].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      {showGuidance && (
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3 text-sm">
            <p className="mb-1 flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              What changed?
            </p>
            <p className="text-muted-foreground">{template.whatChanged}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="mb-1 flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 text-primary" />
              What is at risk?
            </p>
            <p className="text-muted-foreground">{template.atRisk}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="mb-1 flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              What should I do now?
            </p>
            <p className="text-muted-foreground">{template.doNow}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm">
            <p className="mb-1 flex items-center gap-2 font-medium">
              <BellRing className="h-4 w-4 text-primary" />
              Who should be notified?
            </p>
            <p className="text-muted-foreground">{template.notify}</p>
          </div>
          <div className="rounded-lg border p-3 text-sm md:col-span-2">
            <p className="mb-1 flex items-center gap-2 font-medium">
              <CalendarClock className="h-4 w-4 text-primary" />
              What deadline applies?
            </p>
            <p className="text-muted-foreground">{template.deadline}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
