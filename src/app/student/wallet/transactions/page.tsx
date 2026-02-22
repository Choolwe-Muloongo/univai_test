import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPayments } from '@/lib/api';

export default async function WalletTransactionsPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">All wallet activity and ledger history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Latest wallet movements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payments.length === 0 ? (
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
