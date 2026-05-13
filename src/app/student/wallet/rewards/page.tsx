import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function WalletRewardsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reward Lock</h1>
        <p className="text-muted-foreground">Your graduation reward status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locked Reward</CardTitle>
          <CardDescription>Released after graduation clearance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Reward balances will appear once graduation clearance is approved.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
