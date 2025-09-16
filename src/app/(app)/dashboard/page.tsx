
// src/app/(app)/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { QuickLinks } from '@/components/dashboard/quick-links';
import { courses, schools, type Course, type School } from '@/lib/data';
import { GraduationCap, Wallet, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const [studentCourse, setStudentCourse] = useState<Course | null>(null);
  const [studentSchool, setStudentSchool] = useState<School | null>(null);

  useEffect(() => {
    const schoolId = localStorage.getItem('userSchoolId');
    if (schoolId) {
      const course = courses.find(c => c.schoolId === schoolId);
      const school = schools.find(s => s.id === schoolId);
      setStudentCourse(course || null);
      setStudentSchool(school || null);
    } else {
        // Default for non-student roles or if not found
        setStudentCourse(courses[0]);
        setStudentSchool(schools.find(s => s.id === courses[0].schoolId) || null);
    }
  }, []);

  if (!studentCourse || !studentSchool) {
    // You can add a loading state here
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className='mb-6'>
            <CardHeader>
                <CardTitle>My Program</CardTitle>
                 <CardDescription>
                    Your central hub for course materials, progress, and modules.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg">{studentCourse.title}</p>
                        <p className="text-sm text-muted-foreground">
                            {studentSchool?.name}
                        </p>
                    </div>
                </div>
                <div className='space-y-2'>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Overall Progress</span>
                        <span>{studentCourse.progress}%</span>
                    </div>
                    <Progress value={studentCourse.progress} className="h-4" />
                </div>
            </CardContent>
             <CardFooter>
                 <Button asChild className="w-full">
                    <Link href="/program">
                    Go to My Program <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back, Student!</CardTitle>
            <CardDescription>Here's your course progress overview.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressChart />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-6">
        <QuickLinks />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Wallet</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">1,250 AFTA</div>
                <p className="text-xs text-muted-foreground">AFTACOIN Balance</p>
            </CardContent>
            <CardFooter>
                 <Button asChild className="w-full" variant="outline">
                    <Link href="/wallet">
                    View Wallet <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
