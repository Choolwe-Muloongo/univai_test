'use client';

import { useEffect, useState } from 'react';
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
import type { StudentGradesResponse } from '@/lib/api/types';

const fallbackGrades: StudentGradesResponse = {
  gpa: 0,
  creditsAttempted: 0,
  creditsEarned: 0,
  standing: 'Unavailable',
  grades: [],
};

export default function ProgramGradesPage() {
  const [gradeData, setGradeData] = useState<StudentGradesResponse>(fallbackGrades);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadGrades() {
      try {
        const data = await getStudentGrades();
        if (!isMounted) return;
        setGradeData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load program grades', err);
        if (isMounted) {
          setGradeData(fallbackGrades);
          setError('Live grade data is unavailable. Please refresh or check the backend session.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadGrades();

    return () => {
      isMounted = false;
    };
  }, []);

  const grades = gradeData.grades ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
        <p className="text-muted-foreground">
          Official results for your program modules.
        </p>
      </div>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-200">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current GPA</CardTitle>
            <CardDescription>Based on published attempts</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? 'Loading...' : gradeData.gpa.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credits Earned</CardTitle>
            <CardDescription>Completed credits</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{loading ? 'Loading...' : gradeData.creditsEarned}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Standing</CardTitle>
            <CardDescription>Academic status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : (
              <Badge variant={gradeData.standing === 'good' ? 'secondary' : 'outline'}>
                {gradeData.standing}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester Results</CardTitle>
          <CardDescription>Latest attempts for your modules.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading grades...</div>
          ) : grades.length === 0 ? (
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
