'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getApplicationById, updateApplicationStatus } from '@/lib/api';
import type { ApplicationDetail, ApplicationStatus } from '@/lib/api/types';
import { ClipboardCheck, Mail, ShieldCheck, User, AlertTriangle } from 'lucide-react';

const requiredSubjects = ['english-language', 'mathematics'];

const statusLabels: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  fee_paid: 'Fee Paid',
  under_review: 'Under Review',
  needs_info: 'Needs Info',
  approved: 'Approved',
  rejected: 'Rejected',
  admitted: 'Admitted',
};

export default function AdmissionDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplication = async () => {
      setLoading(true);
      const data = await getApplicationById(id as string);
      setApplication(data);
      setNotes(data?.notes || '');
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
    const updated = await updateApplicationStatus(application.id, status, notes);
    if (updated) {
      setApplication(updated);
      toast({
        title: 'Application updated',
        description: `Status set to ${statusLabels[status]}.`,
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
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button onClick={() => handleStatusChange('under_review')} variant="outline">
              Mark Under Review
            </Button>
            <Button onClick={() => handleStatusChange('needs_info')} variant="outline">
              Request Info
            </Button>
            <Button onClick={() => handleStatusChange('approved')}>Approve</Button>
            <Button onClick={() => handleStatusChange('rejected')} variant="destructive">
              Reject
            </Button>
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
