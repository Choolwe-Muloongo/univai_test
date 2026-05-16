import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShortCourseEnrolmentsPage() {
  return (
    <ShortCourseShell
      title="Short-course enrolments"
      description="Track paid/free enrolments, course access, certificate eligibility and learner movement for short courses."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle>Total enrolments</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Connect this card to short-course progress/enrolment records.</CardContent></Card>
        <Card><CardHeader><CardTitle>Paid access</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Show learners who paid entry fees and unlocked courses.</CardContent></Card>
        <Card><CardHeader><CardTitle>Certificate ready</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Show learners who completed requirements and can request certificates.</CardContent></Card>
      </div>
    </ShortCourseShell>
  );
}
