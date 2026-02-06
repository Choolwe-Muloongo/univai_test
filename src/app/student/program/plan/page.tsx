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
import { CalendarDays, GraduationCap, Route } from 'lucide-react';
import { getProgram } from '@/lib/api';

const totalSemesters = 8;
const semesters = Array.from({ length: totalSemesters }, (_, i) => i + 1);

export default async function ProgramPlanPage() {
  const program = await getProgram();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Semester Plan</h1>
        <p className="text-muted-foreground">
          A full roadmap of your degree with milestones and module pacing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Program Length</CardTitle>
            <CardDescription>Estimated completion</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">4 Years</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Semester</CardTitle>
            <CardDescription>Active learning cycle</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <CalendarDays className="h-5 w-5 text-primary" />
            Semester 2
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credits Required</CardTitle>
            <CardDescription>Graduation target</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">120</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {semesters.map((semester) => {
          const modules = program.modules.filter((module) => module.semester === semester);
          return (
            <Card key={semester}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Semester {semester}</CardTitle>
                  <CardDescription>
                    {modules.length > 0
                      ? `${modules.length} modules available`
                      : 'Planned modules pending release'}
                  </CardDescription>
                </div>
                <Badge variant={modules.length > 0 ? 'secondary' : 'outline'}>
                  {modules.length > 0 ? 'Active' : 'Planned'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {modules.length > 0 ? (
                  modules.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-semibold">{module.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                      <Badge variant="outline">{module.progress}%</Badge>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    This semester’s modules will appear once curriculum is finalized.
                  </div>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" asChild>
                  <Link href="/student/program/modules">View Modules</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/student/study-plan">Update Study Plan</Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Route className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Degree Milestones</CardTitle>
            <CardDescription>Key checkpoints across your program.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Year 1</p>
            <p className="text-sm text-muted-foreground">Foundation modules + digital literacy</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Year 2</p>
            <p className="text-sm text-muted-foreground">Applied projects + specialization</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">Final Year</p>
            <p className="text-sm text-muted-foreground">Capstone + internship readiness</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/student/graduation">Check Graduation Status</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

