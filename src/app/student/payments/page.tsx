// src/app/(app)/payments/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Check, Star, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/components/providers/session-provider';
import Link from 'next/link';
import { getInvoices } from '@/lib/api';
import type { Invoice } from '@/lib/api/types';

const freemiumFeatures = [
  { text: 'Access to introductory modules of all courses', included: true },
  { text: 'Read-only access to community discussions', included: true },
  { text: 'AI Tutor and Study Planner', included: false },
  { text: 'Verified Certificate upon completion', included: false },
  { text: 'Full access to Career & Job Hub', included: false },
  { text: 'Ability to post in community and message peers', included: false },
];

const premiumFeatures = [
  { text: 'Unlimited access to all course content', included: true },
  { text: 'Full access to AI Tutor and Study Planner', included: true },
  { text: 'Verified Certificate upon completion', included: true },
  { text: 'Full community access (posting, messaging)', included: true },
  { text: 'Full access to Career & Job Hub', included: true },
  { text: 'Eligible for AFTACOIN rewards', included: true },
];

export default function PaymentsPage() {
  const router = useRouter();
  const { session } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAllTotals, setShowAllTotals] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    setUserRole(session?.user?.role ?? null);
  }, [session]);

  useEffect(() => {
    const loadInvoices = async () => {
      const data = await getInvoices();
      setInvoices(data);
    };
    loadInvoices();
  }, []);

  const feeTotals = useMemo(() => {
    const toNumber = (value: string) => Number.parseFloat(value || '0') || 0;
    const schoolMatch = /tuition|school fee|school fees/i;
    const schoolTotal = invoices
      .filter((invoice) => schoolMatch.test(invoice.title))
      .reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
    const otherTotal = invoices
      .filter((invoice) => !schoolMatch.test(invoice.title))
      .reduce((sum, invoice) => sum + toNumber(invoice.amount), 0);
    const format = (value: number) => `$${value.toFixed(2)}`;
    const base = [
      { label: 'School Fees Total', amount: format(schoolTotal), note: 'Tuition and core modules' },
      { label: 'Other Fees Total', amount: format(otherTotal), note: 'Labs, exams, and services' },
    ];
    const detailed = invoices.map((invoice) => ({
      label: invoice.title,
      amount: format(toNumber(invoice.amount)),
      note: invoice.status,
    }));
    return showAllTotals ? [...base, ...detailed] : base;
  }, [invoices, showAllTotals]);


  const handleUpgrade = () => {
    router.push('/student/checkout');
  };

  const isFreemium = userRole === 'freemium-student';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Start your learning journey with a plan that fits your needs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Billing Shortcuts</CardTitle>
            <CardDescription>Quick access to invoices, payment methods, and aid.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" asChild>
              <Link href="/student/payments/invoices">Invoices</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/payments/history">Payment History</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/payments/methods">Payment Methods</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/payments/aid">Scholarships & Aid</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Fee Totals</CardTitle>
            <CardDescription>Track what is included in your overall costs.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => setShowAllTotals((prev) => !prev)}>
            {showAllTotals ? 'View Less' : 'View More'}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {(showAllTotals ? feeTotals : feeTotals.slice(0, 2)).map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-lg font-bold">{item.amount}</p>
              </div>
              <p className="text-xs text-muted-foreground">{item.note}</p>
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No invoices found yet. Once billing is generated, totals will appear here.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Freemium Plan */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Freemium</CardTitle>
            <CardDescription>Get a taste of our platform with limited access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-4xl font-bold">Free</p>
            <ul className="space-y-3">
              {freemiumFeatures.map((feature, index) => (
                <li key={index} className={`flex items-center gap-3 ${!feature.included && 'text-muted-foreground'}`}>
                  {feature.included ? <Check className="h-5 w-5 text-green-500" /> : <X className="h-5 w-5" />}
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" size="lg" disabled={!isFreemium}>
              You are on this Plan
            </Button>
          </CardFooter>
        </Card>

        {/* Premium Plan */}
        <Card className="border-2 border-primary shadow-lg shadow-primary/20 relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                <Star className='w-4 h-4'/>
                Best Value
            </div>
          <CardHeader>
            <CardTitle className="text-2xl">Premium</CardTitle>
            <CardDescription>Unlock your full potential with complete access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
                <span className="text-4xl font-bold">$250</span>
                <span className="text-muted-foreground"> / year</span>
            </div>
             <ul className="space-y-3">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-primary">
                <Star className="h-5 w-5 flex-shrink-0" />
                <p><span className='font-semibold'>Earn a Reward:</span> 40% of your fee ($100) will be rewarded to your wallet as AFTACOIN upon program completion.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={handleUpgrade} disabled={!isFreemium}>
              Upgrade to Premium
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
