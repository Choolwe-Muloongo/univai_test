import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const transactions = [
  { id: 'tx-01', label: 'Tuition Payment', amount: '-2,500 AFTA', date: 'Feb 1, 2026', status: 'Completed' },
  { id: 'tx-02', label: 'Reward Lock', amount: '+1,000 AFTA', date: 'Jan 28, 2026', status: 'Locked' },
  { id: 'tx-03', label: 'Library Fee', amount: '-25 AFTA', date: 'Jan 20, 2026', status: 'Completed' },
];

export default function WalletTransactionsPage() {
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
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{tx.label}</p>
                <p className="text-sm text-muted-foreground">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{tx.amount}</p>
                <Badge variant={tx.status === 'Locked' ? 'outline' : 'secondary'}>{tx.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
