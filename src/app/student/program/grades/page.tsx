import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const gradeRows = [
  { course: 'Introduction to ICT', credits: 6, grade: 'A', status: 'Published' },
  { course: 'Fundamentals of Programming', credits: 6, grade: 'B+', status: 'Published' },
  { course: 'Mathematics for CS I', credits: 6, grade: 'B', status: 'Published' },
  { course: 'Introduction to AI', credits: 6, grade: 'A-', status: 'Published' },
  { course: 'Professional Development & Ethics', credits: 3, grade: 'Pending', status: 'In Review' },
];

export default function ProgramGradesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
        <p className="text-muted-foreground">
          Official results for your program modules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current GPA</CardTitle>
            <CardDescription>Semester 2</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">3.62</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credits Earned</CardTitle>
            <CardDescription>Out of 120</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">48</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standing</CardTitle>
            <CardDescription>Academic status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Good</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Results</CardTitle>
          <CardDescription>Awaiting final sign-off.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradeRows.map((row) => (
                <TableRow key={row.course}>
                  <TableCell className="font-medium">{row.course}</TableCell>
                  <TableCell>{row.credits}</TableCell>
                  <TableCell>
                    {row.grade === 'Pending' ? (
                      <Badge variant="outline">Pending</Badge>
                    ) : (
                      <Badge variant="secondary">{row.grade}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'Published' ? 'secondary' : 'outline'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/appeals">Request Appeal</Link>
          </Button>
          <Button asChild>
            <Link href="/student/program/progress">View Progress</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
