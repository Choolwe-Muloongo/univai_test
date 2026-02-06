import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getFlattenedLessons } from '@/lib/api';

export default async function AiLessonCompanionPage() {
  const flattenedLessons = await getFlattenedLessons();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lesson Companion</h1>
        <p className="text-muted-foreground">
          AI explanations, summaries, and practice prompts by lesson.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Lessons</CardTitle>
          <CardDescription>Pick a lesson to open AI companion tools.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {flattenedLessons.slice(0, 6).map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{lesson.title}</p>
                <p className="text-sm text-muted-foreground">
                  Lesson ID: {lesson.id} - Course: {lesson.courseId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">AI Ready</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/ai/lesson-companion/${lesson.id}`}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
