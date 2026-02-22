import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, ClipboardList, FileText } from 'lucide-react';
import { getStudentDashboard } from '@/lib/api';

export default async function ProgramAssessmentsPage() {
  const dashboard = await getStudentDashboard();
  const deadlines = dashboard.deadlines ?? [];
  const examDeadlines = deadlines.filter((item) => item.type === 'Exam');
  const nextExam = examDeadlines[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          Track assignments, quizzes, and exams across your program.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
            <CardDescription>Due this term</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{deadlines.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submitted</CardTitle>
            <CardDescription>Awaiting grading</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Exam</CardTitle>
            <CardDescription>Exam window</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{nextExam?.date ?? 'TBD'}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Queue</CardTitle>
          <CardDescription>Prioritized by due date and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assessments scheduled yet. Check back after your next lecture.
            </p>
          ) : (
            deadlines.map((item) => (
              <div key={item.id} className="flex items-start justify-between rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    {item.type === 'Exam' ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <ClipboardList className="h-4 w-4 text-primary" />
                    )}
                    <p className="font-semibold">{item.title}</p>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarClock className="h-3 w-3" />
                    Due {item.date}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">Scheduled</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={item.type === 'Exam' ? '/student/exams' : '/student/assignments'}>
                      Open
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
