import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const invoices = [
  { id: 'inv-2026-01', term: 'Semester 1', amount: '$650', status: 'Due', dueDate: 'Feb 20, 2026' },
  { id: 'inv-2025-02', term: 'Semester 2', amount: '$650', status: 'Paid', dueDate: 'Oct 14, 2025' },
  { id: 'inv-2025-01', term: 'Semester 1', amount: '$650', status: 'Paid', dueDate: 'Mar 5, 2025' },
];

export default function StudentInvoicesPage() {
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
                <TableHead>Term</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.term}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === 'Paid' ? 'secondary' : 'default'}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.status === 'Paid' ? (
                      <Button variant="outline" size="sm">Download</Button>
                    ) : (
                      <Button size="sm">Pay Now</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
