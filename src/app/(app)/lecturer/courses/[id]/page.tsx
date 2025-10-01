// src/app/(app)/lecturer/courses/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useActionState } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type Course, type Lesson } from '@/lib/data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Pencil, FileText, Wand2, Loader2, AlertCircle, FileQuestion, Code, PlayCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { generateVideoAction, generateContentAction, updateLessonContent } from '@/app/(app)/actions';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCourseAndLessons } from '@/app/(app)/courses/[id]/actions';
import { Skeleton } from '@/components/ui/skeleton';


const studentResults = [
    { name: 'Alice', score: 85, progress: 100},
    { name: 'Bob', score: 92, progress: 100},
    { name: 'Charlie', score: 78, progress: 80 },
    { name: 'David', score: null, progress: 20 },
];

interface BaseGeneratorState {
  // message can be a string (error/success) or null initially
  message: string | null; 
  // errors can be an object map (for validation) or null
  errors: { [key: string]: string[] | undefined } | null;
}

// Specific state for the VideoGenerator
interface VideoState extends BaseGeneratorState {
  videoUrl: string | null;
}

// Specific state for Quiz/Exercise Generators
interface ContentState extends BaseGeneratorState {
  content: string | null;
}

function AIGeneratorButton({ icon: Icon, text }: { icon: React.ElementType, text: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Icon className="mr-2 h-4 w-4" />
          {text}
        </>
      )}
    </Button>
  );
}

function VideoGenerator({ courseId, lessonId, lessonTitle }: { courseId: string, lessonId: string, lessonTitle: string }) {
  const initialState = { message: null, errors: null, videoUrl: null };
  const [state, dispatch] = useActionState<VideoState, FormData>(generateVideoAction, initialState);
  const [prompt, setPrompt] = useState(`A 5-second educational video about: ${lessonTitle}.`);

  useEffect(() => {
    if (state.videoUrl) {
      updateLessonContent(courseId, lessonId, { videoUrl: state.videoUrl });
    }
  }, [state.videoUrl, courseId, lessonId]);

  return (
    <div className='space-y-4'>
      {state.videoUrl ? (
        <div className="aspect-video bg-black rounded-md overflow-hidden">
          <video src={state.videoUrl} controls className="w-full h-full" />
        </div>
      ) : (
         <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-center p-4">
            <div className='max-w-md'>
                 <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <h3 className='font-semibold text-lg'>Generate Video Lecture</h3>
                <p className='text-muted-foreground text-sm'>Create a short video lecture for this topic using AI by providing a detailed prompt.</p>
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
        <AIGeneratorButton icon={Wand2} text="Generate AI Lecture" />
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

function QuizGenerator({ courseId, lessonId, lessonTitle }: { courseId: string, lessonId: string, lessonTitle: string }) {
  const initialState = { message: null, errors: null, content: null };
  const [state, dispatch] = useActionState<ContentState, FormData>(generateContentAction, initialState);
  const [topic, setTopic] = useState(lessonTitle);

  const quiz = useMemo(() => {
    if (state.content) {
      try {
        const parsedQuiz = JSON.parse(state.content);
         if(parsedQuiz) {
            updateLessonContent(courseId, lessonId, { quiz: parsedQuiz });
        }
        return parsedQuiz;
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [state.content, courseId, lessonId]);

  return (
    <div className='space-y-4'>
      {quiz ? (
        <Card>
            <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                {quiz.questions.map((q: any, index: number) => (
                    <div key={index}>
                        <p className='font-semibold'>{index + 1}. {q.question}</p>
                        <ul className='list-disc pl-5 mt-2 space-y-1 text-muted-foreground'>
                            {q.options.map((opt: string) => (
                                <li key={opt} className={opt === q.answer ? 'text-primary font-medium' : ''}>{opt}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </CardContent>
        </Card>
      ) : (
         <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-center p-4">
            <div className='max-w-md'>
                 <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <h3 className='font-semibold text-lg'>Generate a Quiz</h3>
                <p className='text-muted-foreground text-sm'>Create a multiple-choice quiz for this topic to test student understanding.</p>
            </div>
        </div>
      )}

      <form action={dispatch} className='space-y-4'>
        <input type="hidden" name="contentType" value="Quiz" />
        <div className="space-y-2">
          <Label htmlFor="quiz-topic">Quiz Topic</Label>
          <Input
            id="quiz-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
           {state.errors?.topic && (
            <p className="text-sm text-destructive">{state.errors.topic}</p>
          )}
        </div>
        <AIGeneratorButton icon={Wand2} text="Generate Quiz" />
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

function ExerciseGenerator({ courseId, lessonId, lessonTitle }: { courseId: string, lessonId: string, lessonTitle: string }) {
  const initialState = { message: null, errors: null, content: null };
  const [state, dispatch] = useActionState<ContentState, FormData>(generateContentAction, initialState);
  //const [state, dispatch] = useActionState(generateContentAction, initialState);
  const [topic, setTopic] = useState(lessonTitle);

  useEffect(() => {
    if (state.content) {
      updateLessonContent(courseId, lessonId, { exercise: state.content });
    }
  }, [state.content, courseId, lessonId]);

  return (
    <div className='space-y-4'>
      {state.content ? (
        <Card className='font-mono text-sm'>
            <CardContent className='pt-6'>
                 <div className='bg-black p-4 rounded-md text-green-400'>
                    <pre><code>{state.content}</code></pre>
                </div>
            </CardContent>
        </Card>
      ) : (
         <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-center p-4">
            <div className='max-w-md'>
                 <Code className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <h3 className='font-semibold text-lg'>Generate Coding Exercise</h3>
                <p className='text-muted-foreground text-sm'>Create a simple Python coding exercise for students to practice this topic.</p>
            </div>
        </div>
      )}

      <form action={dispatch} className='space-y-4'>
        <input type="hidden" name="contentType" value="Exercise" />
        <div className="space-y-2">
          <Label htmlFor="exercise-topic">Exercise Topic</Label>
          <Input
            id="exercise-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
           {state.errors?.topic && (
            <p className="text-sm text-destructive">{state.errors.topic}</p>
          )}
        </div>
        <AIGeneratorButton icon={Wand2} text="Generate Exercise" />
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


function AIContentSuite({ courseId, lesson }: { courseId: string, lesson: Lesson }) {
    return (
        <Card className='border-primary border-2 shadow-primary/10'>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Wand2 /> AI Content Creation Suite</CardTitle>
                <CardDescription>Select a tool to generate content for the lesson: "{lesson.title}"</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="video">
                    <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger value="video"><PlayCircle /> Video Lecture</TabsTrigger>
                        <TabsTrigger value="quiz"><FileQuestion /> Quiz</TabsTrigger>
                        <TabsTrigger value="exercise"><Code /> Exercise</TabsTrigger>
                    </TabsList>
                    <TabsContent value="video" className='pt-6'>
                        <VideoGenerator courseId={courseId} lessonId={lesson.id} lessonTitle={lesson.title} />
                    </TabsContent>
                     <TabsContent value="quiz" className='pt-6'>
                        <QuizGenerator courseId={courseId} lessonId={lesson.id} lessonTitle={lesson.title} />
                    </TabsContent>
                     <TabsContent value="exercise" className='pt-6'>
                        <ExerciseGenerator courseId={courseId} lessonId={lesson.id} lessonTitle={lesson.title} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

export default function LecturerCourseManagementPage() {
  const params = useParams();
  const id = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const selectedLesson = useMemo(() => courseLessons.find(l => l.id === selectedLessonId), [courseLessons, selectedLessonId]);

  useEffect(() => {
    async function fetchData() {
        if (!id) return;
        setLoading(true);
        try {
            const { course, lessons } = await getCourseAndLessons(id);
            setCourse(course);
            setCourseLessons(lessons);
            if (lessons.length > 0) {
              setSelectedLessonId(lessons[0].id)
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [id])

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    notFound();
  }
  
  const placeholder = PlaceHolderImages.find((p) => p.id === course?.imageId);

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
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Course Lessons</CardTitle>
                    <CardDescription>Select a lesson below to manage its content with AI tools. If no lessons exist, create them in the admin content management section.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                    {courseLessons.length > 0 ? courseLessons.map((lesson) => (
                        <Button
                            key={lesson.id}
                            variant={selectedLessonId === lesson.id ? 'default' : 'outline'}
                            onClick={() => setSelectedLessonId(lesson.id)}
                            className='w-full justify-start'
                        >
                           {lesson.title}
                        </Button>
                    )) : (
                      <p className='text-muted-foreground text-center p-4'>No lessons found for this course.</p>
                    )}
                </CardContent>
            </Card>

            {selectedLesson && <AIContentSuite courseId={id} lesson={selectedLesson} />}
        </div>

        <div className="lg:col-span-1">
            <Card className="sticky top-24">
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
