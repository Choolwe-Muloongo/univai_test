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
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function WalletTransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPayments() {
      try {
        const nextPayments = await getPayments();
        if (!isMounted) return;
        setPayments(nextPayments);
        setError(null);
      } catch (err) {
        console.error('Failed to load wallet transactions', err);
        if (isMounted) {
          setPayments([]);
          setError('Wallet transactions are unavailable. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">All wallet activity and ledger history.</p>
      </div>

      {loading ? <PageLoading message="Loading wallet transactions..." /> : null}
      {error ? <PageError message={error} actionHref="/student/wallet" actionLabel="Back to Wallet" /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Latest wallet movements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!loading && !error && payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions yet. Completed payments will appear here.
            </p>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">Invoice #{payment.invoiceId}</p>
                  <p className="text-sm text-muted-foreground">{payment.paidAt ?? 'Pending'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${payment.amount}</p>
                  <Badge variant={payment.status === 'completed' ? 'secondary' : 'outline'}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
