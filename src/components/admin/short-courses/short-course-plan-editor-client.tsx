'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getAdminShortCoursePlans, updateAdminShortCoursePlan, type AdminShortCoursePlan } from '@/lib/api/admin-short-course-plans';

export function ShortCoursePlanEditorClient() {
  const [plans, setPlans] = useState<AdminShortCoursePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const data = await getAdminShortCoursePlans();
    setPlans(data);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short-course plans. Run migrations first if this is a new deployment.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  function updateLocal(code: string, patch: Partial<AdminShortCoursePlan>) {
    setPlans((current) => current.map((plan) => plan.code === code ? { ...plan, ...patch } : plan));
  }

  async function save(plan: AdminShortCoursePlan) {
    setSavingCode(plan.code);
    setError(null);
    setMessage(null);
    try {
      const updated = await updateAdminShortCoursePlan(plan.code, plan);
      setPlans(updated);
      setMessage(`${plan.name} updated.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save plan.');
    } finally {
      setSavingCode(null);
    }
  }

  const readiness = useMemo(() => {
    const activeCount = plans.filter((plan) => plan.isActive).length;
    const certificatePlans = plans.filter((plan) => plan.certificateIncluded && plan.isActive).length;
    const visiblePlans = plans.filter((plan) => plan.isActive).map((plan) => plan.name);
    return {
      activeCount,
      certificatePlans,
      visiblePlans,
      allInactive: plans.length > 0 && activeCount === 0,
      missingCertificateCoverage: plans.length > 0 && certificatePlans === 0,
    };
  }, [plans]);

  if (loading) return <PageLoading message="Loading plan editor..." />;

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Monthly access plan editor</CardTitle>
        <CardDescription>Change short-course prices, access length, AI quotas, certificate inclusion and learner visibility.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {error ? <PageError message={error} /> : null}
        {message ? <div className="rounded-xl border bg-muted/40 p-3 text-sm">{message}</div> : null}
        {plans.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Active plans" value={readiness.activeCount} />
            <Metric label="Certificate-inclusive" value={readiness.certificatePlans} />
            <Metric label="Learner-visible" value={readiness.visiblePlans.length} />
          </div>
        ) : null}
        {readiness.allInactive ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">All plans are inactive. Learners will not see access options until at least one plan is active.</div> : null}
        {readiness.missingCertificateCoverage ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">No active plan includes the certificate. Learners may finish the course but still need a separate certificate payment.</div> : null}
        {!plans.length ? <p className="text-sm text-muted-foreground">No editable plans found. Run backend migrations to create the short_course_access_plans table.</p> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.code} className="rounded-2xl border p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {plan.code}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={plan.isActive} onChange={(event) => updateLocal(plan.code, { isActive: event.target.checked })} />
                  Active
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Plan name"><Input value={plan.name} onChange={(event) => updateLocal(plan.code, { name: event.target.value })} /></Field>
                <Field label="Currency"><Input maxLength={3} value={plan.currency} onChange={(event) => updateLocal(plan.code, { currency: event.target.value.toUpperCase() })} /></Field>
                <Field label="Amount"><Input type="number" min={0} value={plan.amount} onChange={(event) => updateLocal(plan.code, { amount: Number(event.target.value) })} /></Field>
                <Field label="Sort order"><Input type="number" min={0} value={plan.sortOrder} onChange={(event) => updateLocal(plan.code, { sortOrder: Number(event.target.value) })} /></Field>
                <Field label="Course access hours">
                  <div className="space-y-1">
                    <Input type="number" min={1} value={plan.accessHours} onChange={(event) => updateLocal(plan.code, { accessHours: Number(event.target.value) })} />
                    <p className="text-xs text-muted-foreground">{Math.max(1, Math.round(plan.accessHours / 24))} days of access</p>
                  </div>
                </Field>
                <Field label="AI access hours">
                  <div className="space-y-1">
                    <Input type="number" min={0} value={plan.aiHours} onChange={(event) => updateLocal(plan.code, { aiHours: Number(event.target.value) })} />
                    <p className="text-xs text-muted-foreground">{plan.aiHours ? `${Math.max(1, Math.round(plan.aiHours / 24))} days of AI access` : 'No AI access on this plan'}</p>
                  </div>
                </Field>
                <Field label="Hourly AI quota"><Input type="number" min={0} value={plan.hourlyAiQuota} onChange={(event) => updateLocal(plan.code, { hourlyAiQuota: Number(event.target.value) })} /></Field>
                <Field label="Daily AI quota"><Input type="number" min={0} value={plan.dailyAiQuota} onChange={(event) => updateLocal(plan.code, { dailyAiQuota: Number(event.target.value) })} /></Field>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={plan.certificateIncluded} onChange={(event) => updateLocal(plan.code, { certificateIncluded: event.target.checked })} />
                Certificate included after passing
              </label>
              <p className="mt-2 text-xs text-muted-foreground">Learner view: {plan.isActive ? 'Visible' : 'Hidden'} · Access ends after {Math.max(1, Math.round(plan.accessHours / 24))} days.</p>

              <Button className="mt-4 w-full" onClick={() => save(plan)} disabled={savingCode === plan.code}>
                {savingCode === plan.code ? 'Saving...' : 'Save plan'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
