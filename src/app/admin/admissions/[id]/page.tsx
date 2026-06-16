'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  getApplicationById,
  getApplicationDocuments,
  getIntakes,
  getPrograms,
  reviewApplicationDocument,
  updateApplicationStatus,
} from '@/lib/api';
import type { ApplicationDetail, ApplicationDocument, ApplicationStatus, Intake, Program } from '@/lib/api/types';
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, Mail, ShieldCheck, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const statusLabels: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  fee_paid: 'Fee Paid',
  under_review: 'Under Review',
  needs_info: 'Needs Info',
  offer_sent: 'Offer Sent',
  approved: 'Offer Sent',
  rejected: 'Rejected',
  admitted: 'Admitted',
};

const flowSteps = [
  'Application submitted',
  'Application fee paid',
  'Documents verified',
  'Eligibility checked',
  'Offer sent',
  'Student accepts offer',
  'Admission letter appears',
  'Student completes enrollment',
];

function normaliseSubjectKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function requiredSubjectsFor(program?: Program | null) {
  const subjects = Array.isArray(program?.requiredSubjects) ? program?.requiredSubjects : [];
  return subjects.map((subject: any) => {
    const label = subject.subjectName || subject.name || subject.subjectId || 'Required subject';
    return {
      id: normaliseSubjectKey(subject.subjectId || label),
      label,
      minimumPoints: Number(subject.minimumPoints ?? 1),
    };
  });
}

export default function AdmissionDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [notes, setNotes] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerLetterUrl, setOfferLetterUrl] = useState('');
  const [needsInfoMessage, setNeedsInfoMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedIntake, setSelectedIntake] = useState<string>('');
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [docNotes, setDocNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadApplication = async () => {
      setLoading(true);
      const [data, intakeList, docList, programList] = await Promise.all([
        getApplicationById(id as string),
        getIntakes(),
        getApplicationDocuments(id as string),
        getPrograms(),
      ]);
      setApplication(data);
      setNotes(data?.notes || '');
      setOfferMessage(data?.offerLetterMessage ?? '');
      setOfferLetterUrl(data?.offerLetterUrl ?? '');
      setNeedsInfoMessage(data?.needsInfoMessage ?? '');
      setPrograms(programList);
      setIntakes(intakeList.filter((intake) => intake.programId === data?.programId));
      setSelectedIntake(data?.intakeId || '');
      setDocuments(docList);
      setLoading(false);
    };

    loadApplication();
  }, [id]);

  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === application?.programId) ?? null,
    [programs, application?.programId]
  );

  const requiredSubjects = useMemo(() => requiredSubjectsFor(selectedProgram), [selectedProgram]);

  const subjectSummary = useMemo(() => {
    if (!application) return { total: 0, missing: [] as string[], totalPoints: 0, checks: [] as { label: string; required: number; actual: number; passed: boolean }[] };
    const subjectPoints = application.subjectPoints || {};
    const normalisedPoints = Object.fromEntries(
      Object.entries(subjectPoints).map(([key, value]) => [normaliseSubjectKey(key), Number(value) || 0])
    );
    const totalPoints = Object.values(subjectPoints).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
    const checks = requiredSubjects.map((subject) => {
      const actual = Number(normalisedPoints[subject.id] ?? 0);
      return { label: subject.label, required: subject.minimumPoints, actual, passed: actual >= subject.minimumPoints };
    });
    return {
      total: Object.values(subjectPoints).filter((value) => Number(value) > 0).length,
      missing: checks.filter((check) => !check.passed).map((check) => check.label),
      totalPoints,
      checks,
    };
  }, [application, requiredSubjects]);

  const verifiedDocumentCount = documents.filter((doc) => doc.status === 'verified').length;
  const rejectedDocumentCount = documents.filter((doc) => doc.status === 'rejected').length;
  const allDocumentsVerified = documents.length > 0 && rejectedDocumentCount === 0 && verifiedDocumentCount === documents.length;
  const feePaid = Boolean(application?.admissionFeePaid || ['fee_paid', 'under_review', 'offer_sent', 'approved', 'admitted'].includes(application?.status ?? ''));
  const hasSelectedIntake = Boolean(selectedIntake);
  const eligibilityPassed = subjectSummary.missing.length === 0;
  const offerBlockers = [
    !feePaid ? 'Application fee is not marked as paid.' : null,
    !hasSelectedIntake ? 'Assign the applicant to an intake.' : null,
    !allDocumentsVerified ? 'Verify all uploaded documents before sending an offer.' : null,
    !eligibilityPassed ? `Missing or low required subjects: ${subjectSummary.missing.join(', ')}.` : null,
  ].filter(Boolean) as string[];
  const readyForOffer = offerBlockers.length === 0;

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!application) return;

    if ((status === 'offer_sent' || status === 'approved' || status === 'admitted') && !readyForOffer) {
      toast({
        title: 'Application is not offer-ready',
        description: offerBlockers[0] ?? 'Complete the readiness checks first.',
        variant: 'destructive',
      });
      return;
    }

    if (status === 'admitted' && !['offer_sent', 'approved'].includes(application.status)) {
      toast({
        title: 'Send the offer first',
        description: 'The standard flow is: Send Offer → student accepts offer → Admission Letter appears. Use manual admission only after an offer exists.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const updated = await updateApplicationStatus(application.id, status, notes, selectedIntake || null, {
        offerMessage,
        offerLetterUrl,
        needsInfoMessage,
      });
      if (updated) {
        setApplication(updated);
        toast({
          title: status === application.status ? 'Offer letter resent' : 'Application updated',
          description: status === application.status ? 'The offer letter was regenerated and the applicant was notified again.' : `Status set to ${statusLabels[status]}.`,
        });
      }
    } catch (error: any) {
      console.error('Failed to update application status', error);
      toast({
        title: 'Update failed',
        description: error?.details?.message || error?.message || 'Could not update this application. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading application...</p>;
  if (!application) return <p className="text-sm text-muted-foreground">Application not found.</p>;

  const canSendOffer = ['submitted', 'fee_paid', 'under_review', 'needs_info'].includes(application.status);
  const offerAlreadySent = ['offer_sent', 'approved', 'admitted'].includes(application.status);
  const canResendOffer = ['offer_sent', 'approved'].includes(application.status);
  const canManualAdmit = ['offer_sent', 'approved'].includes(application.status);
  const isAdmitted = application.status === 'admitted';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applicant Review</h1>
          <p className="text-muted-foreground">Review fee, eligibility, documents, intake, and letters before admission.</p>
        </div>
        <Badge variant="secondary">{statusLabels[application.status]}</Badge>
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" />Official Admissions Flow</CardTitle>
          <CardDescription>Do not send an offer until the readiness checks are satisfied.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-4">
          {flowSteps.map((step, index) => (
            <div key={step} className="rounded-lg border p-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground">Step {index + 1}</p>
              <p className="font-medium">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {!readyForOffer && !offerAlreadySent ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not ready for offer</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {offerBlockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Applicant Details</CardTitle>
            <CardDescription>Review personal details, programme choice, and assigned intake.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="text-xs text-muted-foreground">Full Name</p><p className="font-semibold">{application.fullName}</p></div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="font-semibold flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{application.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Program</p><p className="font-semibold">{selectedProgram?.title ?? application.programId.toUpperCase()}</p></div>
              <div><p className="text-xs text-muted-foreground">School</p><p className="font-semibold">{application.schoolId.toUpperCase()}</p></div>
              <div><p className="text-xs text-muted-foreground">Delivery Mode</p><p className="font-semibold">{application.deliveryMode}</p></div>
              <div><p className="text-xs text-muted-foreground">Learning Style</p><p className="font-semibold">{application.learningStyle}</p></div>
              <div><p className="text-xs text-muted-foreground">Application Fee</p><Badge variant={feePaid ? 'default' : 'destructive'}>{feePaid ? 'Paid' : 'Not paid'}</Badge></div>
              <div className="md:col-span-2">
                <p className="mb-2 text-xs text-muted-foreground">Assigned Intake</p>
                <Select value={selectedIntake} onValueChange={setSelectedIntake} disabled={isAdmitted}>
                  <SelectTrigger><SelectValue placeholder="Select intake before sending offer" /></SelectTrigger>
                  <SelectContent>{intakes.map((intake) => <SelectItem key={intake.id} value={intake.id}>{intake.name} - {intake.deliveryMode}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">Intake, fee, documents, and eligibility are required before sending the offer.</CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Eligibility Summary</CardTitle>
            <CardDescription>Programme-specific checks before sending an offer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>Subjects provided</span><span className="font-semibold">{subjectSummary.total}</span></div>
            <div className="flex items-center justify-between"><span>Total points</span><span className="font-semibold">{subjectSummary.totalPoints}</span></div>
            <div className="flex items-center justify-between"><span>Verified documents</span><span className="font-semibold">{verifiedDocumentCount}/{documents.length}</span></div>
            <div className="flex items-center justify-between"><span>Readiness</span><Badge variant={readyForOffer ? 'default' : 'destructive'}>{readyForOffer ? 'Offer ready' : 'Blocked'}</Badge></div>
            {subjectSummary.checks.length > 0 ? subjectSummary.checks.map((check) => (
              <div key={check.label} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between"><span>{check.label}</span><Badge variant={check.passed ? 'default' : 'destructive'}>{check.actual}/{check.required}</Badge></div>
              </div>
            )) : <p className="rounded-lg border p-3 text-xs text-muted-foreground">No programme-specific subjects configured. Backend minimum points still apply if configured.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Decision & Letters</CardTitle>
          <CardDescription>The normal decision is Send Offer. The student must accept before admission letter/enrollment.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><p className="text-sm font-semibold">Offer Message</p><Textarea className="min-h-24" value={offerMessage} onChange={(event) => setOfferMessage(event.target.value)} placeholder="Optional custom message for the offer letter." disabled={isAdmitted} /></div>
          <div className="space-y-2"><p className="text-sm font-semibold">Custom Offer Letter URL</p><Textarea className="min-h-24" value={offerLetterUrl} onChange={(event) => setOfferLetterUrl(event.target.value)} placeholder="Optional. Leave empty to let UnivAI generate the official letter." disabled={isAdmitted} /></div>
          <div className="space-y-2 md:col-span-2"><p className="text-sm font-semibold">Needs Info Message</p><Textarea className="min-h-24" value={needsInfoMessage} onChange={(event) => setNeedsInfoMessage(event.target.value)} placeholder="Tell the applicant what documents or corrections are needed." disabled={isAdmitted} /></div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {!offerAlreadySent && <Button variant="outline" onClick={() => handleStatusChange('under_review')}>Mark Under Review</Button>}
          {!offerAlreadySent && <Button variant="outline" onClick={() => handleStatusChange('needs_info')}>Send Needs Info</Button>}
          {canSendOffer && <Button onClick={() => handleStatusChange('offer_sent')} disabled={!readyForOffer}>Send Offer & Generate Offer Letter</Button>}
          {canResendOffer && <Button onClick={() => handleStatusChange(application.status)} disabled={!readyForOffer}>Resend / Regenerate Offer Letter</Button>}
          {canManualAdmit && <Button variant="secondary" onClick={() => handleStatusChange('admitted')} disabled={!readyForOffer}>Manual Override: Mark Admitted</Button>}
          {!isAdmitted && <Button variant="destructive" onClick={() => handleStatusChange('rejected')}>Reject Application</Button>}
          {isAdmitted && <Badge variant="default">Admission letter will be available in the applicant portal.</Badge>}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Document Review</CardTitle>
          <CardDescription>Verify every required applicant upload before sending an offer.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 && <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"><p className="font-semibold text-foreground">No documents uploaded yet</p><p className="mt-1">Next action: request missing uploads before sending an offer.</p>{!offerAlreadySent && <Button className="mt-3" size="sm" variant="outline" onClick={() => handleStatusChange('needs_info')}>Send Needs Info</Button>}</div>}
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{doc.documentType.replace(/-/g, ' ')}</p><p className="text-xs text-muted-foreground">{doc.fileName}</p></div><Badge variant={doc.status === 'verified' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'outline'}>{doc.status}</Badge></div>
              <Textarea placeholder="Review notes" value={docNotes[doc.id] ?? doc.reviewNotes ?? ''} onChange={(event) => setDocNotes((prev) => ({ ...prev, [doc.id]: event.target.value }))} className="min-h-20" disabled={isAdmitted} />
              {!isAdmitted && <div className="flex gap-2"><Button variant="outline" onClick={async () => { const updated = await reviewApplicationDocument(id as string, doc.id, 'verified', docNotes[doc.id]); setDocuments((prev) => prev.map((item) => (item.id === doc.id ? updated : item))); }}>Verify</Button><Button variant="destructive" onClick={async () => { const updated = await reviewApplicationDocument(id as string, doc.id, 'rejected', docNotes[doc.id]); setDocuments((prev) => prev.map((item) => (item.id === doc.id ? updated : item))); }}>Reject</Button></div>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" />Reviewer Notes</CardTitle><CardDescription>Capture admissions rationale and follow-ups.</CardDescription></CardHeader>
        <CardContent><Textarea className="min-h-32" value={notes} onChange={(event) => setNotes(event.target.value)} /></CardContent>
      </Card>
    </div>
  );
}
