import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getProgram } from '@/lib/api';

export default async function ExamsPage() {
  const program = await getProgram();
  const modules = program.modules ?? [];
  const semesters = Array.from(new Set(modules.map((module) => module.semester))).sort((a, b) => a - b);

  const semesterExams = semesters.map((semester) => {
    const semesterModules = modules.filter((module) => module.semester === semester);
    const totalProgress = semesterModules.reduce((sum, module) => sum + (module.progress ?? 0), 0);
    const avgProgress = semesterModules.length ? totalProgress / semesterModules.length : 0;
    return {
      id: `semester-${semester}`,
      title: `Semester ${semester} Exam`,
      status: avgProgress >= 70 ? 'Eligible' : 'In Progress',
      href: `/student/program/semester/${semester}/exam`,
      note: semesterModules.length ? `${semesterModules.length} modules` : 'TBD',
    };
  });

  const courseExams = modules.map((module) => ({
    id: module.id,
    title: `${module.title} Exam`,
    status: (module.progress ?? 0) >= 70 ? 'Eligible' : 'Locked',
    href: `/student/courses/${module.id}/exam`,
    note: `Semester ${module.semester}`,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
        <p className="text-muted-foreground">Check eligibility and schedule your exams.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/student/exams/bookings">Exam Bookings</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/student/exams/history">Exam History</Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Semester Exams</CardTitle>
            <CardDescription>Complete your semester assessments before graduation clearance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {semesterExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">Semester exams will appear once your program is published.</p>
            ) : (
              semesterExams.map((exam) => (
                <Link key={exam.id} href={exam.href}>
                  <Card className="transition-all hover:border-primary/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.note}</CardDescription>
                      </div>
                      <Badge variant={exam.status === 'Eligible' ? 'default' : 'secondary'}>{exam.status}</Badge>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">Review requirements and start when ready.</CardContent>
                  </Card>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Exams</CardTitle>
            <CardDescription>Module-based exams unlock as you progress through lessons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {courseExams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No course exams available yet.</p>
            ) : (
              courseExams.map((exam) => (
                <Link key={exam.id} href={exam.href}>
                  <Card className="transition-all hover:border-primary/60">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>{exam.title}</CardTitle>
                        <CardDescription>{exam.note}</CardDescription>
                      </div>
                      <Badge variant={exam.status === 'Eligible' ? 'default' : 'secondary'}>{exam.status}</Badge>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">Open for details.</CardContent>
                  </Card>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
