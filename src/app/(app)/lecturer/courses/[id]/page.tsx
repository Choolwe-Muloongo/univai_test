// src/app/(app)/lecturer/courses/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useActionState } from 'react';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';

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
import { Pencil, FileText, BarChart2, Wand2, Loader2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { generateVideoAction } from '@/app/(app)/actions';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


const studentResults = [
    { name: 'Alice', score: 85, progress: 100},
    { name: 'Bob', score: 92, progress: 100},
    { name: 'Charlie', score: 78, progress: 80 },
    { name: 'David', score: null, progress: 20 },
];

function GenerateVideoButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Video...
        </>
      ) : (
        <>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate AI Lecture
        </>
      )}
    </Button>
  );
}

function VideoGenerator({ lessonTitle }: { lessonTitle: string }) {
  const initialState = { message: null, errors: null, videoUrl: null };
  const [state, dispatch] = useActionState(generateVideoAction, initialState);
  const [prompt, setPrompt] = useState(`A 5-second educational video about: ${lessonTitle}.`);

  return (
    <div className='space-y-4 p-4 border-l-4 border-primary bg-muted/40'>
      <h3 className='font-semibold'>AI Video Lecture Generation</h3>
      {state.videoUrl ? (
        <div className="aspect-video bg-black rounded-md overflow-hidden">
          <video src={state.videoUrl} controls className="w-full h-full" />
        </div>
      ) : (
         <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-center p-4">
            <div className='max-w-md'>
                 <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <h3 className='font-semibold text-lg'>Generate Lecture</h3>
                <p className='text-muted-foreground text-sm'>Create a short video lecture for this topic using AI.</p>
            </div>
        </div>
      )}

      <form action={dispatch} className='space-y-4'>
        <div className="space-y-2">
          <Label htmlFor="prompt">Video Prompt</Label>
          <Textarea
            id="prompt"
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A cinematic shot of a an old car driving down a deserted road at sunset."
            className="min-h-20"
            required
          />
           {state.errors?.prompt && (
            <p className="text-sm text-destructive">{state.errors.prompt}</p>
          )}
        </div>
        <GenerateVideoButton />
      </form>
       {state.message && state.message !== 'Success' && (
         <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}


export default function LecturerCourseManagementPage() {
  const params = useParams();
  const id = params.id as string;
  const course = courses.find((c) => c.id === id);
  const courseLessons = lessons[id] || [];
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
                        <AccordionContent className="space-y-4">
                            <p className="text-base text-muted-foreground">{lesson.content}</p>
                            <VideoGenerator lessonTitle={lesson.title} />
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
