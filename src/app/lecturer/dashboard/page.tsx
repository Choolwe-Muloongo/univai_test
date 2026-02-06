import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, UserCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCourses } from '@/lib/api';

export default async function LecturerDashboardPage() {
  const courses = await getCourses();
  const managedCourses = courses.slice(0, 2).map((course, index) => ({
    id: course.id,
    title: course.title,
    studentCount: 40 + index * 8,
    avgProgress: 62 - index * 12,
  }));
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Lecturer Dashboard</h1>
       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Taught</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Active this semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">77</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">From students</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Course Management</CardTitle>
            <CardDescription>Select a course to manage its content, view progress, and interact with students.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
            {managedCourses.map(course => (
                <Card key={course.id}>
                    <CardHeader>
                        <CardTitle className='text-xl'>{course.title}</CardTitle>
                        <CardDescription>{course.studentCount} students enrolled</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full">
                          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                            <span>Average Progress</span>
                            <span>{course.avgProgress}%</span>
                          </div>
                          <Progress value={course.avgProgress} className="h-2" />
                        </div>
                    </CardContent>
                    <CardFooter>
                       <Button asChild>
                           <Link href={`/lecturer/courses/${course.id}`}>Manage Course <ArrowRight className="ml-2 h-4 w-4" /></Link>
                       </Button>
                    </CardFooter>
                </Card>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
