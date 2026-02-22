'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getInvoices, payInvoice } from '@/lib/api';
import type { Invoice } from '@/lib/api/types';

export default function StudentInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(data);
      setLoading(false);
    };
    load();
  }, []);

  const handlePay = async (invoiceId: number) => {
    setPayingId(invoiceId);
    const updated = await payInvoice(invoiceId);
    setInvoices((prev) => prev.map((invoice) => (invoice.id === updated.id ? updated : invoice)));
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
                  <TableCell>${invoice.amount}</TableCell>
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
