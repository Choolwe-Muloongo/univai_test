import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, GraduationCap } from 'lucide-react';
import { getLessonById } from '@/lib/api';

const objectives = [
  'Understand the key concept and why it matters.',
  'Apply the concept to a real-world scenario.',
  'Complete a quick knowledge check to proceed.',
];

export default async function LessonStartPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
        <p className="text-muted-foreground">
          Lesson overview, outcomes, and readiness check.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimated Time</CardTitle>
            <CardDescription>Typical completion</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Clock className="h-5 w-5 text-primary" />
            18 min
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Difficulty</CardTitle>
            <CardDescription>Recommended level</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Foundational</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Course</CardTitle>
            <CardDescription>Program context</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-primary" />
            {lesson.courseId.toUpperCase()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What you'll learn</CardTitle>
          <CardDescription>Key outcomes for this lesson.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {objectives.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-lg border p-4">
              <BookOpen className="mt-1 h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
        <CardFooter className="gap-2">
          <Button asChild>
            <Link href={`/student/lessons/${lessonId}/focus`}>Start Lesson</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/student/ai/lesson-companion/${lessonId}`}>AI Companion</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Need a quick refresher?</CardTitle>
          <CardDescription>AI can summarize this lesson before you begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={`/student/ai/lesson-companion/${lessonId}`}>Generate Summary</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

