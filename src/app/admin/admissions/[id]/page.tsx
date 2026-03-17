'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getApplicationById, updateApplicationStatus, getIntakes, getApplicationDocuments, reviewApplicationDocument } from '@/lib/api';
import type { ApplicationDetail, ApplicationStatus, Intake, ApplicationDocument } from '@/lib/api/types';
import { ClipboardCheck, Mail, ShieldCheck, User, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminActionPanel } from '@/components/admin/admin-action-panel';

const requiredSubjects = ['english-language', 'mathematics'];

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
  const [selectedIntake, setSelectedIntake] = useState<string>('');
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [docNotes, setDocNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadApplication = async () => {
      setLoading(true);
      const [data, intakeList, docList] = await Promise.all([
        getApplicationById(id as string),
        getIntakes(),
        getApplicationDocuments(id as string),
      ]);
      setApplication(data);
      setNotes(data?.notes || '');
      setOfferMessage(data?.offerLetterMessage ?? '');
      setOfferLetterUrl(data?.offerLetterUrl ?? '');
      setNeedsInfoMessage(data?.needsInfoMessage ?? '');
      setIntakes(intakeList.filter((intake) => intake.programId === data?.programId));
      setSelectedIntake(data?.intakeId || '');
      setDocuments(docList);
      setLoading(false);
    };
    loadApplication();
  }, [id]);

  const subjectSummary = useMemo(() => {
    if (!application) return { total: 0, missing: [], totalPoints: 0 };
    const totalPoints = Object.values(application.subjectPoints).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const missing = requiredSubjects.filter((subject) => !application.subjectPoints[subject]);
    return {
      total: Object.values(application.subjectPoints).filter((value) => Number(value) > 0).length,
      missing,
      totalPoints,
    };
  }, [application]);

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!application) return;
    if ((status === 'offer_sent' || status === 'admitted' || status === 'approved') && !selectedIntake) {
      toast({
        title: 'Select an intake first',
        description: 'Assign the applicant to an intake before approval.',
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
          title: 'Application updated',
          description: `Status set to ${statusLabels[status]}.`,
        });
      }
    } catch (error) {
      console.error('Failed to update application status', error);
      toast({
        title: 'Update failed',
        description: 'Could not update this application. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading application...</p>;
  }

  if (!application) {
    return <p className="text-sm text-muted-foreground">Application not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applicant Review</h1>
          <p className="text-muted-foreground">Admissions decision and enrollment prep.</p>
        </div>
        <Badge variant="secondary">{statusLabels[application.status]}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Applicant Details
            </CardTitle>
            <CardDescription>Review personal and program selections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-semibold">{application.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {application.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Program</p>
                <p className="font-semibold">{application.programId.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">School</p>
                <p className="font-semibold">{application.schoolId.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivery Mode</p>
                <p className="font-semibold">{application.deliveryMode}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Learning Style</p>
                <p className="font-semibold">{application.learningStyle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned Intake</p>
                <Select value={selectedIntake} onValueChange={setSelectedIntake}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intake" />
                  </SelectTrigger>
                  <SelectContent>
                    {intakes.map((intake) => (
                      <SelectItem key={intake.id} value={intake.id}>
                        {intake.name} - {intake.deliveryMode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Use the Admin Action Panel below to submit governed decisions.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              AI Eligibility Summary
            </CardTitle>
            <CardDescription>Automated checks for required subjects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Subjects provided</span>
              <span className="font-semibold">{subjectSummary.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total points</span>
              <span className="font-semibold">{subjectSummary.totalPoints}</span>
            </div>
            {subjectSummary.missing.length > 0 ? (
              <div className="rounded-lg border border-dashed p-3 text-xs text-destructive">
                Missing required subjects: {subjectSummary.missing.join(', ')}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                Required subjects satisfied.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Offer & Needs Info
          </CardTitle>
          <CardDescription>Compose offer letters and request missing documents.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Offer Message</p>
            <Textarea
              className="min-h-24"
              value={offerMessage}
              onChange={(event) => setOfferMessage(event.target.value)}
              placeholder="Offer letter message shown to the applicant."
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Offer Letter URL (optional)</p>
            <Textarea
              className="min-h-24"
              value={offerLetterUrl}
              onChange={(event) => setOfferLetterUrl(event.target.value)}
              placeholder="Paste a custom offer letter URL if needed."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-semibold">Needs Info Message</p>
            <Textarea
              className="min-h-24"
              value={needsInfoMessage}
              onChange={(event) => setNeedsInfoMessage(event.target.value)}
              placeholder="Describe the missing documents or corrections needed."
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => handleStatusChange('needs_info')}>
            Send Needs Info
          </Button>
          <Button onClick={() => handleStatusChange('offer_sent')}>
            Send Offer
          </Button>
        </CardFooter>
      </Card>

      <AdminActionPanel
        title="Admission Decision Panel"
        situationSummary={`Application ${application.id} for ${application.fullName} is currently ${statusLabels[application.status]}. Review eligibility, documents, and reviewer notes before submitting an action.`}
        evidence={[
          {
            id: 'admission-documents',
            label: 'Uploaded documents',
            detail: `${documents.length} file(s) available for verification in the Document Review section.`,
            kind: 'document',
          },
          {
            id: 'subject-points',
            label: 'Eligibility checks',
            detail: `Subjects counted: ${subjectSummary.total}, total points: ${subjectSummary.totalPoints}.`,
            kind: 'log',
          },
          {
            id: 'review-history',
            label: 'Reviewer history',
            detail: notes ? 'Reviewer notes are available for this application.' : 'No reviewer notes have been captured yet.',
            kind: 'history',
          },
        ]}
        actions={[
          {
            id: 'under_review',
            label: 'Mark Under Review',
            description: 'Move the application into active triage for verification.',
            consequenceHint: 'Applicant remains in review queue and cannot be enrolled yet.',
            requiredNotifications: ['Admissions operations queue'],
            reversible: true,
            rollbackPath: 'Set status back to submitted.',
            variant: 'outline',
          },
          {
            id: 'needs_info',
            label: 'Request Info',
            description: 'Ask applicant for missing items before a final decision.',
            consequenceHint: 'Timeline pauses until applicant responds with requested evidence.',
            requiredNotifications: ['Applicant email', 'Admissions case owner'],
            reversible: true,
            rollbackPath: 'Return to under_review after missing info is received.',
            variant: 'outline',
          },
          {
            id: 'offer_sent',
            label: 'Send Offer',
            description: 'Issue an offer and trigger applicant acceptance workflow.',
            consequenceHint: 'Offer acceptance and enrollment workflows start immediately.',
            requiredNotifications: ['Applicant email', 'Enrollment team'],
            reversible: true,
            rollbackPath: 'Withdraw offer and set to under_review with documented reason.',
            sensitive: true,
          },
          {
            id: 'admitted',
            label: 'Mark Admitted',
            description: 'Finalize admission and release onboarding permissions.',
            consequenceHint: 'Student gains program access and intake allocation is committed.',
            requiredNotifications: ['Applicant email', 'Registrar', 'Finance office'],
            reversible: false,
            rollbackPath: 'Open a registrar-led exception case to reverse admission.',
            sensitive: true,
            variant: 'secondary',
          },
          {
            id: 'rejected',
            label: 'Reject Application',
            description: 'Close the application as not approved for the selected intake.',
            consequenceHint: 'Applicant cannot proceed without reapplying or appeal approval.',
            requiredNotifications: ['Applicant email', 'Admissions quality review mailbox'],
            reversible: true,
            rollbackPath: 'Reopen case and move to under_review if rejection was in error.',
            sensitive: true,
            variant: 'destructive',
          },
        ]}
        onSubmitAction={async (actionId) => {
          await handleStatusChange(actionId as ApplicationStatus);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Document Review
          </CardTitle>
          <CardDescription>Verify applicant uploads and add notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">No documents uploaded yet</p>
              <p className="mt-1">Next action: request missing uploads via "Send Needs Info" before making a final decision.</p>
              <Button className="mt-3" size="sm" variant="outline" onClick={() => handleStatusChange('needs_info')}>
                Send Needs Info
              </Button>
            </div>
          )}
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{doc.documentType.replace(/-/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                </div>
                <Badge variant={doc.status === 'verified' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'outline'}>
                  {doc.status}
                </Badge>
              </div>
              <Textarea
                placeholder="Review notes"
                value={docNotes[doc.id] ?? doc.reviewNotes ?? ''}
                onChange={(event) => setDocNotes((prev) => ({ ...prev, [doc.id]: event.target.value }))}
                className="min-h-20"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    const updated = await reviewApplicationDocument(id as string, doc.id, 'verified', docNotes[doc.id]);
                    setDocuments((prev) => prev.map((item) => (item.id === doc.id ? updated : item)));
                  }}
                >
                  Verify
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    const updated = await reviewApplicationDocument(id as string, doc.id, 'rejected', docNotes[doc.id]);
                    setDocuments((prev) => prev.map((item) => (item.id === doc.id ? updated : item)));
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Subject Points
          </CardTitle>
          <CardDescription>Verified Grade 12 results.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(application.subjectPoints).map(([subject, points]) => (
            <div key={subject} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">{subject.replace(/-/g, ' ')}</p>
              <p className="text-lg font-semibold">{points}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Reviewer Notes
          </CardTitle>
          <CardDescription>Capture decisions and follow-ups.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-32"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add notes or rationale for approval/rejection."
          />
        </CardContent>
      </Card>
    </div>
  );
}
