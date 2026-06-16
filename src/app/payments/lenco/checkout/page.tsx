'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { CreditCard, Loader2, ShieldCheck, Smartphone, Sparkles, WalletCards } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyInvoicePayment } from '@/lib/api/payments';

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

type PayMode = 'mobile-money' | 'card';

function LencoCheckoutFallback() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.14),_transparent_35%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.45))] px-4 py-8">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center">
        <Card className="w-full rounded-3xl border-primary/20 shadow-xl">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <CardTitle>Opening UnivAI Pay</CardTitle>
              <CardDescription>Preparing your secure payment session.</CardDescription>
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
  const [mode, setMode] = useState<PayMode>('mobile-money');

  const checkout = useMemo(() => {
    const invoice = Number(searchParams.get('invoice') || 0);
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
  const canPay = Boolean(publicKey && scriptReady && checkout.reference && checkout.amount > 0 && checkout.email && checkout.invoice > 0);

  async function verifyAndReturn() {
    if (checkout.invoice <= 0) {
      setMessage('Invalid invoice. Please return and start checkout again.');
      return;
    }

    setBusy(true);
    const result = await verifyInvoicePayment(checkout.invoice);
    setMessage(result.message ?? 'Payment status checked.');

    if (String(result.status ?? '').toLowerCase() === 'paid') {
      window.location.href = checkout.returnUrl;
      return;
    }

    setBusy(false);
  }

  function startPayment(selectedMode: PayMode = mode) {
    if (!canPay || !window.LencoPay) {
      setMessage('UnivAI Pay is not ready yet. Check the public key and try again.');
      return;
    }

    setBusy(true);
    setMessage(null);
    setMode(selectedMode);

    window.LencoPay.getPaid({
      key: publicKey,
      reference: checkout.reference,
      email: checkout.email,
      amount: checkout.amount,
      currency: checkout.currency,
      label: checkout.label,
      bearer: 'merchant',
      channels: selectedMode === 'mobile-money' ? ['mobile-money'] : ['card'],
      customer: {
        firstName: firstName || 'UnivAI',
        lastName: lastName || 'Learner',
      },
      onSuccess: async () => {
        try {
          await verifyAndReturn();
        } catch (error) {
          setBusy(false);
          setMessage(error instanceof Error ? error.message : 'Payment was completed, but verification is still pending. Tap Check payment status.');
        }
      },
      onClose: () => {
        setBusy(false);
        setMessage('Payment window closed. If money was deducted, tap Check payment status before trying again.');
      },
      onConfirmationPending: () => {
        setBusy(false);
        setMessage('Your mobile money payment is pending confirmation. If money was deducted, tap Check payment status after a few seconds.');
      },
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.16),_transparent_36%),linear-gradient(180deg,_hsl(var(--background)),_hsl(var(--muted)/0.55))] px-4 py-6 sm:py-10">
      <Script src={lencoScript} onLoad={() => setScriptReady(true)} onError={() => setMessage('The secure payment script could not be loaded.')} />

      <div className="mx-auto grid min-h-[78vh] w-full max-w-5xl items-center gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-5 text-center lg:text-left">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm lg:mx-0">
            <Sparkles className="h-4 w-4" /> UnivAI Pay
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Complete your payment securely.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Pay with mobile money or card. UnivAI verifies the payment before unlocking access.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border bg-background/80 p-4 shadow-sm">
              <Smartphone className="mx-auto h-6 w-6 text-primary lg:mx-0" />
              <p className="mt-2 font-semibold">Mobile money ready</p>
              <p className="mt-1 text-xs text-muted-foreground">Best for quick Zambian payments.</p>
            </div>
            <div className="rounded-3xl border bg-background/80 p-4 shadow-sm">
              <CreditCard className="mx-auto h-6 w-6 text-primary lg:mx-0" />
              <p className="mt-2 font-semibold">Card checkout</p>
              <p className="mt-1 text-xs text-muted-foreground">Secure Lenco card flow.</p>
            </div>
            <div className="rounded-3xl border bg-background/80 p-4 shadow-sm">
              <ShieldCheck className="mx-auto h-6 w-6 text-primary lg:mx-0" />
              <p className="mt-2 font-semibold">Manual status check</p>
              <p className="mt-1 text-xs text-muted-foreground">If money was deducted, check status here.</p>
            </div>
          </div>
        </section>

        <Card className="w-full rounded-[2rem] border-primary/20 bg-background/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <WalletCards className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-2xl">UnivAI Checkout</CardTitle>
              <CardDescription>Choose how you want to complete this payment.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-muted/30 p-1">
              <button type="button" onClick={() => setMode('mobile-money')} className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${mode === 'mobile-money' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}>Mobile Money</button>
              <button type="button" onClick={() => setMode('card')} className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${mode === 'card' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}>Card</button>
            </div>

            <div className="rounded-3xl border bg-muted/20 p-4 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Reference</span><span className="break-all text-right font-medium">{checkout.reference || 'Missing'}</span></div>
              <div className="mt-3 flex justify-between gap-4"><span className="text-muted-foreground">Amount</span><span className="font-bold">{checkout.currency} {checkout.amount.toFixed(2)}</span></div>
              <div className="mt-3 flex justify-between gap-4"><span className="text-muted-foreground">Email</span><span className="break-all text-right font-medium">{checkout.email || 'Missing'}</span></div>
              <div className="mt-3 flex justify-between gap-4"><span className="text-muted-foreground">Method</span><span className="font-medium">{mode === 'mobile-money' ? 'Mobile Money' : 'Card'}</span></div>
            </div>

            <p className="rounded-2xl border bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
              Before paying, review the <Link href="/payment-rules" className="font-semibold text-primary hover:underline">Payment Rules</Link>, <Link href="/terms" className="font-semibold text-primary hover:underline">Terms</Link>, and <Link href="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
            </p>

            {!publicKey ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Lenco public key is not configured. Set NEXT_PUBLIC_LENCO_PUBLIC_KEY before enabling live collections.</div> : null}
            {message ? <div className="rounded-2xl border bg-background p-3 text-sm">{message}</div> : null}

            <Button onClick={() => startPayment(mode)} disabled={!canPay || busy} className="h-12 w-full rounded-2xl text-base">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mode === 'mobile-money' ? <Smartphone className="mr-2 h-4 w-4" /> : <CreditCard className="mr-2 h-4 w-4" />}
              {busy ? 'Checking payment...' : mode === 'mobile-money' ? 'Pay with Mobile Money' : 'Pay with Card'}
            </Button>

            <Button type="button" variant="outline" onClick={() => void verifyAndReturn()} disabled={busy || checkout.invoice <= 0} className="h-11 w-full rounded-2xl">
              {busy ? 'Checking...' : 'Check payment status'}
            </Button>

            <Button asChild variant="ghost" className="h-11 w-full rounded-2xl">
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
