'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { confirmEnrollment, getInvoices, payInvoice } from '@/lib/api';
import { buildApiUrl } from '@/lib/api/client';
import type { Invoice } from '@/lib/api/types';

async function getFinancialClearance() {
  const response = await fetch(buildApiUrl('/students/me/financial-clearance'), { credentials: 'include' });
  if (!response.ok) return null;
  return response.json();
}

export default function EnrollmentPaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [invoiceData, financeData] = await Promise.all([getInvoices(), getFinancialClearance()]);
      setInvoices(invoiceData);
      setFinance(financeData);
    } catch (error) {
      console.error('Failed to load invoices', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const formalInvoices = useMemo(
    () => invoices.filter((invoice) => ['registration_deposit', 'registration_fee', 'tuition_fee', 'admission_fee'].includes(invoice.type)),
    [invoices]
  );

  const invoice = formalInvoices.find((item) => item.status !== 'paid') ?? formalInvoices[0];
  const registrationCleared = Boolean(finance?.registrationClearance?.cleared);

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      if (invoice.status !== 'paid') {
        const payment: any = await payInvoice(Number(invoice.id));
        if (payment?.checkout_url || payment?.checkoutUrl) {
          window.location.href = payment.checkout_url ?? payment.checkoutUrl;
          return;
        }
      }
      await load();
      const updatedFinance = await getFinancialClearance();
      setFinance(updatedFinance);
      if (updatedFinance?.registrationClearance?.cleared) {
        await confirmEnrollment();
        toast({ title: 'Enrollment activated', description: 'Your minimum registration deposit has been cleared.' });
        router.push('/student/enroll/success');
        return;
      }
      toast({ title: 'Payment recorded', description: updatedFinance?.registrationClearance?.message ?? 'More payment may be required before enrollment can activate.' });
    } catch (error: any) {
      toast({
        title: 'Payment failed',
        description: error?.details?.message || error?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading formal programme payment details...</p>;
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Registration Deposit</h1>
        <p className="text-muted-foreground">No formal programme invoice is available yet. Contact admissions.</p>
        <Button asChild variant="outline">
          <Link href="/student/enroll">Back to Enrollment</Link>
        </Button>
      </div>
    );
  }

  const statusLabel = invoice.status === 'paid' ? 'Paid' : invoice.status === 'partial' ? 'Partially Paid' : 'Payment Pending';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registration Deposit</h1>
        <p className="text-muted-foreground">Pay the required deposit to activate enrollment. Full balance is still required later for results and progression.</p>
      </div>

      {finance ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Clearance Requirement</CardTitle>
            <CardDescription>{finance.registrationClearance?.message}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-4">
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Required deposit</p><p className="font-semibold">{finance.currency} {finance.requiredRegistrationDeposit}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Paid</p><p className="font-semibold">{finance.currency} {finance.totalPaid}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Balance</p><p className="font-semibold">{finance.currency} {finance.balance}</p></div>
            <div className="rounded-lg border p-3"><p className="text-muted-foreground">Registration</p><Badge>{registrationCleared ? 'Cleared' : 'Pending'}</Badge></div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
          <CardDescription>{invoice.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Invoice amount</span>
            <span className="font-semibold">{invoice.currency} {invoice.amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Paid amount</span>
            <span className="font-semibold">{invoice.currency} {invoice.paidAmount}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span>Status</span>
            <span className="text-lg font-bold">{statusLabel}</span>
          </div>
          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>{statusLabel}</Badge>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/enroll/modules">Back</Link>
          </Button>
          <Button onClick={handlePay} disabled={paying || registrationCleared}>
            {registrationCleared ? 'Deposit Cleared' : paying ? 'Processing...' : 'Pay / Confirm Deposit'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
