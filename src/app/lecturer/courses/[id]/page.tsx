// src/app/(app)/lecturer/courses/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { useActionState } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { type Course, type Lesson } from '@/lib/api/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Pencil, FileText, Wand2, Loader2, AlertCircle, FileQuestion, Code, PlayCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { generateLectureScriptAction, generateContentAction, updateLessonContent } from '@/app/actions';
import { getCourseById, getLessonsByCourse, getLecturerAssignments, getLessonDocuments, uploadLessonDocument, updateAssignmentMeeting, reviewLessonDocument } from '@/lib/api';
import type { LecturerAssignment, LessonDocument } from '@/lib/api/types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';


interface BaseGeneratorState {
  // message can be a string (error/success) or null initially
  message: string | null; 
  // errors can be an object map (for validation) or null
  errors: { [key: string]: string[] | undefined } | null;
}

// Specific state for the VideoGenerator
interface LectureScriptState extends BaseGeneratorState {
  script: string | null;
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

function LectureScriptGenerator({
  courseId,
  lessonId,
  lessonTitle,
  sourceMaterial,
  intakeName,
  existingVideoUrl,
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  sourceMaterial?: string;
  intakeName?: string | null;
  existingVideoUrl?: string | null;
}) {
  const initialState = { message: null, errors: null, script: null };
  const [state, dispatch] = useActionState<LectureScriptState, FormData>(generateLectureScriptAction, initialState);
  const [topic, setTopic] = useState(lessonTitle);
  const [scriptDraft, setScriptDraft] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [videoUrl, setVideoUrl] = useState(existingVideoUrl || '');
  const [savingVideo, setSavingVideo] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (state.script) {
      setScriptDraft(state.script);
    }
  }, [state.script]);

  const handleSaveDraft = async () => {
    if (!scriptDraft.trim()) return;
    setSavingDraft(true);
    setSaveMessage(null);
    try {
      await updateLessonContent(courseId, lessonId, { content: scriptDraft.trim() });
      setSaveMessage('Lecture script saved to lesson content.');
    } catch (error) {
      setSaveMessage('Failed to save lecture script. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSaveVideo = async () => {
    if (!videoUrl.trim()) return;
    setSavingVideo(true);
    setSaveMessage(null);
    try {
      await updateLessonContent(courseId, lessonId, { videoUrl: videoUrl.trim() });
      setSaveMessage('Video link saved for this lesson.');
    } catch (error) {
      setSaveMessage('Failed to save video link. Please try again.');
    } finally {
      setSavingVideo(false);
    }
  };

  return (
    <div className='space-y-4'>
      {scriptDraft ? (
        <Card>
          <CardHeader>
            <CardTitle>Lecture Script Draft</CardTitle>
            <CardDescription>Edit the AI draft before saving to the lesson.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={scriptDraft}
              onChange={(event) => setScriptDraft(event.target.value)}
              className="min-h-48"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSaveDraft} disabled={savingDraft || !scriptDraft.trim()}>
                {savingDraft ? 'Saving...' : 'Save to Lesson Content'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center text-center p-4">
          <div className='max-w-md'>
            <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <h3 className='font-semibold text-lg'>Generate Lecture Script</h3>
            <p className='text-muted-foreground text-sm'>Create a structured script you can use to record or present this lesson.</p>
          </div>
        </div>
      )}

      <form action={dispatch} className='space-y-4'>
        <input type="hidden" name="sourceMaterial" value={sourceMaterial || ''} />
        <input type="hidden" name="intakeName" value={intakeName || ''} />
        <div className="space-y-2">
          <Label htmlFor="lecture-topic">Lesson Focus</Label>
          <Input
            id="lecture-topic"
            name="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Database normalization for Year 1 cohort"
            required
          />
          {state.errors?.topic && (
            <p className="text-sm text-destructive">{state.errors.topic}</p>
          )}
        </div>
        <AIGeneratorButton icon={Wand2} text="Generate Lecture Script" />
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Video Link (Optional)</CardTitle>
          <CardDescription>Paste a recorded lecture URL to show students.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="https://..."
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
          />
          <Button onClick={handleSaveVideo} disabled={savingVideo || !videoUrl.trim()}>
            {savingVideo ? 'Saving...' : 'Save Video Link'}
          </Button>
        </CardContent>
      </Card>

      {saveMessage && (
        <Alert>
          <AlertTitle>Update</AlertTitle>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

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

function QuizGenerator({
  courseId,
  lessonId,
  lessonTitle,
  sourceMaterial,
  intakeName,
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  sourceMaterial?: string;
  intakeName?: string | null;
}) {
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
        <input type="hidden" name="sourceMaterial" value={sourceMaterial || ''} />
        <input type="hidden" name="intakeName" value={intakeName || ''} />
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

function ExerciseGenerator({
  courseId,
  lessonId,
  lessonTitle,
  sourceMaterial,
  intakeName,
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  sourceMaterial?: string;
  intakeName?: string | null;
}) {
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
        <input type="hidden" name="sourceMaterial" value={sourceMaterial || ''} />
        <input type="hidden" name="intakeName" value={intakeName || ''} />
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

function LessonDocumentsPanel({
  lessonId,
  intakeId,
  intakeName,
  onSourceMaterial,
}: {
  lessonId: string;
  intakeId?: string;
  intakeName?: string | null;
  onSourceMaterial: (text: string) => void;
}) {
  const [documents, setDocuments] = useState<LessonDocument[]>([]);
  const [manualText, setManualText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    const load = async () => {
      try {
        const docs = await getLessonDocuments(lessonId, intakeId || null);
        setDocuments(docs);
        const combined = docs
          .filter((doc) => doc.status === 'approved')
          .map((doc) => doc.extractedText)
          .filter(Boolean)
          .join('\n\n');
        onSourceMaterial(combined);
      } catch (error) {
        console.error('Failed to load lesson documents', error);
        onSourceMaterial('');
      }
    };
    load();
  }, [lessonId, intakeId, onSourceMaterial]);

  const handleUpload = async () => {
    if (!intakeId || (!file && !manualText.trim())) return;
    setLoading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (manualText.trim()) {
        formData.append('text', manualText.trim());
      }
      if (intakeId) {
        formData.append('intakeId', intakeId);
      }
      formData.append('source', 'manual');
      await uploadLessonDocument(lessonId, formData);
      setManualText('');
      setFile(null);
      const refreshed = await getLessonDocuments(lessonId, intakeId || null);
      setDocuments(refreshed);
      const combined = refreshed
        .filter((doc) => doc.status === 'approved')
        .map((doc) => doc.extractedText)
        .filter(Boolean)
        .join('\n\n');
      onSourceMaterial(combined);
    } catch (error) {
      console.error('Failed to upload lesson document', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (doc: LessonDocument, status: 'approved' | 'rejected') => {
    setReviewingId(doc.id);
    try {
      await reviewLessonDocument(lessonId, doc.id, status);
      const refreshed = await getLessonDocuments(lessonId, intakeId || null);
      setDocuments(refreshed);
      const combined = refreshed
        .filter((document) => document.status === 'approved')
        .map((document) => document.extractedText)
        .filter(Boolean)
        .join('\n\n');
      onSourceMaterial(combined);
    } catch (error) {
      console.error('Failed to review lesson document', error);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson Documents</CardTitle>
        <CardDescription>
          Upload or paste lesson material. AI tools will use this to generate content.
          {intakeName ? ` Intake: ${intakeName}` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Upload file (txt recommended)</Label>
          <Input
            type="file"
            accept=".txt,.md,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-2">
          <Label>Or paste lesson notes</Label>
          <Textarea
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            placeholder="Paste lesson notes, objectives, or outline..."
            className="min-h-28"
          />
        </div>
        {!intakeId && (
          <p className="text-sm text-muted-foreground">
            Select an intake above before uploading lesson materials.
          </p>
        )}
        <Button onClick={handleUpload} disabled={loading || !intakeId || (!file && !manualText.trim())}>
          {loading ? 'Uploading...' : 'Save Lesson Material'}
        </Button>

        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border p-3 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{doc.fileName}</p>
                <span className="text-xs uppercase text-muted-foreground">{doc.status ?? 'approved'}</span>
              </div>
              <p className="text-muted-foreground line-clamp-3">
                {doc.extractedText || 'No extracted text available yet.'}
              </p>
              {doc.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReview(doc, 'approved')}
                    disabled={reviewingId === doc.id}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(doc, 'rejected')}
                    disabled={reviewingId === doc.id}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


function AIContentSuite({
  courseId,
  lesson,
  sourceMaterial,
  intakeName,
}: {
  courseId: string;
  lesson: Lesson;
  sourceMaterial: string;
  intakeName?: string | null;
}) {
    return (
        <Card className='border-primary border-2 shadow-primary/10'>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'><Wand2 /> AI Content Creation Suite</CardTitle>
                <CardDescription>Select a tool to generate content for the lesson: "{lesson.title}"</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="video">
                    <TabsList className='grid w-full grid-cols-3'>
                        <TabsTrigger value="video"><PlayCircle /> Lecture Script</TabsTrigger>
                        <TabsTrigger value="quiz"><FileQuestion /> Quiz</TabsTrigger>
                        <TabsTrigger value="exercise"><Code /> Exercise</TabsTrigger>
                    </TabsList>
                    <TabsContent value="video" className='pt-6'>
                        <LectureScriptGenerator
                          courseId={courseId}
                          lessonId={lesson.id}
                          lessonTitle={lesson.title}
                          sourceMaterial={sourceMaterial}
                          intakeName={intakeName}
                          existingVideoUrl={lesson.videoUrl}
                        />
                    </TabsContent>
                     <TabsContent value="quiz" className='pt-6'>
                        <QuizGenerator courseId={courseId} lessonId={lesson.id} lessonTitle={lesson.title} sourceMaterial={sourceMaterial} intakeName={intakeName} />
                    </TabsContent>
                     <TabsContent value="exercise" className='pt-6'>
                        <ExerciseGenerator courseId={courseId} lessonId={lesson.id} lessonTitle={lesson.title} sourceMaterial={sourceMaterial} intakeName={intakeName} />
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
  const [assignments, setAssignments] = useState<LecturerAssignment[]>([]);
  const [selectedIntakeId, setSelectedIntakeId] = useState<string>('');
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [meetingProvider, setMeetingProvider] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingDay, setMeetingDay] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [meetingSaving, setMeetingSaving] = useState(false);

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const selectedLesson = useMemo(() => courseLessons.find(l => l.id === selectedLessonId), [courseLessons, selectedLessonId]);
  const courseAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.courseId === id),
    [assignments, id]
  );
  const selectedIntake = useMemo(
    () => courseAssignments.find((assignment) => assignment.id.toString() === selectedIntakeId) ?? courseAssignments[0],
    [courseAssignments, selectedIntakeId]
  );

  useEffect(() => {
    if (!selectedIntake) return;
    setMeetingProvider(selectedIntake.meetingProvider ?? '');
    setMeetingUrl(selectedIntake.meetingUrl ?? '');
    const schedule = selectedIntake.meetingSchedule as { day?: string; time?: string } | null;
    setMeetingDay(schedule?.day ?? '');
    setMeetingTime(schedule?.time ?? '');
    setMeetingNotes(selectedIntake.meetingNotes ?? '');
  }, [selectedIntake]);

  useEffect(() => {
    if (!id) return;
    const loadCourse = async () => {
      setLoading(true);
      const [foundCourse, foundLessons, lecturerAssignments] = await Promise.all([
        getCourseById(id),
        getLessonsByCourse(id),
        getLecturerAssignments(),
      ]);
      setCourse(foundCourse);
      setCourseLessons(foundLessons);
      setAssignments(lecturerAssignments);
      const defaultAssignment = lecturerAssignments.find((assignment) => assignment.courseId === id);
      setSelectedIntakeId(defaultAssignment ? defaultAssignment.id.toString() : '');
      if (foundLessons.length > 0) {
        setSelectedLessonId(foundLessons[0].id);
      }
      setLoading(false);
    };
    loadCourse();
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

  const handleSaveMeeting = async () => {
    if (!selectedIntake) return;
    setMeetingSaving(true);
    try {
      const updated = await updateAssignmentMeeting(selectedIntake.id, {
        meetingProvider: meetingProvider || undefined,
        meetingUrl: meetingUrl || undefined,
        meetingSchedule: meetingDay || meetingTime ? { day: meetingDay, time: meetingTime } : null,
        meetingNotes: meetingNotes || undefined,
      });
      setAssignments((prev) =>
        prev.map((assignment) => (assignment.id === updated.id ? { ...assignment, ...updated } : assignment))
      );
    } catch (error) {
      console.error('Failed to save meeting link', error);
    } finally {
      setMeetingSaving(false);
    }
  };

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
                    <CardTitle>Teaching Intake</CardTitle>
                    <CardDescription>Choose the intake cohort you are preparing content for.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Select value={selectedIntakeId} onValueChange={setSelectedIntakeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select intake" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseAssignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id.toString()}>
                            {assignment.intakeName ?? 'Unassigned Intake'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedIntake?.moduleTitle ? (
                      <p className="text-sm text-muted-foreground">
                        Module focus: {selectedIntake.moduleTitle}
                        {selectedIntake.moduleSemester ? ` (Semester ${selectedIntake.moduleSemester})` : ''}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No module assigned yet. Ask admin to assign the module and semester.
                      </p>
                    )}
                    {!selectedIntake?.intakeId && (
                      <p className="text-sm text-muted-foreground">
                        No intake assigned yet. Ask admin to assign an intake for this course.
                      </p>
                    )}
                </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Live Sessions</CardTitle>
                <CardDescription>Create sessions and mark attendance.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href={`/lecturer/courses/${id}/sessions`}>Manage Sessions</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Live Lesson Link</CardTitle>
                <CardDescription>
                  Share the live session link (Zoom/Google Meet/Teams) for this intake.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={meetingProvider} onValueChange={setMeetingProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="google-meet">Google Meet</SelectItem>
                      <SelectItem value="microsoft-teams">Microsoft Teams</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-url">Meeting URL</Label>
                  <Input
                    id="meeting-url"
                    placeholder="https://meet.google.com/..."
                    value={meetingUrl}
                    onChange={(event) => setMeetingUrl(event.target.value)}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="meeting-day">Day</Label>
                    <Input
                      id="meeting-day"
                      placeholder="Mon / Tue / Fri"
                      value={meetingDay}
                      onChange={(event) => setMeetingDay(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meeting-time">Time</Label>
                    <Input
                      id="meeting-time"
                      placeholder="10:00 AM"
                      value={meetingTime}
                      onChange={(event) => setMeetingTime(event.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting-notes">Notes</Label>
                  <Textarea
                    id="meeting-notes"
                    placeholder="Weekly live session. Join 5 minutes early."
                    value={meetingNotes}
                    onChange={(event) => setMeetingNotes(event.target.value)}
                    className="min-h-20"
                  />
                </div>
                <Button onClick={handleSaveMeeting} disabled={meetingSaving || !selectedIntake?.intakeId}>
                  {meetingSaving ? 'Saving...' : 'Save Live Lesson Link'}
                </Button>
                {!selectedIntake?.intakeId && (
                  <p className="text-sm text-muted-foreground">
                    Assign an intake before publishing a live session link.
                  </p>
                )}
              </CardContent>
            </Card>
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

            {selectedLesson && (
              <>
                <LessonDocumentsPanel
                  lessonId={selectedLesson.id}
                  intakeId={selectedIntake?.intakeId || undefined}
                  intakeName={selectedIntake?.intakeName}
                  onSourceMaterial={setSourceMaterial}
                />
                <AIContentSuite
                  courseId={id}
                  lesson={selectedLesson}
                  sourceMaterial={sourceMaterial}
                  intakeName={selectedIntake?.intakeName}
                />
              </>
            )}
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
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Student performance will appear once grades are recorded.
                </div>
            </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

