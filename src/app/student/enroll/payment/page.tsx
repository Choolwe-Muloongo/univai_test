'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { confirmEnrollment, getInvoices, payInvoice } from '@/lib/api';
import type { Invoice } from '@/lib/api/types';

export default function EnrollmentPaymentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Failed to load invoices', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const invoice = invoices[0];

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      if (invoice.status !== 'paid') {
        await payInvoice(invoice.id);
      }
      await confirmEnrollment();
      toast({ title: 'Payment received', description: 'Enrollment activated.' });
      router.push('/student/enroll/success');
    } catch (error: any) {
      toast({
        title: 'Payment failed',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading tuition details...</p>;
  }

  if (!invoice) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Tuition Payment</h1>
        <p className="text-muted-foreground">No invoice is available yet. Contact admissions.</p>
        <Button asChild variant="outline">
          <Link href="/student/enroll">Back to Enrollment</Link>
        </Button>
      </div>
    );
  }

  const statusLabel = invoice.status === 'paid' ? 'Paid' : invoice.status === 'partial' ? 'Partially Paid' : 'Payment Pending';
  const isPaid = invoice.status === 'paid';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tuition Payment</h1>
        <p className="text-muted-foreground">Review your invoice and complete payment to finalize enrollment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Summary</CardTitle>
          <CardDescription>{invoice.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span>Amount Due</span>
            <span className="font-semibold">${invoice.amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Paid Amount</span>
            <span className="font-semibold">${invoice.paidAmount}</span>
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
          <Button onClick={handlePay} disabled={paying}>
            {isPaid ? 'Confirm Enrollment' : paying ? 'Processing...' : 'Pay & Complete'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
