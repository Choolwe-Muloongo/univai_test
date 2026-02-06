'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { payAdmissionFee } from '@/lib/api';

export default function AdmissionFeePage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [referenceId, setReferenceId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!referenceId.trim()) {
      setError('Please enter a valid transaction reference.');
      return;
    }

    setLoading(true);
    payAdmissionFee(referenceId)
      .then(() => router.push('/admissions/status'))
      .catch((err) => {
        console.error('Payment error', err);
        setError('Unable to verify payment. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">UnivAI Admissions</p>
            <h1 className="text-2xl font-semibold">Admission Fee Payment</h1>
          </div>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Required to Continue</AlertTitle>
          <AlertDescription>
            The admission fee confirms your application and unlocks academic review. Payment details are verified by the registrar.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Upload proof of payment or enter your transaction ID.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePayment}>
            <CardContent className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Payment Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="payerName">Payer Full Name</Label>
                <Input
                  id="payerName"
                  value={payerName}
                  onChange={(event) => setPayerName(event.target.value)}
                  placeholder="Enter payer name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Deposit</SelectItem>
                    <SelectItem value="mobile">Mobile Money</SelectItem>
                    <SelectItem value="card">Card / Online Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referenceId">Transaction Reference</Label>
                  <Input
                    id="referenceId"
                    value={referenceId}
                    onChange={(event) => setReferenceId(event.target.value)}
                    placeholder="Enter reference ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receipt">Upload Payment Receipt</Label>
                  <Input id="receipt" type="file" />
                </div>
              </div>

              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Admission Fee Summary
                </div>
                <div className="mt-2 space-y-1">
                  <p>Amount: ZMW 250 (local currency)</p>
                  <p>Verified by registrar before offer letter is issued.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Confirm Payment'}
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Receipts are reviewed within 1-2 business days.</span>
              </div>
              <Button variant="outline" asChild>
                <Link href="/admissions/status">Back to Status</Link>
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
