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
import { getStudentGrades } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function ProgramGradesPage() {
  const gradeData = await getStudentGrades();
  const grades = gradeData.grades ?? [];

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
            <CardDescription>Based on published attempts</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{gradeData.gpa.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credits Earned</CardTitle>
            <CardDescription>Completed credits</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{gradeData.creditsEarned}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standing</CardTitle>
            <CardDescription>Academic status</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={gradeData.standing === 'good' ? 'secondary' : 'outline'}>
              {gradeData.standing}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Results</CardTitle>
          <CardDescription>Latest attempts for your modules.</CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No grades recorded yet. Once lecturers publish results, they will appear here.
            </div>
          ) : (
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
                {grades.map((row) => (
                  <TableRow key={`${row.moduleId}-${row.attempt}`}>
                    <TableCell className="font-medium">{row.moduleTitle ?? row.moduleId}</TableCell>
                    <TableCell>{row.credits ?? '-'}</TableCell>
                    <TableCell>
                      {row.letterGrade ? (
                        <Badge variant="secondary">{row.letterGrade}</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.resultStatus === 'published' ? 'secondary' : 'outline'}>
                        {row.resultStatus ?? 'draft'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
