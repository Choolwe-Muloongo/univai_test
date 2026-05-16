import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShortCourseLearnersPage() {
  return (
    <ShortCourseShell
      title="Short-course learners"
      description="A focused space for learner lists, progress snapshots, completion status and certificate readiness."
    >
      <Card>
        <CardHeader><CardTitle>Learner management</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page is ready for the learner table: name, course, payment status, progress percentage, final score, certificate status and last activity.
        </CardContent>
      </Card>
    </ShortCourseShell>
  );
}
