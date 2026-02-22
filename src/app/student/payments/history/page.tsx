'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPayments } from '@/lib/api';
import type { Payment } from '@/lib/api/types';

export default function PaymentsHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getPayments();
      setPayments(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading payments...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">Receipts and payment records.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Latest billing activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">Invoice #{payment.invoiceId}</p>
                <p className="text-sm text-muted-foreground">{payment.paidAt ?? '---'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${payment.amount}</p>
                <Badge variant={payment.status === 'completed' ? 'secondary' : 'outline'}>
                  {payment.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
          {payments.length === 0 && (
            <p className="text-sm text-muted-foreground">No payment activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
