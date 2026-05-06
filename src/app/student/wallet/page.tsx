import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, ArrowDownLeft, ArrowUpRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCashbackLedger, getPayments } from '@/lib/api';

const cashbackStatuses = ['locked', 'earned', 'approved', 'paid', 'cancelled', 'expired'] as const;

export default async function WalletPage() {
  const [payments, cashbackLedger] = await Promise.all([getPayments(), getCashbackLedger()]);
  const payableBalance = Number(cashbackLedger.summary.approved ?? 0) + Number(cashbackLedger.summary.earned ?? 0);
  const lockedBalance = Number(cashbackLedger.summary.locked ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
        <p className="text-muted-foreground">
          Track cashback earned from eligible premium activity while free student activity stays excluded.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Shortcuts</CardTitle>
          <CardDescription>Jump to payouts, rewards, and transaction details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/student/wallet/transactions">Transactions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/wallet/rewards">Cashback Ledger</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/wallet/payouts">Payouts</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardDescription>Available Cashback</CardDescription>
            <CardTitle className="text-4xl">{payableBalance.toFixed(2)} AFTA</CardTitle>
            <p className="text-sm text-muted-foreground">
              {cashbackLedger.eligible
                ? `${lockedBalance.toFixed(2)} AFTA remains locked until it is earned or finance-approved.`
                : cashbackLedger.message ?? 'Free students are not eligible for cashback rewards.'}
            </p>
          </div>
          <Wallet className="h-10 w-10 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            {cashbackStatuses.map((status) => (
              <div key={status} className="rounded-lg border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{status}</p>
                <p className="text-lg font-semibold">{cashbackLedger.summary[status] ?? '0.00'} AFTA</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Billing Activity</CardTitle>
              <CardDescription>Payments can create locked cashback only when the student and source are eligible.</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No wallet activity yet. Payments will appear after your first invoice is settled.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Cashback</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">Invoice #{payment.invoiceId}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'completed' ? 'secondary' : 'outline'} className="capitalize">
                            {payment.status === 'completed' ? (
                              <ArrowDownLeft className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="mr-1 h-3 w-3" />
                            )}
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.cashback ? (
                            <Badge variant="outline" className="capitalize">
                              <LockKeyhole className="mr-1 h-3 w-3" />
                              {payment.cashback.amount} {payment.cashback.currency} {payment.cashback.status}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not eligible</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">${payment.amount}</TableCell>
                        <TableCell>{payment.paidAt ?? 'Pending'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
