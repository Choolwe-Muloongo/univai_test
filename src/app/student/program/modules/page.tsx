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
import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';
import { getProgram } from '@/lib/api';

export default async function ProgramModulesPage() {
  const program = await getProgram();
  const semesters = Array.from(new Set(program.modules.map((module) => module.semester)));
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modules</h1>
        <p className="text-muted-foreground">
          Browse your modules and jump straight to lessons.
        </p>
      </div>

      {semesters.map((semester) => (
        <Card key={semester}>
          <CardHeader>
            <CardTitle>Semester {semester}</CardTitle>
            <CardDescription>Modules assigned to this term.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {program.modules
              .filter((module) => module.semester === semester)
              .map((module) => (
                <div key={module.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{module.title}</p>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                    <Badge variant={module.progress === 100 ? 'secondary' : 'outline'}>
                      {module.progress === 100 ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild>
                      <Link href={`/student/modules/${module.id}`}>Open Module</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/student/lessons">View Lessons</Link>
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" asChild>
              <Link href={`/student/program/semester/${semester}/exam`}>Take Semester Exam</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/student/program/assessments">View Assessments</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}

      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Need help choosing a module?</CardTitle>
            <CardDescription>
              Let UnivAI recommend what to focus on next.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/student/ai">Open AI Tutor</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
