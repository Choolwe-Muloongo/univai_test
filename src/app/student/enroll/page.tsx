'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEnrollment, getInvoices } from '@/lib/api';
import type { EnrollmentData, Invoice } from '@/lib/api/types';
import { useSession } from '@/components/providers/session-provider';

type Step = {
  title: string;
  status: 'Completed' | 'Pending' | 'Locked';
};

export default function EnrollmentPage() {
  const { session } = useSession();
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [enrollmentData, invoiceData] = await Promise.all([
          getEnrollment(),
          getInvoices(),
        ]);
        setEnrollment(enrollmentData);
        setInvoices(invoiceData);
      } catch (error) {
        console.error('Failed to load enrollment data', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const steps = useMemo<Step[]>(() => {
    const profileComplete = Boolean(session?.user?.email);
    const modulesSelected = (enrollment?.selectedModules?.length ?? 0) > 0;
    const paymentComplete = invoices.some((invoice) => invoice.status === 'paid');
    const enrollmentConfirmed = enrollment?.status === 'active' || Boolean(enrollment?.confirmedAt);

    return [
      { title: 'Confirm Profile', status: profileComplete ? 'Completed' : 'Pending' },
      { title: 'Select Semester Modules', status: modulesSelected ? 'Completed' : profileComplete ? 'Pending' : 'Locked' },
      { title: 'Tuition Payment', status: paymentComplete ? 'Completed' : modulesSelected ? 'Pending' : 'Locked' },
      { title: 'Enrollment Confirmation', status: enrollmentConfirmed ? 'Completed' : paymentComplete ? 'Pending' : 'Locked' },
    ];
  }, [session, enrollment, invoices]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading enrollment checklist...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enrollment</h1>
        <p className="text-muted-foreground">Complete your enrollment to activate your student account.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enrollment Checklist</CardTitle>
            <CardDescription>Finish all steps to unlock your program dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step) => (
              <div key={step.title} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">Required for activation</p>
                </div>
                <Badge variant={step.status === 'Completed' ? 'default' : 'secondary'}>{step.status}</Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter className="gap-3">
            <Button asChild>
              <Link href="/student/enroll/modules">Select Modules</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/enroll/payment">Proceed to Payment</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
            <CardDescription>Need help with enrollment?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Contact admissions or open a support ticket.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/student/support">Open Support</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
