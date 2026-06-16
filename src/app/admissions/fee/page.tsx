'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { getAdmissionStatus, payAdmissionFee } from '@/lib/api';

export default function AdmissionFeePage() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    getAdmissionStatus()
      .then(setStatus)
      .catch(() => setError('Unable to load your admissions fee status. Please sign in again.'))
      .finally(() => setLoading(false));
  }, []);

  const invoice = status?.invoice;
  const feePaid = Boolean(status?.admissionFeePaid || invoice?.status === 'paid');
  const amount = invoice ? `${invoice.currency ?? 'ZMW'} ${invoice.amount}` : 'Application fee invoice';

  const handlePayment = async () => {
    setError(null);
    setPaying(true);
    try {
      const response: any = await payAdmissionFee(status?.id ?? 'application_fee');
      if (response?.checkoutUrl || response?.checkout_url) {
        window.location.href = response.checkoutUrl ?? response.checkout_url;
        return;
      }
      const updated = await getAdmissionStatus();
      setStatus(updated);
      router.push('/admissions/status');
    } catch (err: any) {
      setError(err?.details?.message || err?.message || 'Unable to start or confirm the application fee payment.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-semibold text-primary">UnivAI Admissions</p>
            <h1 className="text-2xl font-semibold">Application Fee</h1>
          </div>
        </div>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Required before academic review</AlertTitle>
          <AlertDescription>
            This fee confirms your application and moves your file into admissions review. The amount should match the programme fee configured by admin.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Fee Summary</CardTitle>
            <CardDescription>Pay your application fee, then return to your status page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Payment Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading fee status...
              </div>
            ) : (
              <div className="rounded-lg border p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Application Fee
                  </div>
                  <Badge variant={feePaid ? 'default' : 'secondary'}>{feePaid ? 'Paid' : 'Pending'}</Badge>
                </div>
                <div className="mt-4 grid gap-2 text-muted-foreground sm:grid-cols-2">
                  <p>Amount: <span className="font-semibold text-foreground">{amount}</span></p>
                  <p>Status: <span className="font-semibold text-foreground">{invoice?.status ?? status?.status ?? 'pending'}</span></p>
                  {invoice?.dueDate ? <p>Due date: <span className="font-semibold text-foreground">{invoice.dueDate}</span></p> : null}
                  {invoice?.paidAt ? <p>Paid at: <span className="font-semibold text-foreground">{invoice.paidAt}</span></p> : null}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={handlePayment} disabled={loading || paying || feePaid}>
              {paying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : feePaid ? 'Fee Paid' : 'Pay Application Fee'}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>Your status updates after payment is confirmed.</span>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admissions/status">Back to Status</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
