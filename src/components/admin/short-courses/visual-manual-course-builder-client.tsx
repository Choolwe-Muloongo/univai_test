'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getCourses, getSchools } from '@/lib/api';
import { generateShortCourseContent } from '@/lib/api/short-course-generation';
import type { CourseBuilderBlueprint } from '@/lib/api/course-builder-types';
import type { Course, School } from '@/lib/api/types';
import { extractDocumentText, type DocumentExtractionProgress } from '@/lib/document-text-extractor';

type SourceDoc = { name: string; mode: string; text: string; warning?: string };
type CardType = 'explanation' | 'example' | 'question' | 'fill_blank' | 'true_false' | 'summary' | 'equation' | 'table' | 'graph';
type LessonCard = {
  type: CardType;
  title: string;
  body?: string;
  question?: string;
  options?: string[];
  correctAnswer?: string | boolean;
  explanation?: string;
  text?: string;
  statement?: string;
  equation?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
};
type VisualLesson = { title: string; summary: string; durationMinutes: number; difficulty: string; outcomes: string[]; cards: LessonCard[]; activities: string[]; assessment: string };

type FormState = {
  title: string;
  description: string;
  schoolId: string;
  price: string;
  currency: string;
  certificateFee: string;
  certificateCurrency: string;
  durationHours: string;
  level: string;
};

const defaultCard: LessonCard = { type: 'explanation', title: 'Core idea', body: 'Explain one idea clearly.' };
const defaultLesson = (): VisualLesson => ({
  title: 'Lesson 1',
  summary: 'Introduce the main concept.',
  durationMinutes: 20,
  difficulty: 'beginner',
  outcomes: ['Understand the main concept.'],
  cards: [defaultCard, { type: 'question', title: 'Quick check', question: 'What should learners do after a new idea?', options: ['Ignore it', 'Practice with an example', 'Skip feedback', 'Memorize blindly'], correctAnswer: 'Practice with an example', explanation: 'Practice helps turn information into skill.' }, { type: 'summary', title: 'Summary', body: 'Summarize the lesson.' }],
  activities: [],
  assessment: 'Complete the lesson checks.',
});

export function VisualManualCourseBuilderClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState<DocumentExtractionProgress | null>(null);
  const [prompt, setPrompt] = useState('');
  const [documents, setDocuments] = useState<SourceDoc[]>([]);
  const [lessons, setLessons] = useState<VisualLesson[]>([defaultLesson()]);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ title: '', description: '', schoolId: '', price: '0', currency: 'ZMW', certificateFee: '0', certificateCurrency: 'ZMW', durationHours: '8', level: 'beginner' });

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), getCourses()])
      .then(([schoolData, courseData]) => {
        if (!mounted) return;
        setSchools(schoolData);
        setCourses(courseData);
        if (schoolData[0]) setForm((value) => ({ ...value, schoolId: schoolData[0].id }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load manual builder data.'))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  const activeLesson = lessons[lessonIndex] ?? lessons[0];
  const activeCard = activeLesson.cards[cardIndex] ?? activeLesson.cards[0];
  const sourceText = useMemo(() => documents.map((doc, index) => `DOCUMENT ${index + 1}: ${doc.name}\n${doc.text}`).join('\n\n---\n\n').slice(0, 180000), [documents]);
  const blueprint = useMemo(() => buildBlueprint(form, lessons), [form, lessons]);

  async function readDocuments(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setReading(true);
    setError(null);
    setMessage(null);
    setProgress(null);
    try {
      const extracted: SourceDoc[] = [];
      for (const file of files) {
        const result = await extractDocumentText(file, { onProgress: setProgress });
        extracted.push({ name: file.name, mode: result.mode, text: result.text.slice(0, 60000), warning: result.warning });
      }
      setDocuments((current) => [...current, ...extracted]);
      setMessage(`${extracted.length} document(s) loaded. They can guide AI generation or be used as reference while editing manually.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read documents.');
    } finally {
      setReading(false);
      setProgress(null);
      event.target.value = '';
    }
  }

  function updateLesson(patch: Partial<VisualLesson>) {
    setLessons((current) => current.map((lesson, index) => index === lessonIndex ? { ...lesson, ...patch } : lesson));
  }

  function updateCard(patch: Partial<LessonCard>) {
    setLessons((current) => current.map((lesson, index) => {
      if (index !== lessonIndex) return lesson;
      return { ...lesson, cards: lesson.cards.map((card, cardPosition) => cardPosition === cardIndex ? { ...card, ...patch } : card) };
    }));
  }

  function addLesson() {
    const next = defaultLesson();
    next.title = `Lesson ${lessons.length + 1}`;
    setLessons((current) => [...current, next]);
    setLessonIndex(lessons.length);
    setCardIndex(0);
  }

  function addCard(type: CardType = 'explanation') {
    const card = cardByType(type);
    setLessons((current) => current.map((lesson, index) => index === lessonIndex ? { ...lesson, cards: [...lesson.cards, card] } : lesson));
    setCardIndex(activeLesson.cards.length);
  }

  function removeCard() {
    if (activeLesson.cards.length <= 1) return;
    setLessons((current) => current.map((lesson, index) => index === lessonIndex ? { ...lesson, cards: lesson.cards.filter((_, idx) => idx !== cardIndex) } : lesson));
    setCardIndex((value) => Math.max(0, value - 1));
  }

  async function generateFromAi() {
    const seed = prompt.trim() || form.title.trim() || 'Create a practical short course from the attached documents.';
    if (!seed && !sourceText) {
      setError('Add a course idea or upload documents first.');
      return;
    }
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const response = await generateShortCourseContent({
        mode: 'general',
        feature: 'admin_short_course_visual_builder',
        audience: 'short-course learners',
        brandContext: 'UnivAI short courses use editable SoloLearn-style cards. Admins must review before publishing.',
        prompt: buildAiPrompt(seed, form, sourceText, documents.map((doc) => doc.name)),
      });
      const raw = String(response.text || response.output || response.content || JSON.stringify(response));
      const parsed = normalizeAiBlueprint(JSON.parse(cleanJson(raw)) as CourseBuilderBlueprint);
      setLessons(parsed.modules.flatMap((module) => module.lessons.map((lesson) => ({
        title: lesson.title,
        summary: lesson.summary,
        durationMinutes: lesson.durationMinutes,
        difficulty: lesson.difficulty || parsed.courseSummary.level || 'beginner',
        outcomes: lesson.outcomes || [],
        cards: (lesson.blocks || []).map(cardFromBlock),
        activities: lesson.activities || [],
        assessment: lesson.assessment || 'Lesson check.',
      }))));
      setForm((value) => ({ ...value, title: value.title || parsed.courseSummary.title, description: value.description || parsed.courseSummary.description, durationHours: String(parsed.courseSummary.totalDurationHours || value.durationHours), level: parsed.courseSummary.level || value.level }));
      setLessonIndex(0);
      setCardIndex(0);
      setMessage('AI draft loaded into the visual editor. Edit cards while checking the student preview before saving.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!form.title.trim()) { setError('Course title is required.'); return; }
    if (!form.schoolId) { setError('School / Faculty is required.'); return; }
    if (!lessons.length || lessons.some((lesson) => !lesson.cards.length)) { setError('Each lesson needs at least one card.'); return; }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await createShortCourseDraftWithBlueprint({
        course: {
          id: slugify(form.title || `short-course-${Date.now()}`),
          title: form.title,
          description: form.description || blueprint.courseSummary.description,
          schoolId: form.schoolId,
          imageId: 'short-course',
          pricingType: Number(form.price) > 0 ? 'paid' : 'free',
          price: Number(form.price),
          currency: form.currency,
          certificateFee: Number(form.certificateFee),
          certificateCurrency: form.certificateCurrency,
          durationHours: Number(form.durationHours || blueprint.courseSummary.totalDurationHours || 1),
          level: form.level,
          status: 'draft',
          modules: blueprint.modules.map((module) => ({ title: module.title, description: module.description })),
          lessons: flattenLessons(blueprint),
          outcomes: blueprint.courseSummary.outcomes,
        } as any,
        blueprint: blueprint as any,
        sourceMode: documents.length ? 'document' as any : 'manual',
        programmeTitle: null,
        programmeCourseTitle: documents.map((doc) => doc.name).join(', ') || null,
      });
      setCourses(await getCourses());
      setMessage('Draft saved. Open Review & Publish to submit, approve, and publish it.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading visual builder..." />;

  return (
    <div className="space-y-6">
      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-xl border bg-muted/40 p-4 text-sm">{message}</div> : null}
      {progress ? <div className="rounded-xl border bg-primary/5 p-4 text-sm"><div className="mb-2 flex justify-between gap-3"><span>{progress.message}</span><strong>{progress.percent ?? 0}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(1, progress.percent ?? 1)}%` }} /></div>{progress.currentPage && progress.totalPages ? <p className="mt-2 text-xs text-muted-foreground">Page {progress.currentPage} of {progress.totalPages}</p> : null}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Course setup</CardTitle><CardDescription>No JSON required. Fill in the course, upload multiple documents, then edit cards visually.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Course title"><Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} placeholder="Software Development" /></Field>
              <Field label="Description"><Textarea rows={3} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="School / Faculty"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field>
                <Field label="Level"><Input value={form.level} onChange={(event) => setForm((value) => ({ ...value, level: event.target.value }))} /></Field>
                <Field label="Hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
                <Field label="Entry fee"><Input type="number" min={0} value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} /></Field>
                <Field label="Currency"><Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} /></Field>
                <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
              </div>
              <Field label="Upload one or many documents"><Input type="file" multiple accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={readDocuments} disabled={reading} /></Field>
              {documents.length ? <div className="space-y-2 rounded-xl border p-3 text-sm"><p className="font-semibold">Loaded documents</p>{documents.map((doc, index) => <div key={`${doc.name}-${index}`} className="rounded-lg bg-muted/40 p-2"><p>{index + 1}. {doc.name}</p>{doc.warning ? <p className="text-xs text-amber-600">{doc.warning}</p> : null}</div>)}<Button type="button" size="sm" variant="ghost" onClick={() => setDocuments([])}>Clear documents</Button></div> : null}
              <Field label="Optional AI instruction"><Textarea rows={4} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: Make one lesson based on Unit 2 and add questions after each concept." /></Field>
              <div className="grid gap-2 sm:grid-cols-2"><Button type="button" onClick={generateFromAi} disabled={generating || reading}>{generating ? 'Generating...' : 'Generate into visual editor'}</Button><Button type="button" variant="outline" onClick={saveDraft} disabled={saving}>{saving ? 'Saving...' : 'Save draft for review'}</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lessons</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">{lessons.map((lesson, index) => <Button key={`${lesson.title}-${index}`} type="button" size="sm" variant={index === lessonIndex ? 'default' : 'outline'} onClick={() => { setLessonIndex(index); setCardIndex(0); }}>{lesson.title || `Lesson ${index + 1}`}</Button>)}<Button type="button" size="sm" variant="secondary" onClick={addLesson}>+ Lesson</Button></div>
              <Field label="Lesson title"><Input value={activeLesson.title} onChange={(event) => updateLesson({ title: event.target.value })} /></Field>
              <Field label="Lesson summary"><Textarea rows={2} value={activeLesson.summary} onChange={(event) => updateLesson({ summary: event.target.value })} /></Field>
              <div className="grid gap-3 md:grid-cols-2"><Field label="Minutes"><Input type="number" min={1} value={activeLesson.durationMinutes} onChange={(event) => updateLesson({ durationMinutes: Number(event.target.value) })} /></Field><Field label="Difficulty"><Input value={activeLesson.difficulty} onChange={(event) => updateLesson({ difficulty: event.target.value })} /></Field></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lesson cards</CardTitle><CardDescription>Edit the selected card and watch the student preview update instantly.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">{activeLesson.cards.map((card, index) => <Button key={`${card.type}-${index}`} type="button" size="sm" variant={index === cardIndex ? 'default' : 'outline'} onClick={() => setCardIndex(index)}>{index + 1}. {card.type}</Button>)}</div>
              <div className="grid gap-2 sm:grid-cols-3"><Button type="button" variant="outline" onClick={() => addCard('explanation')}>+ Explanation</Button><Button type="button" variant="outline" onClick={() => addCard('question')}>+ Question</Button><Button type="button" variant="outline" onClick={() => addCard('summary')}>+ Summary</Button></div>
              <Field label="Card type"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={activeCard.type} onChange={(event) => updateCard(cardByType(event.target.value as CardType))}>{['explanation','example','question','fill_blank','true_false','summary','equation','table','graph'].map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
              <Field label="Card title"><Input value={activeCard.title || ''} onChange={(event) => updateCard({ title: event.target.value })} /></Field>
              <CardFields card={activeCard} updateCard={updateCard} />
              <div className="grid gap-2 sm:grid-cols-2"><Button type="button" variant="destructive" onClick={removeCard} disabled={activeLesson.cards.length <= 1}>Delete card</Button><Button type="button" onClick={saveDraft} disabled={saving}>{saving ? 'Saving...' : 'Save draft'}</Button></div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-4 xl:self-start">
          <Card>
            <CardHeader><CardTitle>Student live preview</CardTitle><CardDescription>This is how learners will experience the selected lesson.</CardDescription></CardHeader>
            <CardContent><LessonPlayer lesson={lessonPreview(activeLesson)} courseTitle={form.title || 'Short course'} onComplete={() => undefined} completeLabel="Preview complete" /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Existing drafts and courses</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">{courses.slice(0, 8).map((course) => <div key={course.id} className="rounded-lg border p-3"><p className="font-medium">{course.title}</p><p className="text-muted-foreground">{course.status ?? 'draft'} · {course.level ?? 'beginner'} · {course.durationHours ?? 0}h</p></div>)}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CardFields({ card, updateCard }: { card: LessonCard; updateCard: (patch: Partial<LessonCard>) => void }) {
  if (card.type === 'question') return <><Field label="Question"><Textarea rows={3} value={card.question || ''} onChange={(event) => updateCard({ question: event.target.value })} /></Field><Field label="Options, one per line"><Textarea rows={4} value={(card.options || []).join('\n')} onChange={(event) => updateCard({ options: event.target.value.split('\n').filter(Boolean) })} /></Field><Field label="Correct answer"><Input value={String(card.correctAnswer || '')} onChange={(event) => updateCard({ correctAnswer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={2} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  if (card.type === 'fill_blank') return <><Field label="Text"><Textarea rows={3} value={card.text || ''} onChange={(event) => updateCard({ text: event.target.value })} /></Field><Field label="Correct answer"><Input value={String(card.correctAnswer || '')} onChange={(event) => updateCard({ correctAnswer: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={2} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  if (card.type === 'true_false') return <><Field label="Statement"><Textarea rows={3} value={card.statement || ''} onChange={(event) => updateCard({ statement: event.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(card.correctAnswer)} onChange={(event) => updateCard({ correctAnswer: event.target.checked })} /> Statement is true</label><Field label="Explanation"><Textarea rows={2} value={card.explanation || ''} onChange={(event) => updateCard({ explanation: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  if (card.type === 'equation') return <><Field label="Equation"><Input value={card.equation || ''} onChange={(event) => updateCard({ equation: event.target.value })} /></Field><Field label="Explanation"><Textarea rows={3} value={card.body || ''} onChange={(event) => updateCard({ body: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
  return <><Field label="Body"><Textarea rows={5} value={card.body || ''} onChange={(event) => updateCard({ body: event.target.value })} /></Field><ImageFields card={card} updateCard={updateCard} /></>;
}

function ImageFields({ card, updateCard }: { card: LessonCard; updateCard: (patch: Partial<LessonCard>) => void }) {
  function readImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => updateCard({ imageUrl: String(reader.result || '') });
    reader.readAsDataURL(file);
    event.target.value = '';
  }
  return <div className="rounded-xl border p-3 space-y-3"><p className="text-sm font-semibold">Optional card image</p><Input type="file" accept="image/*" onChange={readImage} />{card.imageUrl ? <img src={card.imageUrl} alt={card.imageAlt || 'Card image'} className="max-h-48 rounded-lg border object-contain" /> : null}<Field label="Image alt text"><Input value={card.imageAlt || ''} onChange={(event) => updateCard({ imageAlt: event.target.value })} /></Field><Field label="Image caption"><Input value={card.imageCaption || ''} onChange={(event) => updateCard({ imageCaption: event.target.value })} /></Field></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function cleanJson(raw: string) { return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim(); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `short-course-${Date.now()}`; }
function cardByType(type: CardType): LessonCard { if (type === 'question') return { type, title: 'Quick check', question: 'Question?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A', explanation: 'Explain why.' }; if (type === 'fill_blank') return { type, title: 'Fill in the blank', text: 'Complete this: ____', correctAnswer: 'answer', explanation: 'Explain why.' }; if (type === 'true_false') return { type, title: 'True or false', statement: 'This statement is true.', correctAnswer: true, explanation: 'Explain why.' }; if (type === 'summary') return { type, title: 'Summary', body: 'Summarize the lesson.' }; if (type === 'equation') return { type, title: 'Equation', equation: 'x^2', body: 'Explain the equation.' }; if (type === 'example') return { type, title: 'Example', body: 'Show one practical example.' }; return { type, title: 'Core idea', body: 'Explain one idea clearly.' }; }
function cardFromBlock(block: any): LessonCard { const type = String(block.type || 'explanation') as CardType; return { ...cardByType(type), ...block, type: ['explanation','example','question','fill_blank','true_false','summary','equation','table','graph'].includes(type) ? type : 'explanation' }; }
function buildBlueprint(form: FormState, lessons: VisualLesson[]): CourseBuilderBlueprint { return { courseSummary: { title: form.title || 'Untitled short course', audience: 'Short-course learners', level: form.level || 'beginner', description: form.description || 'Short-course draft.', prerequisites: [], totalDurationHours: Number(form.durationHours || 1), outcomes: lessons.flatMap((lesson) => lesson.outcomes).filter(Boolean).slice(0, 8), finalAssessment: 'Final practice assessment.', certificateCriteria: 'Complete lessons and pass the final assessment.' }, assessments: { quizzes: ['Generate easy, medium, hard and very hard practice questions.'], practicalWork: [], instructorReviewChecklist: ['Check content accuracy.', 'Check card images and captions.', 'Check quiz answers.'] }, modules: [{ title: form.title || 'Main module', description: form.description || 'Course module.', durationMinutes: Number(form.durationHours || 1) * 60, outcomes: lessons.flatMap((lesson) => lesson.outcomes).filter(Boolean), moduleAssessment: 'Module practice.', lessons: lessons.map((lesson) => ({ title: lesson.title, summary: lesson.summary, durationMinutes: lesson.durationMinutes, difficulty: lesson.difficulty, outcomes: lesson.outcomes, blocks: lesson.cards as any, subLessons: [], activities: lesson.activities, assessment: lesson.assessment })) }] }; }
function flattenLessons(blueprint: CourseBuilderBlueprint) { return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => ({ ...lesson, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex }))); }
function lessonPreview(lesson: VisualLesson) { return { id: 'preview', title: lesson.title, summary: lesson.summary, estimatedMinutes: lesson.durationMinutes, difficulty: lesson.difficulty, learningObjects: [{ id: 'preview-object', type: 'content', title: lesson.title, body: JSON.stringify({ blocks: lesson.cards }), payload: { blocks: lesson.cards } }] as any } as any; }
function normalizeAiBlueprint(blueprint: CourseBuilderBlueprint): CourseBuilderBlueprint { return { ...blueprint, modules: (blueprint.modules || []).map((module) => ({ ...module, lessons: (module.lessons || []).map((lesson) => ({ ...lesson, blocks: lesson.blocks?.length ? lesson.blocks : [defaultCard as any] })) })) }; }
function buildAiPrompt(seed: string, form: FormState, sourceText: string, names: string[]) { return `Create a short course in strict JSON only. Prompt: ${seed}\nTitle: ${form.title || 'Suggest a title'}\nLevel: ${form.level}\nHours: ${form.durationHours}\nDocuments: ${names.join(', ') || 'none'}\n${sourceText ? `Source text:\n${sourceText}` : ''}\nReturn shape: {"courseSummary":{"title":"","audience":"","level":"","description":"","prerequisites":[],"totalDurationHours":0,"outcomes":[],"finalAssessment":"","certificateCriteria":""},"assessments":{"quizzes":[],"practicalWork":[],"instructorReviewChecklist":[]},"modules":[{"title":"","description":"","durationMinutes":0,"outcomes":[],"moduleAssessment":"","lessons":[{"title":"","summary":"","durationMinutes":0,"difficulty":"","outcomes":[],"blocks":[{"type":"explanation","title":"","body":""}],"subLessons":[],"activities":[],"assessment":""}]}]}`; }
