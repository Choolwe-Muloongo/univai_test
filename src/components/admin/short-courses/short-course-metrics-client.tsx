'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getShortCourseInsights, type ShortCourseInsights } from '@/lib/api/academic';

type ViewMode = 'enrolments' | 'learners' | 'pricing';

export function ShortCourseMetricsClient({ mode }: { mode: ViewMode }) {
  const [insights, setInsights] = useState<ShortCourseInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getShortCourseInsights()
      .then((data) => {
        if (mounted) setInsights(data);
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load short-course insights.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <PageLoading message="Loading short-course insights..." />;
  if (error) return <PageError message={error} />;
  if (!insights) return <PageError message="Short-course insights are unavailable." />;

  const { summary, courses, enrollments } = insights;
  const launchWarnings = [
    summary.publishedCourses === 0 ? 'No published short courses yet.' : null,
    summary.entryFeesPaid === 0 ? 'No short-course payments have been confirmed yet.' : null,
    summary.certificateReady === 0 ? 'No learners are certificate-ready yet.' : null,
  ].filter(Boolean) as string[];

  if (mode === 'pricing') {
    return (
      <div className="space-y-4">
        <Card className="rounded-3xl border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Launch readiness</CardTitle>
            <CardDescription>What needs attention before short courses are ready for learners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{summary.publishedCourses} published courses · {summary.freeCourses} free courses · {summary.paidCourses} paid courses</p>
            <p>{summary.entryFeesPaid} entry fees paid · {summary.certificateFeesPaid} certificate fees paid · {summary.certificateReady} certificate-ready learners</p>
            {launchWarnings.length ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
                {launchWarnings.map((warning) => <p key={warning}>{warning}</p>)}
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-900">Short-course delivery looks ready for learners.</div>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="Paid courses" value={summary.paidCourses} />
          <Stat title="Free courses" value={summary.freeCourses} />
          <Stat title="Entry value" value={`ZMW ${summary.entryFeeValue.toLocaleString()}`} />
          <Stat title="Certificate value" value={`ZMW ${summary.certificateFeeValue.toLocaleString()}`} />
        </div>
        <Card>
          <CardHeader><CardTitle>Live pricing table</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Course</th><th>Status</th><th>Review</th><th>Entry</th><th>Certificate</th><th>Enrolments</th><th>Paid</th></tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-t">
                    <td className="py-3 font-medium">{course.title}</td>
                    <td>{course.status ?? 'draft'}</td>
                    <td>{course.reviewStatus ?? 'needs_review'}</td>
                    <td>{course.pricingType === 'free' || Number(course.price ?? 0) <= 0 ? 'Free' : `${course.currency || 'ZMW'} ${course.price ?? 0}`}</td>
                    <td>{Number(course.certificateFee ?? 0) <= 0 ? 'Free' : `${course.certificateCurrency || course.currency || 'ZMW'} ${course.certificateFee ?? 0}`}</td>
                    <td>{course.enrollmentCount ?? 0}</td>
                    <td>{course.paidEnrollmentCount ?? 0}</td>
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
        <Card className="rounded-3xl border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Launch readiness</CardTitle>
            <CardDescription>Track whether learners can actually move through the short-course flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{summary.enrollments} total enrolments · {summary.activeEnrollments} active · {summary.completedEnrollments} completed</p>
            <p>{summary.certificateReady} certificate-ready learners · {summary.entryFeesPaid} entry fees paid</p>
            {launchWarnings.length ? <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-900">{launchWarnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-900">Learner flow is active and measurable.</div>}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Stat title="Learners" value={summary.enrollments} />
          <Stat title="Active" value={summary.activeEnrollments} />
          <Stat title="Completed" value={summary.completedEnrollments} />
          <Stat title="Certificate ready" value={summary.certificateReady} />
        </div>
        <Card>
          <CardHeader><CardTitle>Live learner progress</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Learner</th><th>Email</th><th>Course</th><th>Status</th><th>Progress</th><th>Exam</th><th>Certificate</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {enrollments.length ? enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-t">
                    <td className="py-3 font-medium">{enrollment.studentName}</td>
                    <td>{enrollment.studentEmail ?? '-'}</td>
                    <td>{enrollment.courseTitle}</td>
                    <td>{enrollment.status}</td>
                    <td>{enrollment.progress}%</td>
                    <td>{enrollment.examScore ?? '-'}</td>
                    <td>{enrollment.certificateIssuedAt ? 'Issued' : enrollment.certificateFeePaid ? 'Paid' : 'Pending'}</td>
                    <td>{enrollment.updatedAt ? new Date(enrollment.updatedAt).toLocaleDateString() : '-'}</td>
                  </tr>
                )) : (
                  <tr><td className="py-6 text-muted-foreground" colSpan={8}>No short-course learners yet.</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-3xl border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Launch readiness</CardTitle>
          <CardDescription>Watch the short-course payment funnel while enrolments grow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{summary.enrollments} enrolments · {summary.entryFeesPaid} entry fees paid · {summary.certificateFeesPaid} certificate fees paid</p>
          <p>{summary.publishedCourses} published courses · {summary.draftCourses} drafts</p>
          {launchWarnings.length ? <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-amber-900">{launchWarnings.map((warning) => <p key={warning}>{warning}</p>)}</div> : <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-900">Enrolment and payment flow is active.</div>}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat title="Enrolments" value={summary.enrollments} />
        <Stat title="Entry fees paid" value={summary.entryFeesPaid} />
        <Stat title="Certificate fees paid" value={summary.certificateFeesPaid} />
        <Stat title="Completed" value={summary.completedEnrollments} />
      </div>
      <Card>
        <CardHeader><CardTitle>Live enrolment table</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2">Course</th><th>Learner</th><th>Status</th><th>Entry fee</th><th>Progress</th><th>Exam</th><th>Certificate fee</th><th>Completed</th></tr>
            </thead>
            <tbody>
              {enrollments.length ? enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-t">
                  <td className="py-3 font-medium">{enrollment.courseTitle}</td>
                  <td>{enrollment.studentName}</td>
                  <td>{enrollment.status}</td>
                  <td>{enrollment.entryFeePaid ? 'Paid' : 'Pending'}</td>
                  <td>{enrollment.progress}%</td>
                  <td>{enrollment.examScore ?? '-'}</td>
                  <td>{enrollment.certificateFeePaid ? 'Paid' : 'Pending'}</td>
                  <td>{enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : '-'}</td>
                </tr>
              )) : (
                <tr><td className="py-6 text-muted-foreground" colSpan={8}>No enrolments yet. Enrolments will appear here as soon as learners join short courses.</td></tr>
              )}
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
