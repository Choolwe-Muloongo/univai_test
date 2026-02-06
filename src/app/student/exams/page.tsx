import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const exams = [
  { id: 'sem1', title: 'Semester 1 Final', date: 'Mar 12', status: 'Eligible' },
  { id: 'py101', title: 'Python Foundations', date: 'Mar 20', status: 'Locked' },
];

export default function ExamsPage() {
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

      <div className="grid gap-4">
        {exams.map((exam) => (
          <Link key={exam.id} href={`/student/exams/${exam.id}`}>
            <Card className="transition-all hover:border-primary/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{exam.title}</CardTitle>
                  <CardDescription>{exam.date}</CardDescription>
                </div>
                <Badge variant={exam.status === 'Eligible' ? 'default' : 'secondary'}>{exam.status}</Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Open for details.</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
