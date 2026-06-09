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
  reviewApplicationDocument,
  updateApplicationStatus,
} from '@/lib/api';
import type { ApplicationDetail, ApplicationDocument, ApplicationStatus, Intake } from '@/lib/api/types';
import { AlertTriangle, CheckCircle2, ClipboardCheck, FileText, Mail, ShieldCheck, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const requiredSubjects = ['english-language', 'mathematics'];

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
  'Admin reviews',
  'Admin sends offer',
  'Offer Letter appears',
  'Student accepts offer',
  'Admission Letter appears',
  'Student completes enrollment',
  'Full student dashboard opens',
];

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
    const totalPoints = Object.values(application.subjectPoints).reduce<number>((sum, value) => sum + (Number(value) || 0), 0);
    const missing = requiredSubjects.filter((subject) => !application.subjectPoints[subject]);
    return {
      total: Object.values(application.subjectPoints).filter((value) => Number(value) > 0).length,
      missing,
      totalPoints,
    };
  }, [application]);

  const handleStatusChange = async (status: ApplicationStatus) => {
    if (!application) return;

    if ((status === 'offer_sent' || status === 'approved' || status === 'admitted') && !selectedIntake) {
      toast({
        title: 'Select an intake first',
        description: 'Assign the applicant to an intake before sending an offer or applying a manual admission override.',
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
          description: status === application.status
            ? 'The offer letter was regenerated and the applicant was notified again.'
            : `Status set to ${statusLabels[status]}.`,
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

  const canSendOffer = ['submitted', 'fee_paid', 'under_review', 'needs_info'].includes(application.status);
  const offerAlreadySent = ['offer_sent', 'approved', 'admitted'].includes(application.status);
  const canResendOffer = ['offer_sent', 'approved'].includes(application.status);
  const canManualAdmit = ['offer_sent', 'approved'].includes(application.status);
  const isAdmitted = application.status === 'admitted';
  const verifiedDocumentCount = documents.filter((doc) => doc.status === 'verified').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applicant Review</h1>
          <p className="text-muted-foreground">Use the official admissions flow: review, send offer, student accepts, then admission letter appears.</p>
        </div>
        <Badge variant="secondary">{statusLabels[application.status]}</Badge>
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Official Admissions Flow
          </CardTitle>
          <CardDescription>Do not skip straight to admission unless you are correcting a special case.</CardDescription>
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

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Applicant Details
            </CardTitle>
            <CardDescription>Review personal details, programme choice, and assigned intake.</CardDescription>
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
              <div className="md:col-span-2">
                <p className="mb-2 text-xs text-muted-foreground">Assigned Intake</p>
                <Select value={selectedIntake} onValueChange={setSelectedIntake} disabled={isAdmitted}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select intake before sending offer" />
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
            Intake is required before the Offer Letter can be generated.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Eligibility Summary
            </CardTitle>
            <CardDescription>Quick checks before sending an offer.</CardDescription>
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
            <div className="flex items-center justify-between">
              <span>Verified documents</span>
              <span className="font-semibold">{verifiedDocumentCount}</span>
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
            <FileText className="h-5 w-5 text-primary" />
            Decision & Letters
          </CardTitle>
          <CardDescription>
            The normal decision is Send Offer. Use Resend / Regenerate if the applicant needs the latest copy.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Offer Message</p>
            <Textarea
              className="min-h-24"
              value={offerMessage}
              onChange={(event) => setOfferMessage(event.target.value)}
              placeholder="Optional custom message for the offer letter."
              disabled={isAdmitted}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Custom Offer Letter URL</p>
            <Textarea
              className="min-h-24"
              value={offerLetterUrl}
              onChange={(event) => setOfferLetterUrl(event.target.value)}
              placeholder="Optional. Leave empty to let UnivAI generate the official letter."
              disabled={isAdmitted}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-semibold">Needs Info Message</p>
            <Textarea
              className="min-h-24"
              value={needsInfoMessage}
              onChange={(event) => setNeedsInfoMessage(event.target.value)}
              placeholder="Tell the applicant what documents or corrections are needed."
              disabled={isAdmitted}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          {!offerAlreadySent && (
            <Button variant="outline" onClick={() => handleStatusChange('under_review')}>
              Mark Under Review
            </Button>
          )}
          {!offerAlreadySent && (
            <Button variant="outline" onClick={() => handleStatusChange('needs_info')}>
              Send Needs Info
            </Button>
          )}
          {canSendOffer && (
            <Button onClick={() => handleStatusChange('offer_sent')}>
              Send Offer & Generate Offer Letter
            </Button>
          )}
          {canResendOffer && (
            <Button onClick={() => handleStatusChange(application.status)}>
              Resend / Regenerate Offer Letter
            </Button>
          )}
          {canManualAdmit && (
            <Button variant="secondary" onClick={() => handleStatusChange('admitted')}>
              Manual Override: Mark Admitted
            </Button>
          )}
          {!isAdmitted && (
            <Button variant="destructive" onClick={() => handleStatusChange('rejected')}>
              Reject Application
            </Button>
          )}
          {isAdmitted && (
            <Badge variant="default">Admission letter will be available in the applicant portal.</Badge>
          )}
        </CardFooter>
      </Card>

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
              <p className="mt-1">Next action: request missing uploads before sending an offer.</p>
              {!offerAlreadySent && (
                <Button className="mt-3" size="sm" variant="outline" onClick={() => handleStatusChange('needs_info')}>
                  Send Needs Info
                </Button>
              )}
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
                disabled={isAdmitted}
              />
              {!isAdmitted && (
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
              )}
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
          <CardDescription>Submitted Grade 12 or equivalent results.</CardDescription>
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
          <CardDescription>Capture admissions rationale and follow-ups.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-32"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add notes or rationale for the decision."
          />
        </CardContent>
      </Card>
    </div>
  );
}
