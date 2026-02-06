import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Locked Amount</span>
            <span className="font-semibold">3,200 AFTA</span>
          </div>
          <Progress value={70} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Eligibility</span>
            <Badge variant="outline">Pending Graduation</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
