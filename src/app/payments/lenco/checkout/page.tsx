'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyInvoicePayment } from '@/lib/api';

declare global {
  interface Window {
    LencoPay?: {
      getPaid: (options: Record<string, unknown>) => void;
    };
  }
}

const publicKey = process.env.NEXT_PUBLIC_LENCO_PUBLIC_KEY || '';
const lencoScript =
  process.env.NEXT_PUBLIC_LENCO_SANDBOX === 'true'
    ? 'https://pay.sandbox.lenco.co/js/v1/inline.js'
    : 'https://pay.lenco.co/js/v1/inline.js';

function LencoCheckoutFallback() {
  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <Card className="w-full">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <CardTitle>Preparing Checkout</CardTitle>
              <CardDescription>Loading your secure Lenco payment details.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    </main>
  );
}

function LencoCheckoutClient() {
  const searchParams = useSearchParams();
  const [scriptReady, setScriptReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const checkout = useMemo(() => {
    const invoice = Number(searchParams.get('invoice'));
    return {
      invoice,
      reference: searchParams.get('reference') || '',
      amount: Number(searchParams.get('amount') || 0),
      currency: searchParams.get('currency') || 'ZMW',
      email: searchParams.get('email') || '',
      name: searchParams.get('name') || 'UnivAI Learner',
      label: searchParams.get('label') || 'UnivAI payment',
      returnUrl: searchParams.get('returnUrl') || '/student/payments/invoices?payment=success',
    };
  }, [searchParams]);

  const [firstName, ...restName] = checkout.name.trim().split(/\s+/).filter(Boolean);
  const lastName = restName.join(' ');
  const canPay = Boolean(
    publicKey &&
      scriptReady &&
      checkout.reference &&
      checkout.amount > 0 &&
      checkout.email &&
      Number.isFinite(checkout.invoice),
  );

  async function verifyAndReturn() {
    const result = await verifyInvoicePayment(checkout.invoice);
    setMessage(result.message ?? 'Payment confirmed.');
    window.location.href = checkout.returnUrl;
  }

  function startPayment() {
    if (!canPay || !window.LencoPay) {
      setMessage('Lenco checkout is not ready. Check the public key and try again.');
      return;
    }

    setBusy(true);
    setMessage(null);

    window.LencoPay.getPaid({
      key: publicKey,
      reference: checkout.reference,
      email: checkout.email,
      amount: checkout.amount,
      currency: checkout.currency,
      label: checkout.label,
      bearer: 'merchant',
      channels: ['card', 'mobile-money'],
      customer: {
        firstName: firstName || 'UnivAI',
        lastName: lastName || 'Learner',
      },
      onSuccess: async () => {
        try {
          await verifyAndReturn();
        } catch (error) {
          setBusy(false);
          setMessage(error instanceof Error ? error.message : 'Payment was completed, but verification is still pending.');
        }
      },
      onClose: () => {
        setBusy(false);
        setMessage('Payment was not completed. You can reopen checkout when ready.');
      },
      onConfirmationPending: () => {
        setBusy(false);
        setMessage('Your payment is pending confirmation. We will activate access once Lenco confirms it.');
      },
    });
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <Script src={lencoScript} onLoad={() => setScriptReady(true)} onError={() => setMessage('Lenco checkout script could not be loaded.')} />

      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <Card className="w-full">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Complete Payment</CardTitle>
              <CardDescription>Pay securely with Lenco. UnivAI verifies the payment on the server before unlocking access.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border bg-background p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium">{checkout.reference || 'Missing'}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{checkout.currency} {checkout.amount.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{checkout.email || 'Missing'}</span>
              </div>
            </div>

            {!publicKey ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Lenco public key is not configured. Set NEXT_PUBLIC_LENCO_PUBLIC_KEY before enabling live collections.
              </div>
            ) : null}

            {message ? <div className="rounded-lg border bg-background p-3 text-sm">{message}</div> : null}

            <Button onClick={startPayment} disabled={!canPay || busy} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {busy ? 'Confirming payment...' : 'Open Lenco Checkout'}
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href={checkout.returnUrl}>Return without payment</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LencoCheckoutPage() {
  return (
    <Suspense fallback={<LencoCheckoutFallback />}>
      <LencoCheckoutClient />
    </Suspense>
  );
}
