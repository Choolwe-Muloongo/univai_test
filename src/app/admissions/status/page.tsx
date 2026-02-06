'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Clock, FileText, ShieldCheck, Wallet } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { getAdmissionStatus } from '@/lib/api';

type StatusStep = {
  title: string;
  description: string;
  icon: React.ReactNode;
  state: 'done' | 'current' | 'locked';
};

export default function AdmissionStatusPage() {
  const [feePaid, setFeePaid] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState('submitted');

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const status = await getAdmissionStatus();
        setFeePaid(status.admissionFeePaid);
        setApplicationStatus(status.status || 'submitted');
      } catch (error) {
        console.error('Failed to load admission status', error);
      }
    };
    loadStatus();
  }, []);

  const steps: StatusStep[] = [
    {
      title: 'Application Submitted',
      description: 'Your documents and subject points have been received.',
      icon: <FileText className="h-4 w-4" />,
      state: 'done',
    },
    {
      title: 'Admission Fee',
      description: feePaid ? 'Payment received.' : 'Pay the admission fee to continue.',
      icon: <Wallet className="h-4 w-4" />,
      state: feePaid ? 'done' : 'current',
    },
    {
      title: 'Academic Review',
      description: 'Registrar verifies eligibility and subject requirements.',
      icon: <ShieldCheck className="h-4 w-4" />,
      state: feePaid ? 'current' : 'locked',
    },
    {
      title: 'Offer Letter',
      description: 'Receive your official offer and enrollment instructions.',
      icon: <CheckCircle2 className="h-4 w-4" />,
      state: feePaid ? 'locked' : 'locked',
    },
  ];

  const progressValue = feePaid ? 50 : 25;

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

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Under Review</AlertTitle>
          <AlertDescription>
            Your application is being reviewed by the admissions team. You will receive an update once the review is complete.
          </AlertDescription>
        </Alert>

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
              {!feePaid && (
                <Button asChild>
                  <Link href="/admissions/fee">Pay Admission Fee</Link>
                </Button>
              )}
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
