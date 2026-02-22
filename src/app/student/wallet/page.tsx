import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPayments } from '@/lib/api';

export default async function WalletPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
        <p className="text-muted-foreground">
          View your AFTACOIN balance and transaction history.
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
            <Link href="/student/wallet/rewards">Rewards</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/wallet/payouts">Payouts</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="text-4xl">Pending</CardTitle>
            <p className="text-sm text-muted-foreground">
              Rewards and payouts will appear once your program reaches graduation clearance.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/student/payments">Deposit</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/wallet/payouts">Withdraw</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Card>
            <CardHeader>
              <CardTitle>Recent Billing Activity</CardTitle>
              <CardDescription>Latest invoices and payments.</CardDescription>
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
                      <TableHead>Type</TableHead>
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
