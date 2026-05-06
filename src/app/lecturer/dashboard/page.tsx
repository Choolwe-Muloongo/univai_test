import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { BookOpen, UserCheck, MessageSquare, ArrowRight, Wand2, ClipboardList, Users, FileCheck2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getLecturerDashboard } from '@/lib/api';

const workflowLinks = [
  {
    title: 'Assigned Modules',
    description: 'Manage the modules and intake cohorts assigned by the academic admin team.',
    href: '/lecturer/courses',
    icon: BookOpen,
  },
  {
    title: 'AI Content Studio',
    description: 'Generate lecture scripts, quizzes, exercises, and source-grounded lesson content.',
    href: '/lecturer/courses',
    icon: Wand2,
  },
  {
    title: 'Assessments',
    description: 'Create and edit course exam questions for your assigned teaching areas.',
    href: '/lecturer/exams',
    icon: ClipboardList,
  },
  {
    title: 'Student Tracking',
    description: 'Review student progress, record grades, and generate support recommendations.',
    href: '/lecturer/progress',
    icon: Users,
  },
];

export default async function LecturerDashboardPage() {
  const dashboard = await getLecturerDashboard();
  const managedCourses = dashboard.managedCourses;
  const metrics = dashboard.metrics;
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Lecturer Dashboard</h1>
        <p className="text-muted-foreground">
          Active lecturers can manage assigned modules, prepare AI-assisted learning content, review drafts,
          create assessments, and track student progress from one workspace.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              {metric.key === 'courses' && <BookOpen className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'students' && <UserCheck className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'messages' && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {workflowLinks.map((item) => (
          <Card key={item.title} className="flex flex-col">
            <CardHeader>
              <item.icon className="mb-2 h-5 w-5 text-primary" />
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button variant="outline" size="sm" asChild>
                <Link href={item.href}>Open workflow</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Assigned Module Management</CardTitle>
            <CardDescription>Select an assigned module to manage content, draft reviews, sessions, assessments, and students.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
            {managedCourses.length > 0 ? managedCourses.map(course => (
                <Card key={`${course.id}-${course.intakeId ?? 'none'}-${course.moduleId ?? 'course'}`}>
                <CardHeader>
                    <CardTitle className='text-xl'>{course.moduleTitle ?? course.title}</CardTitle>
                    <CardDescription>
                      {course.title}
                      {course.moduleSemester ? ` · Semester ${course.moduleSemester}` : ''}
                      {course.intakeName ? ` · ${course.intakeName}` : ''}
                    </CardDescription>
                </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 text-sm md:grid-cols-3">
                          <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground">Students</p>
                            <p className="text-lg font-semibold">{course.studentCount}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground">Drafts to review</p>
                            <p className="text-lg font-semibold">{course.pendingDrafts ?? 0}</p>
                          </div>
                          <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground">Average progress</p>
                            <p className="text-lg font-semibold">{course.avgProgress}%</p>
                          </div>
                        </div>
                        <div className="w-full">
                          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                            <span>Average Progress</span>
                            <span>{course.avgProgress}%</span>
                          </div>
                          <Progress value={course.avgProgress} className="h-2" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap gap-2">
                       <Button asChild>
                           <Link href={`/lecturer/courses/${course.id}`}>Manage Module <ArrowRight className="ml-2 h-4 w-4" /></Link>
                       </Button>
                       <Button variant="outline" asChild>
                           <Link href="/lecturer/exams"><FileCheck2 className="mr-2 h-4 w-4" /> Create Assessment</Link>
                       </Button>
                       <Button variant="outline" asChild>
                           <Link href="/lecturer/progress"><Users className="mr-2 h-4 w-4" /> Track Students</Link>
                       </Button>
                    </CardFooter>
                </Card>
            )) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No assigned modules yet. Contact an administrator to be assigned to an intake and module.
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
