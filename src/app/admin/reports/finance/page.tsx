import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const revenueRows = [
  { label: 'Tuition Collected', amount: '$48,200', status: 'On track' },
  { label: 'Outstanding Invoices', amount: '$6,150', status: 'Attention' },
  { label: 'Scholarship Grants', amount: '$3,500', status: 'Approved' },
];

export default function FinanceReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Reports</h1>
          <p className="text-muted-foreground">Monitor tuition collection and outstanding balances.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/reports">Back to Reports</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
          <CardDescription>Key financial indicators for the current term.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueRows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'Attention' ? 'destructive' : 'secondary'}>
                      {row.status}
                    </Badge>
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
