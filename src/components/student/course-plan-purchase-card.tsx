'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { getShortCourseAccessPlans, purchaseShortCourseAccessPlan, type ShortCourseAccessPlan } from '@/lib/api/short-course-access';
import { paymentUrl, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';
import { formatExpiryDate, isExpiringSoon, planLabel, timeRemainingLabel } from '@/lib/short-course-ui';

type CourseLike = NonNullable<ShortCourseEnrollmentSummary['course']>;

export function CoursePlanPurchaseCard({ item, onNotice, onError }: { item: ShortCourseEnrollmentSummary; onNotice: (message: string) => void; onError: (message: string) => void }) {
  const course = item.course as CourseLike | null;
  const courseId = course?.id ? String(course.id) : '';
  const [plans, setPlans] = useState<ShortCourseAccessPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    let mounted = true;
    setLoadingPlans(true);
    getShortCourseAccessPlans(courseId)
      .then((data) => {
        if (mounted) setPlans(data);
      })
      .catch(() => {
        if (mounted) setPlans([]);
      })
      .finally(() => {
        if (mounted) setLoadingPlans(false);
      });
    return () => {
      mounted = false;
    };
  }, [courseId]);

  async function buyPlan(planCode: string) {
    if (!courseId) return;
    setBuyingPlan(planCode);
    onError('');
    onNotice('');
    try {
      const payment = await purchaseShortCourseAccessPlan(courseId, planCode);
      const url = paymentUrl(payment);
      if (url) {
        window.location.href = url;
        return;
      }
      onNotice('Access plan activated. Refresh this page to see the latest access status.');
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Unable to buy this access plan.');
    } finally {
      setBuyingPlan(null);
    }
  }

  if (!course || !courseId) return null;

  return (
    <>
      <div className="rounded-2xl border bg-muted/20 p-3">
        <p className="font-semibold">Buy / renew this Journey</p>
        <p className="mt-1 text-xs text-muted-foreground">Choose one plan for this specific course without leaving billing.</p>
        <div className="mt-3 space-y-2">
          {loadingPlans ? (
            <div className="rounded-xl border border-dashed bg-background p-3 text-xs text-muted-foreground">Loading single-course plans...</div>
          ) : plans.length ? plans.map((plan) => {
            const active = item.accessPlan === plan.code;
            return (
              <button
                key={plan.code}
                type="button"
                onClick={() => buyPlan(plan.code)}
                disabled={buyingPlan === plan.code}
                className="w-full rounded-2xl border bg-background p-3 text-left transition hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{planLabel(plan.code)}</p>
                    <p className="text-xs text-muted-foreground">{plan.name}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold">{formatMoneyDisplay(plan.amount, plan.currency)}</p>
                    <p className="text-[11px] text-muted-foreground">{active ? 'Current plan' : buyingPlan === plan.code ? 'Working...' : 'Tap to buy'}</p>
                  </div>
                </div>
                <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground">
                  <span>Access: {Math.round(plan.accessHours / 24)} days</span>
                  <span>AI: {plan.aiHours ? `${Math.round(plan.aiHours / 24)} days` : 'Not included'}</span>
                  <span>{plan.certificateIncluded ? 'Certificate included' : 'Certificate separate'}</span>
                </div>
              </button>
            );
          }) : (
            <p className="rounded-xl border border-dashed bg-background p-3 text-xs text-muted-foreground">No single-course plans are available for this Journey yet.</p>
          )}
        </div>
      </div>

      {isExpiringSoon(item.accessExpiresAt) ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          This access is close to expiry. Pick a plan above to renew before the Journey locks.
        </div>
      ) : null}

      <CardFooter className="flex flex-col gap-2 px-0 pb-0 pt-1 sm:flex-row">
        <Button asChild variant="outline" className="w-full"><Link href={`/student/courses/${course.id}`}>Open Mission Control</Link></Button>
      </CardFooter>
    </>
  );
}

export function AccessDetails({ item }: { item: ShortCourseEnrollmentSummary }) {
  return (
    <div className="space-y-3">
      <BillingLine label="Access left" value={timeRemainingLabel(item.accessExpiresAt)} />
      <BillingLine label="Access ends" value={formatExpiryDate(item.accessExpiresAt)} />
      <BillingLine label="AI access" value={item.aiAccessExpiresAt ? `${timeRemainingLabel(item.aiAccessExpiresAt)} · ${formatExpiryDate(item.aiAccessExpiresAt)}` : 'Not included'} />
      <BillingLine label="Certificate" value={item.certificateIncluded ? 'Included' : item.certificateFeePaid ? 'Paid' : 'Separate fee'} />
    </div>
  );
}

function BillingLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border bg-muted/20 p-3">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}

function formatMoneyDisplay(value: number, currency = 'ZMW') {
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
