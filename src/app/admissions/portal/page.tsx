'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  acceptAdmissionOffer,
  getAdmissionApplication,
  getAdmissionDocuments,
  logout,
  payAdmissionFee,
  uploadAdmissionDocument,
} from '@/lib/api';
import { useSession } from '@/components/providers/session-provider';
import type { ApplicationDetail, ApplicationDocument } from '@/lib/api/types';
import { AlertCircle, CheckCircle2, FileText, ShieldCheck, Wallet } from 'lucide-react';

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  fee_paid: 'Fee Paid',
  under_review: 'Under Review',
  needs_info: 'Needs Info',
  offer_sent: 'Offer Sent',
  approved: 'Offer Sent',
  admitted: 'Admitted',
  rejected: 'Rejected',
};

export default function AdmissionsPortalPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { session, refresh } = useSession();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [docType, setDocType] = useState('national_id');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [app, docs] = await Promise.all([getAdmissionApplication(), getAdmissionDocuments()]);
    setApplication(app);
    setDocuments(docs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadAdmissionDocument(docType, file);
      await loadData();
      toast({ title: 'Document uploaded', description: 'Your file has been submitted.' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your admissions portal...</p>;
  }

  if (!application) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No application found</CardTitle>
          <CardDescription>Start your application to access the admissions portal.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href="/register">Start Application</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const statusLabel = statusLabels[application.status] ?? application.status;
  const feePaid = Boolean(application.admissionFeePaid);
  const offerReady = ['offer_sent', 'approved'].includes(application.status);
  const needsInfo = application.status === 'needs_info';
  const reviewInProgress = ['under_review', 'needs_info', 'offer_sent', 'approved', 'admitted'].includes(application.status);

  const steps = [
    {
      id: 'application',
      label: 'Application',
      status: application.submittedAt ? 'complete' : 'current',
    },
    {
      id: 'fee',
      label: 'Admission Fee',
      status: feePaid ? 'complete' : application.submittedAt ? 'current' : 'pending',
    },
    {
      id: 'documents',
      label: 'Documents',
      status: documents.length > 0 ? 'complete' : 'current',
    },
    {
      id: 'review',
      label: 'Review',
      status: reviewInProgress ? 'current' : 'pending',
    },
    {
      id: 'offer',
      label: 'Offer',
      status: offerReady || application.status === 'admitted' ? 'complete' : 'pending',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">UnivAI Admissions</p>
          <h1 className="text-3xl font-bold tracking-tight">Applicant Portal</h1>
          <p className="text-muted-foreground">Track your application and submit documents.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{statusLabel}</Badge>
          {session?.user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                await refresh();
                router.push('/login');
              }}
            >
              Log out
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Go to Login</Link>
            </Button>
          )}
          <Button size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admissions Progress</CardTitle>
          <CardDescription>Follow the steps below to complete your admission.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {steps.map((step) => (
              <Button
                key={step.id}
                asChild
                variant={step.status === 'complete' ? 'default' : step.status === 'current' ? 'secondary' : 'outline'}
                size="sm"
              >
                <Link href={`#${step.id}`}>{step.label}</Link>
              </Button>
            ))}
            {needsInfo && (
              <Badge variant="destructive" className="ml-auto">
                Action required
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card id="application">
          <CardHeader>
            <CardTitle className="text-sm">Application</CardTitle>
            <CardDescription>Submission received</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{application.submittedAt ? 'Submitted' : 'Draft'}</span>
          </CardContent>
        </Card>
        <Card id="fee">
          <CardHeader>
            <CardTitle className="text-sm">Admission Fee</CardTitle>
            <CardDescription>Processing fee</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span>{feePaid ? 'Paid' : 'Pending'}</span>
          </CardContent>
          {!feePaid && (
            <CardFooter>
              <Button
                variant="outline"
                onClick={async () => {
                  await payAdmissionFee(application.id);
                  await loadData();
                }}
              >
                Pay Admission Fee
              </Button>
            </CardFooter>
          )}
        </Card>
        <Card id="review">
          <CardHeader>
            <CardTitle className="text-sm">Review</CardTitle>
            <CardDescription>Eligibility check</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-sm">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <span>{reviewInProgress ? 'In progress' : 'Queued'}</span>
          </CardContent>
        </Card>
      </div>

      <Card id="documents">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>Submit or replace required documentation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsInfo && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {application.needsInfoMessage ?? 'Admissions needs additional documents. Please upload the requested files.'}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-[200px_1fr]">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="certified_results">Certified Results</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Upload File</Label>
              <Input
                type="file"
                onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
                disabled={uploading}
              />
            </div>
          </div>
          <div className="space-y-2">
            {documents.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
            )}
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">{doc.documentType.replace(/-/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                </div>
                <Badge variant={doc.status === 'verified' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'outline'}>
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {offerReady && (
        <Card id="offer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Offer Letter
            </CardTitle>
            <CardDescription>Your offer is ready for acceptance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{application.offerLetterMessage ?? 'Your offer is ready. Please confirm to continue to enrollment.'}</p>
            {application.offerLetterUrl && (
              <Link href={application.offerLetterUrl} className="text-primary underline">
                View Offer Letter
              </Link>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                await acceptAdmissionOffer();
                await loadData();
              }}
            >
              Accept Offer
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/enroll">Go to Enrollment</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      {application.status === 'admitted' && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <AlertCircle className="h-5 w-5" />
              Enrollment Required
            </CardTitle>
            <CardDescription>Complete enrollment to activate your student dashboard.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/student/enroll">Complete Enrollment</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
