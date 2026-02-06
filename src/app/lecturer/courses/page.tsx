import Link from 'next/link';
import { BookOpen, Users } from 'lucide-react';
import { getCourses } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function LecturerCoursesPage() {
  const courses = await getCourses();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
        <p className="text-muted-foreground">
          Select a course to manage lessons, AI content, and student outcomes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                6 modules scheduled
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                40 enrolled students
              </div>
              <Badge variant="outline">Semester Active</Badge>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/lecturer/courses/${course.id}`}>Manage Course</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
