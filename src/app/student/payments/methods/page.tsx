'use client';
import Link from 'next/link';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { addPaymentMethod, deletePaymentMethod, getPaymentMethods, setDefaultPaymentMethod } from '@/lib/api';
import type { PaymentMethod } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

export default function StudentPaymentMethodsPage() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [type, setType] = useState('card');
  const [provider, setProvider] = useState('');
  const [last4, setLast4] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMethods = async () => {
    const data = await getPaymentMethods();
    setMethods(data);
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const handleAdd = async () => {
    if (!provider.trim() || last4.trim().length !== 4) return;
    setSaving(true);
    try {
      const method = await addPaymentMethod({
        type,
        provider: provider.trim(),
        last4: last4.trim(),
        expiryMonth: expiryMonth ? Number(expiryMonth) : undefined,
        expiryYear: expiryYear ? Number(expiryYear) : undefined,
        isDefault: methods.length === 0,
      });
      setMethods((prev) => [method, ...prev]);
      setProvider('');
      setLast4('');
      setExpiryMonth('');
      setExpiryYear('');
      toast({ title: 'Payment method added' });
    } catch (error: any) {
      toast({
        title: 'Failed to add method',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Methods
            </CardTitle>
            <CardDescription>Saved payment methods will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {methods.length === 0 ? (
              <p>No payment methods saved yet.</p>
            ) : (
              <div className="space-y-3">
                {methods.map((method) => (
                  <div key={method.id} className="rounded-lg border p-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold capitalize">{method.provider}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.type.toUpperCase()} •••• {method.last4} {method.isDefault ? '(Default)' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDefaultPaymentMethod(method.id, true).then(loadMethods)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePaymentMethod(method.id).then(loadMethods)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Add a New Method</CardTitle>
            <CardDescription>Attach a card or bank account for future payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provider</Label>
                <Input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="e.g., Visa" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label>Last 4</Label>
                  <Input value={last4} onChange={(event) => setLast4(event.target.value)} maxLength={4} />
                </div>
                <div className="col-span-1">
                  <Label>Exp. Month</Label>
                  <Input value={expiryMonth} onChange={(event) => setExpiryMonth(event.target.value)} />
                </div>
                <div className="col-span-1">
                  <Label>Exp. Year</Label>
                  <Input value={expiryYear} onChange={(event) => setExpiryYear(event.target.value)} />
                </div>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={saving || !provider.trim() || last4.trim().length !== 4}>
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

