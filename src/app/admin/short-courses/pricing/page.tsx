import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShortCoursePricingPage() {
  return (
    <ShortCourseShell
      title="Short-course pricing"
      description="Manage entry fees, certificate fees, free launch courses and pricing rules for short courses."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Entry fee</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Review and adjust the price learners pay to access each short course.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Certificate fee</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Review optional certificate charges and certificate release rules.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Launch courses</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Mark selected courses as free or low-cost during launch testing.</CardContent>
        </Card>
      </div>
    </ShortCourseShell>
  );
}
