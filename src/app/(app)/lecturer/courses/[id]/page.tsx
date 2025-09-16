// src/app/(app)/lecturer/courses/[id]/page.tsx
'use client';
import { notFound } from 'next/navigation';
import Image from 'next/image';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { courses, lessons } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Pencil, FileText, BarChart2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const studentResults = [
    { name: 'Alice', score: 85, progress: 100},
    { name: 'Bob', score: 92, progress: 100},
    { name: 'Charlie', score: 78, progress: 80 },
    { name: 'David', score: null, progress: 20 },
];

export default function LecturerCourseManagementPage({ params }: { params: { id: string } }) {
  const course = courses.find((c) => c.id === params.id);
  const courseLessons = lessons[params.id] || [];
  const placeholder = PlaceHolderImages.find((p) => p.id === course?.imageId);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="relative h-48 w-full overflow-hidden rounded-lg">
        <Image
          src={placeholder?.imageUrl || `https://picsum.photos/seed/${course.id}/1200/300`}
          alt={course.title}
          fill
          className="object-cover"
          data-ai-hint={placeholder?.imageHint || 'education'}
        />
        <div className="absolute inset-0 bg-black/50 flex items-end p-6">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-white">{course.title}</h1>
                <p className="text-lg text-white/90">Course Management</p>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle>Course Content</CardTitle>
                    <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" /> Edit Content</Button>
                </CardHeader>
                <CardContent>
                    <p className='mb-4 text-muted-foreground'>{course.description}</p>
                    <Accordion type="single" collapsible className="w-full">
                    {courseLessons.map((lesson) => (
                        <AccordionItem value={lesson.id} key={lesson.id}>
                        <AccordionTrigger className="text-base">{lesson.title}</AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground">
                            {lesson.content}
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                    </Accordion>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className='flex-row items-center justify-between'>
                    <CardTitle>Assessments & Exams</CardTitle>
                    <Button variant="outline" size="sm"><Pencil className="mr-2 h-4 w-4" /> Edit Exams</Button>
                </CardHeader>
                <CardContent>
                    <p className='text-muted-foreground'>Review and modify the exams and assignments for this course.</p>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Card>
            <CardHeader>
                <CardTitle>Student Results</CardTitle>
                <CardDescription>
                Overview of student performance in this course.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {studentResults.map((student, index) => (
                    <div key={index}>
                        <div className='flex justify-between items-center mb-1'>
                            <p className='font-medium'>{student.name}</p>
                            <p className={`text-sm font-semibold ${student.score ? 'text-primary' : 'text-muted-foreground'}`}>{student.score !== null ? `${student.score}%` : 'Incomplete'}</p>
                        </div>
                        <Progress value={student.progress} className='h-2'/>
                    </div>
                ))}
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
