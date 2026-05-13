'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, GraduationCap, Wallet } from "lucide-react";
import { getStudentGrades } from "@/lib/api";
import type { StudentGradesResponse } from "@/lib/api/types";
import { PageError, PageLoading } from "@/components/ui/page-feedback";

export default function GraduationPage() {
  const [grades, setGrades] = useState<StudentGradesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadGrades() {
      try {
        const nextGrades = await getStudentGrades();
        if (!isMounted) return;
        setGrades(nextGrades);
        setError(null);
      } catch (err) {
        console.error('Failed to load graduation data', err);
        if (isMounted) {
          setGrades(null);
          setError('Graduation data is unavailable. Please refresh or check that your account has programme access.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadGrades();

    return () => {
      isMounted = false;
    };
  }, []);

  const steps = useMemo(() => [
    {
      title: "Clearance Checklist",
      description: "Complete academic, financial, and conduct checks.",
      href: "/student/graduation/checklist",
      icon: ClipboardCheck,
    },
    {
      title: "Graduation Status",
      description: "Track approval from registrar and faculty.",
      href: "/student/graduation/status",
      icon: GraduationCap,
    },
    {
      title: "Reward Release",
      description: "View locked tuition reward and payout options.",
      href: "/student/wallet",
      icon: Wallet,
    },
  ], []);

  const creditsEarned = grades?.creditsEarned ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Graduation</h1>
        <p className="text-muted-foreground">
          Complete your final checks and track reward release.
        </p>
      </div>

      {loading ? <PageLoading message="Loading graduation status..." /> : null}
      {error ? <PageError message={error} actionHref="/student/grades" actionLabel="Review Grades" /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Eligibility
            </CardTitle>
            <CardDescription>Registrar review in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">Pending</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credits Earned
            </CardTitle>
            <CardDescription>Tracked from your grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsEarned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reward Lock
            </CardTitle>
            <CardDescription>Release after graduation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Pending</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>Finish the steps below to graduate on time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {steps.map((step) => (
            <div key={step.title} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <step.icon className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href={step.href}>Open</Link>
              </Button>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/student/grades">Review Final Grades</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
