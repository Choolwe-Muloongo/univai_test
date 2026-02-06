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

const assessments = [
  {
    id: 'asg-101',
    title: 'Programming Lab 1',
    module: 'Fundamentals of Programming',
    due: 'Feb 10, 2026',
    status: 'In Progress',
    type: 'Assignment',
  },
  {
    id: 'asg-102',
    title: 'Digital Literacy Quiz',
    module: 'Introduction to ICT',
    due: 'Feb 6, 2026',
    status: 'Submitted',
    type: 'Quiz',
  },
  {
    id: 'exam-sem1',
    title: 'Semester 1 Exam',
    module: 'Semester 1',
    due: 'Feb 18, 2026',
    status: 'Available',
    type: 'Exam',
  },
];

export default function ProgramAssessmentsPage() {
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
            <CardDescription>2 tasks due this week</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">3</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Submitted</CardTitle>
            <CardDescription>Awaiting grading</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">5</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exams</CardTitle>
            <CardDescription>Next exam window</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">Feb 18</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Queue</CardTitle>
          <CardDescription>Prioritized by due date and status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assessments.map((item) => (
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
                <p className="text-sm text-muted-foreground">{item.module}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="h-3 w-3" />
                  Due {item.due}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={item.status === 'Submitted' ? 'secondary' : 'outline'}>
                  {item.status}
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/student/assignments">Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
