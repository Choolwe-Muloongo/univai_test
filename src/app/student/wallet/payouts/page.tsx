'use client';
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
import { useEffect, useState } from 'react';
import { getWalletSettings, updateWalletSettings } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function WalletPayoutsPage() {
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState('');
  const [payoutCurrency, setPayoutCurrency] = useState('AFTA');
  const [status, setStatus] = useState('not_set');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getWalletSettings();
      if (data?.walletAddress) {
        setWalletAddress(data.walletAddress);
        setPayoutCurrency(data.payoutCurrency ?? 'AFTA');
        setStatus(data.status ?? 'pending');
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!walletAddress.trim()) return;
    setSaving(true);
    try {
      const updated = await updateWalletSettings({
        walletAddress: walletAddress.trim(),
        payoutCurrency: payoutCurrency.trim() || 'AFTA',
      });
      setStatus(updated.status ?? 'pending');
      toast({ title: 'Payout settings saved' });
    } catch (error: any) {
      toast({
        title: 'Failed to save',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
            <p className="font-semibold">{walletAddress ? 'Wallet linked' : 'Wallet not linked'}</p>
            <p className="text-sm text-muted-foreground">
              {walletAddress ? 'Pending verification by finance.' : 'Add payout details to receive rewards.'}
            </p>
          </div>
          <Badge variant="outline">{status}</Badge>
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
            <Input placeholder="0x..." value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Preferred Currency</Label>
            <Input placeholder="AFTA / USD" value={payoutCurrency} onChange={(event) => setPayoutCurrency(event.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={saving || !walletAddress.trim()}>
            Save Settings
          </Button>
          <p className="text-xs text-muted-foreground">
            Payout settings will unlock after graduation clearance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

