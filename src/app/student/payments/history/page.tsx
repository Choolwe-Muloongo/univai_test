import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const invoices = [
  { id: 'inv-101', label: 'Semester 2 Tuition', amount: '$2,500', status: 'Paid' },
  { id: 'inv-102', label: 'Library Fee', amount: '$25', status: 'Paid' },
  { id: 'inv-103', label: 'Lab Materials', amount: '$40', status: 'Pending' },
];

export default function PaymentsHistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">Receipts and payment records.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Latest billing activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{invoice.label}</p>
                <p className="text-sm text-muted-foreground">{invoice.id}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{invoice.amount}</p>
                <Badge variant={invoice.status === 'Paid' ? 'secondary' : 'outline'}>
                  {invoice.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
