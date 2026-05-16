'use client';

import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getCourses } from '@/lib/api';
import type { Course } from '@/lib/api/types';

type ViewMode = 'enrolments' | 'learners' | 'pricing';

export function ShortCourseMetricsClient({ mode }: { mode: ViewMode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getCourses()
      .then((data) => {
        if (mounted) setCourses(data);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short-course data.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const published = courses.filter((course) => course.status === 'published').length;
    const drafts = courses.length - published;
    const free = courses.filter((course) => course.pricingType === 'free' || Number(course.price ?? 0) <= 0).length;
    const paid = courses.length - free;
    const totalEntryValue = courses.reduce((sum, course) => sum + Number(course.price ?? 0), 0);
    const totalCertificateValue = courses.reduce((sum, course) => sum + Number(course.certificateFee ?? 0), 0);
    return { published, drafts, free, paid, totalEntryValue, totalCertificateValue };
  }, [courses]);

  if (loading) return <PageLoading message="Loading short-course data..." />;
  if (error) return <PageError message={error} />;

  if (mode === 'pricing') {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="Paid courses" value={stats.paid} />
          <Stat title="Free courses" value={stats.free} />
          <Stat title="Entry value" value={`ZMW ${stats.totalEntryValue.toLocaleString()}`} />
          <Stat title="Certificate value" value={`ZMW ${stats.totalCertificateValue.toLocaleString()}`} />
        </div>
        <Card>
          <CardHeader><CardTitle>Pricing table</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Course</th><th>Status</th><th>Entry</th><th>Certificate</th><th>Level</th><th>Hours</th></tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-t">
                    <td className="py-3 font-medium">{course.title}</td>
                    <td>{course.status ?? 'draft'}</td>
                    <td>{course.pricingType === 'free' || Number(course.price ?? 0) <= 0 ? 'Free' : `${course.currency || 'ZMW'} ${course.price ?? 0}`}</td>
                    <td>{Number(course.certificateFee ?? 0) <= 0 ? 'Free' : `${course.certificateCurrency || course.currency || 'ZMW'} ${course.certificateFee ?? 0}`}</td>
                    <td>{course.level ?? 'beginner'}</td>
                    <td>{course.durationHours ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'learners') {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="Published courses" value={stats.published} />
          <Stat title="Draft courses" value={stats.drafts} />
          <Stat title="Course catalogue" value={courses.length} />
          <Stat title="Learner table" value="Ready" />
        </div>
        <Card>
          <CardHeader><CardTitle>Learner progress readiness</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Course</th><th>Status</th><th>Lessons</th><th>Progress source</th><th>Certificate source</th></tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-t">
                    <td className="py-3 font-medium">{course.title}</td>
                    <td>{course.status ?? 'draft'}</td>
                    <td>{course.lessonCount ?? 0}</td>
                    <td>short_course_lesson_progress</td>
                    <td>short_course_enrollments</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat title="Published" value={stats.published} />
        <Stat title="Drafts" value={stats.drafts} />
        <Stat title="Free courses" value={stats.free} />
        <Stat title="Paid courses" value={stats.paid} />
      </div>
      <Card>
        <CardHeader><CardTitle>Enrolment readiness</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2">Course</th><th>Status</th><th>Access rule</th><th>Progress</th><th>Exam</th><th>Certificate</th></tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-t">
                  <td className="py-3 font-medium">{course.title}</td>
                  <td>{course.status ?? 'draft'}</td>
                  <td>{course.pricingType === 'free' || Number(course.price ?? 0) <= 0 ? 'Auto unlock' : 'Entry fee required'}</td>
                  <td>Tracked</td>
                  <td>{(course as any).examQuestionCount >= 25 ? 'Enabled' : 'Needs questions'}</td>
                  <td>{Number(course.certificateFee ?? 0) <= 0 ? 'Free after completion' : 'Fee after completion'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent className="text-2xl font-bold">{value}</CardContent>
    </Card>
  );
}
