'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, Users, CalendarDays } from 'lucide-react';
import { getLecturerAssignments } from '@/lib/api';
import type { LecturerAssignment } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';

export default function LecturerCoursesPage() {
  const [assignments, setAssignments] = useState<LecturerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAssignments() {
      try {
        const nextAssignments = await getLecturerAssignments();
        if (!isMounted) return;
        setAssignments(nextAssignments);
        setError(null);
      } catch (err) {
        console.error('Failed to load lecturer assignments', err);
        if (isMounted) {
          setAssignments([]);
          setError('Course assignments are unavailable. Please refresh or confirm lecturer access.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAssignments();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
        <p className="text-muted-foreground">
          Manage your assigned courses, intakes, and lesson content.
        </p>
      </div>

      {loading ? <PageLoading message="Loading assigned courses..." /> : null}
      {error ? <PageError message={error} actionHref="/lecturer/dashboard" actionLabel="Back to Dashboard" /> : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{assignment.courseTitle ?? assignment.courseId}</CardTitle>
              <CardDescription>
                {assignment.moduleTitle
                  ? `Module: ${assignment.moduleTitle}${assignment.moduleSemester ? ` - Semester ${assignment.moduleSemester}` : ''}`
                  : assignment.courseDescription ?? 'Assigned intake course.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Teaching role: {assignment.role ?? 'Lead'}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Student roster synced to intake
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {assignment.intakeName ?? 'Intake pending'}
              </div>
              <div className="flex flex-wrap gap-2">
                {assignment.moduleSemester && (
                  <Badge variant="outline">Semester {assignment.moduleSemester}</Badge>
                )}
                {assignment.deliveryMode && (
                  <Badge variant="secondary">{assignment.deliveryMode}</Badge>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/lecturer/courses/${assignment.courseId}`}>Manage Course</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
        {!loading && !error && assignments.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No course assignments yet. Ask an admin to assign you to an intake.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
