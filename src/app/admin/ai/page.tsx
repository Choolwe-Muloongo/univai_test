'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getApplications,
  getApplicationById,
  getApplicationDocuments,
  getPrograms,
  getCurriculumVersions,
  getCurriculumModules,
  getAcademicPolicies,
  getAdminDashboard,
  getAuditLogs,
  generateAi,
} from '@/lib/api';
import type {
  ApplicationSummary,
  ApplicationDetail,
  ApplicationDocument,
  CurriculumVersion,
  CurriculumModule,
  AcademicPolicy,
  AdminDashboardData,
  AuditLogEntry,
  Program,
} from '@/lib/api/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const truncate = (value: string, max = 1200) =>
  value.length > max ? `${value.slice(0, max)}...` : value;

export default function AdminAiConsolePage() {
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [policies, setPolicies] = useState<AcademicPolicy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [admissionsOutput, setAdmissionsOutput] = useState('');
  const [curriculumOutput, setCurriculumOutput] = useState('');
  const [policyOutput, setPolicyOutput] = useState('');
  const [retentionOutput, setRetentionOutput] = useState('');
  const [complianceOutput, setComplianceOutput] = useState('');
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const [admissionsIntent, setAdmissionsIntent] = useState('review');

  useEffect(() => {
    const loadBase = async () => {
      const [appsData, programsData, policiesData, dashboardData, auditData] = await Promise.all([
        getApplications(),
        getPrograms(),
        getAcademicPolicies(),
        getAdminDashboard(),
        getAuditLogs(),
      ]);
      setApps(appsData);
      setPrograms(programsData);
      setPolicies(policiesData);
      setDashboard(dashboardData);
      setAuditLogs(auditData);
      setSelectedAppId(appsData[0]?.id ?? '');
      setSelectedProgramId(programsData[0]?.id ?? '');
      setSelectedPolicyId(policiesData[0]?.id ?? null);
    };
    loadBase();
  }, []);

  useEffect(() => {
    const loadApp = async () => {
      if (!selectedAppId) {
        setApplication(null);
        setDocuments([]);
        return;
      }
      const [detail, docs] = await Promise.all([
        getApplicationById(selectedAppId),
        getApplicationDocuments(selectedAppId),
      ]);
      setApplication(detail);
      setDocuments(docs);
    };
    loadApp();
  }, [selectedAppId]);

  useEffect(() => {
    const loadVersions = async () => {
      if (!selectedProgramId) {
        setVersions([]);
        setSelectedVersionId('');
        return;
      }
      const data = await getCurriculumVersions(selectedProgramId);
      setVersions(data);
      setSelectedVersionId(data[0]?.id ?? '');
    };
    loadVersions();
  }, [selectedProgramId]);

  useEffect(() => {
    const loadModules = async () => {
      if (!selectedVersionId) {
        setModules([]);
        return;
      }
      const data = await getCurriculumModules(selectedVersionId);
      setModules(data);
    };
    loadModules();
  }, [selectedVersionId]);

  const selectedPolicy = useMemo(
    () => policies.find((policy) => policy.id === selectedPolicyId) ?? null,
    [policies, selectedPolicyId]
  );

  const admissionsContext = useMemo(() => {
    if (!application) return '';
    const docSummary = documents.length
      ? documents.map((doc) => `${doc.documentType}: ${doc.status ?? 'uploaded'}`).join(', ')
      : 'No documents uploaded';
    const subjectPoints = application.subjectPoints
      ? Object.entries(application.subjectPoints)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      : 'Not provided';
    return truncate(
      [
        `Applicant: ${application.fullName} (${application.email})`,
        `Program: ${application.programId}`,
        `Delivery: ${application.deliveryMode}`,
        `Status: ${application.status}`,
        `Subject points: ${subjectPoints}`,
        `Total points: ${application.totalPoints}`,
        `Documents: ${docSummary}`,
        `Notes: ${application.notes ?? 'None'}`,
      ].join('\n'),
      1800
    );
  }, [application, documents]);

  const curriculumContext = useMemo(() => {
    if (!selectedVersionId) return '';
    const moduleLines = modules.map(
      (module) =>
        `Sem ${module.semester}: ${module.title} (${module.credits ?? 0} credits) ${module.isCore ? '[Core]' : '[Elective]'}`
    );
    return truncate(
      [
        `Program: ${selectedProgramId}`,
        `Curriculum version: ${selectedVersionId}`,
        `Modules:`,
        ...moduleLines,
      ].join('\n'),
      2200
    );
  }, [modules, selectedProgramId, selectedVersionId]);

  const policyContext = useMemo(() => {
    if (!selectedPolicy) return '';
    return truncate(
      JSON.stringify(
        {
          name: selectedPolicy.name,
          passMark: selectedPolicy.passMark,
          repeatRule: selectedPolicy.repeatRule,
          maxAttempts: selectedPolicy.maxAttempts,
          creditAwardPolicy: selectedPolicy.creditAwardPolicy,
          gradeBands: selectedPolicy.gradeBands,
          progressionPolicy: selectedPolicy.progressionPolicy,
        },
        null,
        2
      ),
      1800
    );
  }, [selectedPolicy]);

  const retentionContext = useMemo(() => {
    if (!dashboard) return '';
    return truncate(
      JSON.stringify(
        {
          metrics: dashboard.metrics,
          recentApplications: apps.slice(0, 8),
        },
        null,
        2
      ),
      1800
    );
  }, [dashboard, apps]);

  const complianceContext = useMemo(() => {
    if (!auditLogs.length) return '';
    const recent = auditLogs.slice(0, 20).map((log) => ({
      action: log.action,
      actor: log.actor,
      role: log.role,
      createdAt: log.createdAt,
    }));
    return truncate(JSON.stringify(recent, null, 2), 1800);
  }, [auditLogs]);

  const runAi = async (key: string, prompt: string, context: string, setOutput: (value: string) => void) => {
    setLoadingKey(key);
    try {
      const response = await generateAi({ prompt, context, mode: 'general' });
      setOutput(response.text || response.error || 'No response returned.');
    } catch (error) {
      setOutput('AI request failed. Please try again.');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin AI Console</h1>
        <p className="text-muted-foreground">Use AI to accelerate admissions, curriculum review, and compliance checks.</p>
      </div>

      <Tabs defaultValue="admissions" className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="admissions">Admissions</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="admissions">
          <Card>
            <CardHeader>
              <CardTitle>Admissions Intelligence</CardTitle>
              <CardDescription>Generate eligibility summaries and draft response messages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Applicant</Label>
                  <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select applicant" />
                    </SelectTrigger>
                    <SelectContent>
                      {apps.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.fullName} ({app.programId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>AI Task</Label>
                  <Select value={admissionsIntent} onValueChange={setAdmissionsIntent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="review">Eligibility Review</SelectItem>
                      <SelectItem value="needs-info">Draft Needs-Info Message</SelectItem>
                      <SelectItem value="offer">Draft Offer Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Context snapshot</p>
                <pre className="whitespace-pre-wrap">{admissionsContext || 'Select an applicant to load context.'}</pre>
              </div>

              <Button
                onClick={() =>
                  runAi(
                    'admissions',
                    admissionsIntent === 'needs-info'
                      ? 'Draft a concise “needs info” message listing missing documents and next steps.'
                      : admissionsIntent === 'offer'
                      ? 'Draft a professional offer letter summary with next steps.'
                      : 'Summarize eligibility, missing items, and recommended next action in bullet points.',
                    admissionsContext,
                    setAdmissionsOutput
                  )
                }
                disabled={!admissionsContext || loadingKey === 'admissions'}
              >
                {loadingKey === 'admissions' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Admissions AI
              </Button>

              <Textarea value={admissionsOutput} readOnly rows={8} placeholder="AI output will appear here." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum">
          <Card>
            <CardHeader>
              <CardTitle>Curriculum Review</CardTitle>
              <CardDescription>Scan modules, prerequisites, and semester balance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Curriculum Version</Label>
                  <Select value={selectedVersionId} onValueChange={setSelectedVersionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {version.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Module list</p>
                <pre className="whitespace-pre-wrap">{curriculumContext || 'Select a program to load modules.'}</pre>
              </div>

              <Button
                onClick={() =>
                  runAi(
                    'curriculum',
                    'Review this curriculum for gaps, overloaded semesters, and missing prerequisites. Provide actionable recommendations.',
                    curriculumContext,
                    setCurriculumOutput
                  )
                }
                disabled={!curriculumContext || loadingKey === 'curriculum'}
              >
                {loadingKey === 'curriculum' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Curriculum AI
              </Button>

              <Textarea value={curriculumOutput} readOnly rows={8} placeholder="AI output will appear here." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy">
          <Card>
            <CardHeader>
              <CardTitle>Academic Policy Simulator</CardTitle>
              <CardDescription>Analyze grading rules and progression impact.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Policy Template</Label>
                <Select value={selectedPolicyId ? String(selectedPolicyId) : ''} onValueChange={(value) => setSelectedPolicyId(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((policy) => (
                      <SelectItem key={policy.id} value={String(policy.id)}>
                        {policy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Policy snapshot</p>
                <pre className="whitespace-pre-wrap">{policyContext || 'Select a policy to view details.'}</pre>
              </div>

              <Button
                onClick={() =>
                  runAi(
                    'policy',
                    'Analyze this grading policy. Highlight risks, fairness issues, and expected GPA/progression impact.',
                    policyContext,
                    setPolicyOutput
                  )
                }
                disabled={!policyContext || loadingKey === 'policy'}
              >
                {loadingKey === 'policy' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Policy AI
              </Button>

              <Textarea value={policyOutput} readOnly rows={8} placeholder="AI output will appear here." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle>Retention & Risk Monitor</CardTitle>
              <CardDescription>Identify at-risk cohorts and interventions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Admin metrics</p>
                <pre className="whitespace-pre-wrap">{retentionContext || 'Admin metrics unavailable.'}</pre>
              </div>
              <Button
                onClick={() =>
                  runAi(
                    'retention',
                    'Review the metrics and suggest interventions for retention, academic support, and student success.',
                    retentionContext,
                    setRetentionOutput
                  )
                }
                disabled={!retentionContext || loadingKey === 'retention'}
              >
                {loadingKey === 'retention' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Retention AI
              </Button>
              <Textarea value={retentionOutput} readOnly rows={8} placeholder="AI output will appear here." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Audit Assistant</CardTitle>
              <CardDescription>Summarize audit logs and flag anomalies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Recent audit entries</p>
                <pre className="whitespace-pre-wrap">{complianceContext || 'No audit logs available.'}</pre>
              </div>
              <Button
                onClick={() =>
                  runAi(
                    'compliance',
                    'Summarize compliance risks, unusual activities, and suggested follow-ups based on these audit logs.',
                    complianceContext,
                    setComplianceOutput
                  )
                }
                disabled={!complianceContext || loadingKey === 'compliance'}
              >
                {loadingKey === 'compliance' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Run Compliance AI
              </Button>
              <Textarea value={complianceOutput} readOnly rows={8} placeholder="AI output will appear here." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
