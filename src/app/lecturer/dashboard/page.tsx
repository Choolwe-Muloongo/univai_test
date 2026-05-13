'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, UserCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getLecturerDashboard } from '@/lib/api';

type LecturerMetric = {
  key: string;
  label: string;
  value: string | number;
  note?: string | null;
};

type ManagedCourse = {
  id: string | number;
  title: string;
  studentCount: number;
  avgProgress: number;
  intakeName?: string | null;
};

const fallbackMetrics: LecturerMetric[] = [
  { key: 'courses', label: 'Courses Taught', value: 'Unavailable', note: 'Waiting for backend data' },
  { key: 'students', label: 'Total Students', value: 'Unavailable', note: 'Waiting for backend data' },
  { key: 'messages', label: 'Pending Reviews', value: 'Unavailable', note: 'Waiting for backend data' },
];

export default function LecturerDashboardPage() {
  const [metrics, setMetrics] = useState<LecturerMetric[]>(fallbackMetrics);
  const [managedCourses, setManagedCourses] = useState<ManagedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const dashboard = await getLecturerDashboard();

        if (!isMounted) {
          return;
        }

        setMetrics(Array.isArray(dashboard.metrics) ? dashboard.metrics : fallbackMetrics);
        setManagedCourses(Array.isArray(dashboard.managedCourses) ? dashboard.managedCourses : []);
        setError(null);
      } catch (err) {
        console.error('Failed to load lecturer dashboard', err);
        if (isMounted) {
          setMetrics(fallbackMetrics);
          setManagedCourses([]);
          setError('Live lecturer dashboard data is unavailable. Please refresh or check the backend logs.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Lecturer Dashboard</h1>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              {metric.key === 'courses' && <BookOpen className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'students' && <UserCheck className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'messages' && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.note ?? 'Live platform metric'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Management</CardTitle>
          <CardDescription>Select a course to manage its content, view progress, and interact with students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading lecturer dashboard data...</p>
          ) : managedCourses.length > 0 ? (
            managedCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription>
                    {course.studentCount} students enrolled
                    {course.intakeName ? ` - ${course.intakeName}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full">
                    <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                      <span>Average Progress</span>
                      <span>{course.avgProgress}%</span>
                    </div>
                    <Progress value={course.avgProgress} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href={`/lecturer/courses/${course.id}`}>
                      Manage Course <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No assigned courses are available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
