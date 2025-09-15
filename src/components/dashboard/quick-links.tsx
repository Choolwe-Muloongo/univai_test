'use client';
import { ArrowRight, BookOpen, GraduationCap, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { courses, type Course } from '@/lib/data';

const aiTools = [
  {
    title: 'Personalized Study Plan',
    description: 'Let AI build a plan just for you.',
    href: '/study-plan',
    icon: BookOpen,
  },
  {
    title: 'AI Tutor',
    description: 'Get instant answers to your questions.',
    href: '/tutor',
    icon: Lightbulb,
  },
];

export function QuickLinks() {
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

  useEffect(() => {
    const schoolId = localStorage.getItem('userSchoolId');
    if (schoolId) {
      const course = courses.find(c => c.schoolId === schoolId);
      setCurrentCourse(course || courses[0]);
    } else {
      setCurrentCourse(courses[0]);
    }
  }, []);

  if (!currentCourse) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {aiTools.map((tool) => (
              <li key={tool.title}>
                <Link
                  href={tool.href}
                  className="group flex items-start gap-4 rounded-lg p-2 -m-2 hover:bg-muted"
                >
                  <tool.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{tool.title}</p>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Continue Learning</CardTitle>
          <CardDescription>Pick up where you left off.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{currentCourse.title}</p>
              <p className="text-sm text-muted-foreground">
                {currentCourse.progress}% complete
              </p>
            </div>
          </div>
          <Button asChild className="mt-4 w-full">
            <Link href={`/courses/${currentCourse.id}`}>
              Go to Course <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
