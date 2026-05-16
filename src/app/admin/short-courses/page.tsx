import { ShortCourseShell } from '@/components/admin/short-courses/short-course-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminShortCoursesPage() {
  return (
    <ShortCourseShell
      title="Short course command centre"
      description="Track short-course launch readiness, move quickly to the builder, and keep the money-making short-course area clean and focused."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>1. Build</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Use the AI Builder to generate SoloLearn-style course cards or create lessons manually.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>2. Review</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Send drafts for academic review, approve them, then publish reviewed content.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>3. Sell</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Manage pricing, certificate fees, enrolments, and learner traction.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>4. Improve</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Use feedback and completion data to improve lessons before scaling.</CardContent>
        </Card>
      </div>
    </ShortCourseShell>
  );
}
