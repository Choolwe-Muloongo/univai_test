'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CircleAlert, Download, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getFinanceReport } from '@/lib/api';
import type { FinanceReportRow } from '@/lib/api/types';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function FinanceReportsPage() {
  const [rows, setRows] = useState<FinanceReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFinanceReport() {
      try {
        const nextRows = await getFinanceReport();
        if (!isMounted) return;
        setRows(nextRows);
        setError(null);
      } catch (err) {
        console.error('Failed to load finance report', err);
        if (isMounted) {
          setRows([]);
          setError('Finance report data is unavailable. Please refresh or run diagnostics.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFinanceReport();

    return () => {
      isMounted = false;
    };
  }, []);

  const hasRows = rows.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finance Reports</h1>
          <p className="text-muted-foreground">Monitor tuition collection and outstanding balances.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/reports">Back to Reports</Link>
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? <PageLoading message="Loading finance report..." /> : null}
      {error ? <PageError message={error} actionHref="/admin/system-health" actionLabel="Run Diagnostics" /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Revenue Summary
          </CardTitle>
          <CardDescription>Freshness: updated from finance feed when backend data is available.</CardDescription>
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
              {hasRows ? (
                rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell>${row.amount}</TableCell>
                    <TableCell>
                      <Badge variant={row.status.toLowerCase().includes('overdue') ? 'destructive' : 'secondary'}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-6">
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">Finance feed returned no rows</p>
                      <p className="mt-1">Next action: verify billing ingestion, then rerun diagnostics.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/admin/system-health">Run diagnostics</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/admin/admissions">Review enrollment-to-invoice flow</Link>
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-destructive" />
            Finance Follow-up Actions
          </CardTitle>
          <CardDescription>Use these when collection risk increases.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/reports/enrollment">Check admissions to enrollment conversion</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/intakes">Review intake capacity and payment plans</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/audit">Inspect finance-related audit logs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
