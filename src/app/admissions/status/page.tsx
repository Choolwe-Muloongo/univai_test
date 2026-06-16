'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Clock, FileText, ShieldCheck, Wallet } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { getAdmissionStatus } from '@/lib/api';

type StatusStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  state: 'done' | 'current' | 'locked';
};

const statusCopy: Record<string, { title: string; description: string; tone: 'default' | 'warning' | 'success' | 'danger' }> = {
  draft: { title: 'Application not submitted', description: 'Start or complete your formal programme application.', tone: 'warning' },
  submitted: { title: 'Application submitted', description: 'Pay the application fee so admissions can review your file.', tone: 'default' },
  fee_paid: { title: 'Fee received', description: 'Your application is ready for academic review.', tone: 'success' },
  under_review: { title: 'Under academic review', description: 'Admissions is reviewing your eligibility and documents.', tone: 'default' },
  needs_info: { title: 'Action required', description: 'Admissions needs more information or corrected documents.', tone: 'warning' },
  offer_sent: { title: 'Offer letter ready', description: 'Open your applicant portal to view and accept your offer.', tone: 'success' },
  approved: { title: 'Offer letter ready', description: 'Open your applicant portal to view and accept your offer.', tone: 'success' },
  admitted: { title: 'Admitted', description: 'Your admission letter is ready. Complete enrollment to activate the student dashboard.', tone: 'success' },
  rejected: { title: 'Application rejected', description: 'Open your applicant portal for details or contact admissions support.', tone: 'danger' },
};

export default function AdmissionStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setStatus(await getAdmissionStatus());
      } catch (error: any) {
        setLoadError(error?.details?.message || error?.message || 'Failed to load admission status.');
      } finally {
        setLoading(false);
      }
    };
    loadStatus();
  }, []);

  const applicationStatus = status?.status || 'draft';
  const feePaid = Boolean(status?.admissionFeePaid || status?.invoice?.status === 'paid');
  const offerReady = ['offer_sent', 'approved', 'admitted'].includes(applicationStatus);
  const admitted = applicationStatus === 'admitted';
  const needsInfo = applicationStatus === 'needs_info';
  const rejected = applicationStatus === 'rejected';
  const copy = statusCopy[applicationStatus] ?? statusCopy.submitted;

  const steps: StatusStep[] = useMemo(() => [
    {
      title: 'Application Submitted',
      description: 'Your formal application and initial documents were received.',
      icon: <FileText className="h-4 w-4" />,
      state: applicationStatus === 'draft' ? 'current' : 'done',
    },
    {
      title: 'Application Fee',
      description: feePaid ? 'Payment received.' : 'Pay the application fee to unlock admissions review.',
      icon: <Wallet className="h-4 w-4" />,
      state: feePaid ? 'done' : applicationStatus === 'draft' ? 'locked' : 'current',
    },
    {
      title: 'Academic Review',
      description: needsInfo ? 'Admissions needs more information.' : 'Registrar verifies eligibility and documents.',
      icon: <ShieldCheck className="h-4 w-4" />,
      state: ['under_review', 'needs_info'].includes(applicationStatus) ? 'current' : offerReady || admitted ? 'done' : feePaid ? 'current' : 'locked',
    },
    {
      title: 'Offer Letter',
      description: offerReady ? 'Offer sent. Accept it in the applicant portal.' : 'Receive your official offer and instructions.',
      icon: <CheckCircle2 className="h-4 w-4" />,
      state: offerReady && !admitted ? 'current' : admitted ? 'done' : 'locked',
    },
    {
      title: 'Admission & Enrollment',
      description: admitted ? 'Admission letter ready. Continue to enrollment.' : 'Admission letter appears after offer acceptance.',
      icon: <CheckCircle2 className="h-4 w-4" />,
      state: admitted ? 'current' : 'locked',
    },
  ], [applicationStatus, admitted, feePaid, needsInfo, offerReady]);

  const progressValue = admitted ? 100 : offerReady ? 80 : ['under_review', 'needs_info'].includes(applicationStatus) ? 60 : feePaid ? 45 : applicationStatus !== 'draft' ? 25 : 5;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">UnivAI Admissions</p>
            <h1 className="text-2xl font-semibold">Application Status</h1>
          </div>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load status</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : (
          <Alert variant={copy.tone === 'danger' ? 'destructive' : 'default'}>
            {copy.tone === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            <AlertTitle>{loading ? 'Loading admissions status...' : copy.title}</AlertTitle>
            <AlertDescription>{loading ? 'Checking your application file.' : copy.description}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Admission Journey</CardTitle>
            <CardDescription>Track your progress before accessing the student dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span>Progress</span>
                <span>{progressValue}%</span>
              </div>
              <Progress value={progressValue} />
            </div>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.title} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="mt-1 rounded-full border p-2 text-muted-foreground">{step.icon}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{step.title}</p>
                      <Badge variant={step.state === 'done' ? 'default' : 'outline'}>
                        {step.state === 'done' ? 'Complete' : step.state === 'current' ? 'In progress' : 'Locked'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Status: <span className="font-semibold text-foreground">{applicationStatus}</span>
            </div>
            <div className="flex gap-2">
              {!feePaid && !rejected && applicationStatus !== 'draft' ? (
                <Button asChild>
                  <Link href="/admissions/fee">Pay Application Fee</Link>
                </Button>
              ) : null}
              {admitted ? (
                <Button asChild>
                  <Link href="/student/enroll">Complete Enrollment</Link>
                </Button>
              ) : null}
              <Button variant="outline" asChild>
                <Link href="/admissions/portal">Open Applicant Portal</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Return to Login</Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
