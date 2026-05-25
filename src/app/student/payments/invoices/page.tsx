'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getInvoices, payInvoice, verifyInvoicePayment } from '@/lib/api';
import type { Invoice } from '@/lib/api/types';

export default function StudentInvoicesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading invoices...</p>}>
      <StudentInvoicesPageInner />
    </Suspense>
  );
}

function StudentInvoicesPageInner() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const invoiceId = Number(searchParams.get('invoice') || 0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (paymentStatus === 'success' && invoiceId > 0) {
        const verification = await verifyInvoicePayment(invoiceId).catch(() => null);
        setNotice(verification?.message ?? 'Payment is being confirmed. Refresh if the invoice still shows pending.');
      }
      const data = await getInvoices();
      setInvoices(data);
      setLoading(false);
    };
    load();
  }, [paymentStatus, invoiceId]);

  const handlePay = async (invoiceId: number) => {
    setPayingId(invoiceId);
    const payment = await payInvoice(invoiceId);
    const url = payment.checkout_url ?? payment.checkoutUrl;
    if (url) {
      window.location.href = url;
      return;
    }
    const data = await getInvoices();
    setInvoices(data);
    setPayingId(null);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading invoices...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Review tuition invoices and payment status.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/payments">Back to Billing</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tuition Invoices</CardTitle>
          <CardDescription>Keep track of what is due and what has been paid.</CardDescription>
        </CardHeader>
        <CardContent>
          {notice ? <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">INV-{invoice.id}</TableCell>
                  <TableCell>{invoice.title}</TableCell>
                  <TableCell>{invoice.currency ?? 'ZMW'} {invoice.amount}</TableCell>
                  <TableCell>{invoice.dueDate ?? '---'}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'paid' ? 'secondary' : 'default'}>
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.status === 'paid' ? (
                      <Button variant="outline" size="sm">Download</Button>
                    ) : (
                      <Button size="sm" onClick={() => handlePay(invoice.id)} disabled={payingId === invoice.id}>
                        {payingId === invoice.id ? 'Paying...' : 'Pay Now'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No invoices available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
