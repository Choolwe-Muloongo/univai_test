import Link from 'next/link';
import { CreditCard, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const methods = [
  { id: 'card-1', type: 'Visa', label: '**** 4242', status: 'Default' },
  { id: 'card-2', type: 'Mastercard', label: '**** 1122', status: 'Backup' },
];

export default function StudentPaymentMethodsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">Manage cards and bank details for tuition payments.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/payments">Back to Billing</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                {method.type}
              </CardTitle>
              <CardDescription>{method.label}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Badge variant="secondary">{method.status}</Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Set Default</Button>
                <Button size="sm" variant="ghost">Remove</Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Add a New Method</CardTitle>
            <CardDescription>Attach a card or bank account for future payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
