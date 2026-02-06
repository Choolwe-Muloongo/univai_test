import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WalletPayoutsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payout Settings</h1>
        <p className="text-muted-foreground">Configure your reward payout method.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Payout Status</CardTitle>
          <CardDescription>Updates after graduation approval.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Wallet not linked</p>
            <p className="text-sm text-muted-foreground">Add payout details to receive rewards.</p>
          </div>
          <Badge variant="outline">Not Set</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Use your preferred payout method.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Wallet Address</Label>
            <Input placeholder="0x..." />
          </div>
          <div className="space-y-2">
            <Label>Preferred Currency</Label>
            <Input placeholder="AFTA / USD" />
          </div>
          <Button>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
