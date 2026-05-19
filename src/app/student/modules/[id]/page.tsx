'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
import { Progress } from "@/components/ui/progress";
import { getProgram } from "@/lib/api";
import type { Program } from "@/lib/api/types";
import { Calendar, ClipboardCheck, Lightbulb } from "lucide-react";
import { PageError, PageLoading } from "@/components/ui/page-feedback";
import { readRouteParam } from "@/lib/route-params";

export default function ModuleDetailPage() {
  const params = useParams();
  const id = readRouteParam(params, 'id');
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadModule() {
      if (!id) {
        setLoading(false);
        setError('Module route is missing an id.');
        return;
      }

      try {
        const nextProgram = await getProgram();
        if (!isMounted) return;
        setProgram(nextProgram);
        setError(null);
      } catch (err) {
        console.error('Failed to load module detail', err);
        if (isMounted) {
          setProgram(null);
          setError('Module data is unavailable. Please refresh or check that your account has programme access.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadModule();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const module = useMemo(() => {
    return program?.modules.find((item) => item.id === id) ?? null;
  }, [id, program]);
  const lessons = module?.lessons ?? [];
  const nextLesson = lessons[0] ?? null;

  if (loading) {
    return (
      <div className="space-y-8">
        <PageLoading message="Loading module details..." />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="space-y-8">
        <PageError
          message={error ?? 'Module data is unavailable.'}
          actionHref="/student/program/modules"
          actionLabel="Back to Modules"
        />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="space-y-8">
        <PageError
          title="Module not found"
          message="This module is not available in your current programme plan."
          actionHref="/student/program/modules"
          actionLabel="Back to Modules"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
        <p className="text-muted-foreground">{module.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Module Progress</CardTitle>
            <CardDescription>Track your mastery and next actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Completion</span>
              <span className="text-muted-foreground">{module.progress}%</span>
            </div>
            <Progress value={module.progress} className="h-3" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Semester {module.semester}</p>
                </div>
                <p className="text-sm text-muted-foreground">Weekly pacing active</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  <p className="font-semibold">Assessments</p>
                </div>
                <p className="text-sm text-muted-foreground">Assessments will appear once published.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button asChild>
              <Link href="/student/assignments">View Assignments</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/student/ai">Ask AI Tutor</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Module Status</CardTitle>
            <CardDescription>Keep your workload on track.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Availability</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Exam</span>
              <Badge variant={module.isExamAvailable ? "secondary" : "outline"}>
                {module.isExamAvailable ? "Available" : "Locked"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credit weight</span>
              <span className="text-sm font-semibold">{module.credits ?? 0} credits</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/student/program">Back to Program</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
          <CardDescription>What you will achieve in this module.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Outcomes will appear once the lecturer publishes the official module plan.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>Resume learning from where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lessons.slice(0, 3).map((lesson, index) => (
              <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{lesson.summary || lesson.content}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/lessons/${lesson.id}`}>Open</Link>
                </Button>
              </div>
            ))}
            {lessons.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                Lessons for this module will appear here once published.
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href={nextLesson ? `/student/lessons/${nextLesson.id}` : '/student/lessons'}>
                Continue Lesson
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Protected module materials for in-platform study.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Resources will appear once the lecturer uploads module materials.
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" className="w-full" asChild>
              <Link href={nextLesson ? `/student/ai/lesson-companion/${nextLesson.id}` : '/student/ai'}>
                <Lightbulb className="mr-2 h-4 w-4" />
                AI Lesson Companion
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
