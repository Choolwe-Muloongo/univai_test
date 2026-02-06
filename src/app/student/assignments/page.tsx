import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const assignments = [
  { id: 'a1', title: 'Python Basics Quiz', due: 'Feb 14', status: 'Open' },
  { id: 'a2', title: 'AI Ethics Reflection', due: 'Feb 21', status: 'Submitted' },
  { id: 'a3', title: 'Mini Project: Calculator', due: 'Mar 02', status: 'Open' },
];

export default function AssignmentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">Track submissions and upcoming deadlines.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/student/assignments/submissions">My Submissions</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/student/assignments/calendar">Assignment Calendar</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment) => (
          <Link key={assignment.id} href={`/student/assignments/${assignment.id}`}>
            <Card className="transition-all hover:border-primary/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{assignment.title}</CardTitle>
                  <CardDescription>Due {assignment.due}</CardDescription>
                </div>
                <Badge variant={assignment.status === 'Submitted' ? 'default' : 'secondary'}>{assignment.status}</Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Open details and submit.</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
