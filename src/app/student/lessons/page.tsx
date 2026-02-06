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

export default async function LessonsPage() {
  const flattenedLessons = await getFlattenedLessons();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lessons</h1>
        <p className="text-muted-foreground">Browse your available lessons.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Library</CardTitle>
          <CardDescription>Resume lessons or start a new topic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {flattenedLessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{lesson.title}</p>
                <p className="text-sm text-muted-foreground">Course: {lesson.courseId}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Lesson</Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/student/lessons/${lesson.id}`}>Open</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
