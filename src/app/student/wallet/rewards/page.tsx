import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCashbackLedger } from '@/lib/api';

const statusCopy = {
  locked: 'Created after an eligible payment and held until earning rules are met.',
  earned: 'Earned by the student and waiting for approval or payout.',
  approved: 'Approved by finance and ready for payout processing.',
  paid: 'Paid out to the configured wallet.',
  cancelled: 'Cancelled by finance or an eligibility reversal.',
  expired: 'Expired before the reward could be paid.',
};

const sourceLabels: Record<string, string> = {
  premium_subscription: 'Premium subscription',
  programme_tuition: 'Programme tuition',
  alumni_campaign: 'Alumni campaign',
  finance_promotion: 'Finance-approved promotion',
};

export default async function WalletRewardsPage() {
  const cashbackLedger = await getCashbackLedger();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cashback Ledger</h1>
        <p className="text-muted-foreground">
          Cashback is limited to premium subscriptions, programme tuition payments, alumni campaigns, and finance-approved promotions.
        </p>
      </div>

      {!cashbackLedger.eligible ? (
        <Card>
          <CardHeader>
            <CardTitle>Cashback unavailable</CardTitle>
            <CardDescription>Free students are excluded from cashback rewards.</CardDescription>
          </CardHeader>
          <CardContent className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {cashbackLedger.message ?? 'Upgrade to an eligible premium plan or programme before cashback can be created.'}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(statusCopy).map(([status, description]) => (
              <Card key={status}>
                <CardHeader>
                  <CardDescription className="capitalize">{status}</CardDescription>
                  <CardTitle>{cashbackLedger.summary[status as keyof typeof cashbackLedger.summary] ?? '0.00'} AFTA</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ledger Entries</CardTitle>
              <CardDescription>Every cashback entry keeps one of the locked, earned, approved, paid, cancelled, or expired states.</CardDescription>
            </CardHeader>
            <CardContent>
              {cashbackLedger.entries.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  No cashback has been created yet. Eligible completed payments will appear here as locked cashback.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reward</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashbackLedger.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <p className="font-medium">{entry.description ?? `Cashback #${entry.id}`}</p>
                          <p className="text-sm text-muted-foreground">{entry.invoiceTitle ?? `Payment #${entry.paymentId ?? entry.id}`}</p>
                        </TableCell>
                        <TableCell>{sourceLabels[entry.source] ?? entry.source}</TableCell>
                        <TableCell>
                          <Badge variant={entry.status === 'paid' ? 'secondary' : 'outline'} className="capitalize">
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {entry.amount} {entry.currency}
                        </TableCell>
                        <TableCell>{entry.expiresAt ?? 'No expiry'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
