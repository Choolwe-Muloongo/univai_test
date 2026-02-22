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
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';
import { getProgram } from '@/lib/api';

export default async function ProgramProgressPage() {
  const program = await getProgram();
  const focusModules = [...program.modules]
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 3);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground">
          Track mastery, pacing, and AI recommendations for your program.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Program Progress</CardTitle>
          <CardDescription>Updated after each module checkpoint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{program.progress}%</span>
            <span className="text-muted-foreground">Target 100%</span>
          </div>
          <Progress value={program.progress} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {program.modules.map((module) => (
          <Card key={module.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{module.title}</CardTitle>
                <CardDescription>Semester {module.semester}</CardDescription>
              </div>
              <Badge variant={module.progress >= 80 ? 'secondary' : 'outline'}>
                {module.progress >= 80 ? 'On Track' : 'Needs Focus'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{module.progress}%</span>
              </div>
              <Progress value={module.progress} className="h-2" />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/modules/${module.id}`}>Review Module</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>AI Focus Recommendations</CardTitle>
            <CardDescription>
              Let UnivAI prioritize your next study session.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {focusModules.length > 0 ? (
            focusModules.map((module) => (
              <Badge key={module.id} variant="secondary">{module.title}</Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No recommendations yet.</span>
          )}
        </CardContent>
        <div className="px-6 pb-6">
          <Button asChild>
            <Link href="/student/ai">Open AI Coach</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
