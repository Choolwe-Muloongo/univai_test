'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEnrollment, getInvoices } from '@/lib/api';
import { buildApiUrl } from '@/lib/api/client';
import type { EnrollmentData, Invoice } from '@/lib/api/types';
import { useSession } from '@/components/providers/session-provider';

type Step = {
  title: string;
  status: 'Completed' | 'Pending' | 'Locked';
  description: string;
};

async function getFinancialClearance() {
  const response = await fetch(buildApiUrl('/students/me/financial-clearance'), { credentials: 'include' });
  if (!response.ok) return null;
  return response.json();
}

export default function EnrollmentPage() {
  const { session } = useSession();
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [enrollmentData, invoiceData, financeData] = await Promise.all([
          getEnrollment(),
          getInvoices(),
          getFinancialClearance(),
        ]);
        setEnrollment(enrollmentData);
        setInvoices(invoiceData);
        setFinance(financeData);
      } catch (error) {
        console.error('Failed to load enrollment data', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formalInvoices = invoices.filter((invoice) => ['registration_deposit', 'registration_fee', 'tuition_fee', 'admission_fee'].includes(invoice.type));

  const steps = useMemo<Step[]>(() => {
    const profileComplete = Boolean(session?.user?.email);
    const modulesSelected = (enrollment?.selectedModules?.length ?? 0) > 0;
    const registrationCleared = Boolean(finance?.registrationClearance?.cleared);
    const enrollmentConfirmed = enrollment?.status === 'active' || Boolean(enrollment?.confirmedAt);

    return [
      { title: 'Confirm Profile', status: profileComplete ? 'Completed' : 'Pending', description: 'Your applicant account must have a valid email and profile.' },
      { title: 'Select Semester Modules', status: modulesSelected ? 'Completed' : profileComplete ? 'Pending' : 'Locked', description: 'Choose the modules you will take in this academic period.' },
      { title: 'Minimum Registration Deposit', status: registrationCleared ? 'Completed' : modulesSelected ? 'Pending' : 'Locked', description: finance?.registrationClearance?.message ?? 'Pay the minimum required deposit for this programme/intake.' },
      { title: 'Enrollment Confirmation', status: enrollmentConfirmed ? 'Completed' : registrationCleared ? 'Pending' : 'Locked', description: 'Enrollment activates after finance clearance is confirmed.' },
    ];
  }, [session, enrollment, finance]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading enrollment checklist...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enrollment</h1>
        <p className="text-muted-foreground">Complete your enrollment to activate your student account.</p>
      </div>

      {finance ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Financial Clearance</CardTitle>
            <CardDescription>Deposit unlocks registration. Full clearance controls results and progression later.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-4">
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Required deposit</p><p className="font-semibold">{finance.currency} {finance.requiredRegistrationDeposit}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Paid</p><p className="font-semibold">{finance.currency} {finance.totalPaid}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Balance</p><p className="font-semibold">{finance.currency} {finance.balance}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Status</p><Badge>{finance.status?.replace(/_/g, ' ')}</Badge></div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Enrollment Checklist</CardTitle>
            <CardDescription>Finish all steps to unlock your programme dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <Badge variant={step.status === 'Completed' ? 'default' : step.status === 'Locked' ? 'outline' : 'secondary'}>{step.status}</Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter className="gap-3">
            <Button asChild>
              <Link href="/student/enroll/modules">Select Modules</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/enroll/payment">Pay Deposit</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formal invoices</CardTitle>
            <CardDescription>Only programme-related invoices count toward enrollment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {formalInvoices.length === 0 ? <p className="text-sm text-muted-foreground">No formal programme invoice is available yet.</p> : null}
            {formalInvoices.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{invoice.title}</p>
                <p className="text-muted-foreground">{invoice.currency} {invoice.paidAmount} / {invoice.amount}</p>
                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>{invoice.status}</Badge>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild>
              <Link href="/student/support">Need help?</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
