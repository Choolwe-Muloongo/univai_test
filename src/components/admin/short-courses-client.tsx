'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createCourse, createShortCourseDraftWithBlueprint, generateAi, getAdminAcademicStructure, getCourses, getPrograms, getSchools } from '@/lib/api';
import type { AdminAcademicStructureResponse, AiShortCourseBlueprint, Course, Program, School } from '@/lib/api/types';

const blankStructure: AdminAcademicStructureResponse = {
  departments: [],
  academicYears: [],
  semesters: [],
  programmeCourses: [],
  courseUnits: [],
  learningModeRules: [],
  venues: [],
  partnerInstitutions: [],
  practicalSessions: [],
};

type LessonCardBlock =
  | { type: 'explanation'; title: string; body: string }
  | { type: 'example'; title: string; body: string; code?: string | null }
  | { type: 'question'; title?: string; question: string; options: string[]; correctAnswer: string; explanation: string }
  | { type: 'fill_blank'; title?: string; text: string; correctAnswer: string; explanation: string }
  | { type: 'true_false'; title?: string; statement: string; correctAnswer: boolean; explanation: string }
  | { type: 'summary'; title?: string; body: string };

type CardLesson = {
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty?: string;
  outcomes: string[];
  blocks: LessonCardBlock[];
  activities: string[];
  assessment: string;
};

export function ShortCoursesClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [structure, setStructure] = useState<AdminAcademicStructureResponse>(blankStructure);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiOutline, setAiOutline] = useState('');
  const [aiBlueprint, setAiBlueprint] = useState<AiShortCourseBlueprint | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiFailedFallback, setAiFailedFallback] = useState(false);
  const [sourceMode, setSourceMode] = useState<'new' | 'programme-course'>('new');
  const [programmeCourseId, setProgrammeCourseId] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    schoolId: '',
    price: '0',
    currency: 'ZMW',
    certificateFee: '0',
    certificateCurrency: 'ZMW',
    durationHours: '8',
    level: 'beginner',
    status: 'draft' as 'draft' | 'published',
  });
  const derivedModules = aiBlueprint?.modules.length ?? 0;
  const derivedLessons = aiBlueprint?.modules.reduce((sum, module) => sum + module.lessons.length, 0) ?? 0;
  const derivedOutcomes = aiBlueprint?.courseSummary.outcomes.length ?? 0;
  const derivedCardLessons = aiBlueprint?.modules.every((module) => module.lessons.every((lesson) => Array.isArray((lesson as CardLesson).blocks) && (lesson as CardLesson).blocks.length >= 3)) ?? false;
  const checklist = [
    { label: 'At least 1 module', done: derivedModules > 0 },
    { label: 'At least 1 lesson', done: derivedLessons > 0 },
    { label: 'At least 1 learning outcome', done: derivedOutcomes > 0 },
    { label: 'Playable lesson cards', done: derivedCardLessons },
  ];
  const canPublish = checklist.every((item) => item.done);

  async function refresh() {
    const [schoolData, courseData, programData, structureData] = await Promise.all([
      getSchools(),
      getCourses(),
      getPrograms(),
      getAdminAcademicStructure(),
    ]);
    setSchools(schoolData);
    setCourses(courseData);
    setPrograms(programData);
    setStructure(structureData);
    if (!form.schoolId && schoolData[0]) setForm((value) => ({ ...value, schoolId: schoolData[0].id }));
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Short course operations are unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function generateOutline() {
    const selectedProgrammeCourse = structure.programmeCourses.find((course) => String(course.id) === programmeCourseId);
    const selectedProgram = selectedProgrammeCourse
      ? programs.find((program) => program.id === selectedProgrammeCourse.programId)
      : null;
    const seed = aiPrompt || form.title || selectedProgrammeCourse?.moduleTitle || selectedProgrammeCourse?.courseTitle || selectedProgram?.title;
    if (!seed) return;
    setAiLoading(true);
    setError(null);
    try {
      const response = await generateAi({
        prompt: buildProfessionalShortCoursePrompt({
          userPrompt: seed,
          title: form.title,
          description: form.description,
          level: form.level,
          durationHours: form.durationHours,
          sourceMode,
          programmeTitle: selectedProgram?.title,
          programmeCourseTitle: selectedProgrammeCourse?.moduleTitle || selectedProgrammeCourse?.courseTitle || null,
          programmeRequirements: selectedProgram?.admissionRequirements || null,
          credits: selectedProgrammeCourse?.credits,
          deliveryMode: selectedProgrammeCourse?.deliveryMode,
        }),
        feature: 'admin_short_course_builder',
        mode: 'general',
        audience: 'short-course learners',
        brandContext: 'UnivAI uses AI-powered learning, human-reviewed academic content and instructor/lecturer supervision.',
      });
      const generated = response as Record<string, unknown>;
      const output = String(generated.text || generated.output || generated.content || JSON.stringify(response));
      const parsedBlueprint = parseAiShortCourseBlueprint(output);
      setAiOutline(output);
      setAiBlueprint(parsedBlueprint);
      setAiFailedFallback(false);
      setForm((value) => ({
        ...value,
        title: value.title || parsedBlueprint.courseSummary.title || deriveShortCourseTitle(seed),
        description: value.description || parsedBlueprint.courseSummary.description || output.slice(0, 700),
      }));
    } catch (cause) {
      setAiBlueprint(buildManualScaffold(seed, form.level, Number(form.durationHours) || 8));
      setAiFailedFallback(true);
      setError(cause instanceof Error ? cause.message : 'AI generation failed.');
    } finally {
      setAiLoading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const selectedProgrammeCourse = structure.programmeCourses.find((course) => String(course.id) === programmeCourseId);
      const selectedProgram = selectedProgrammeCourse
        ? programs.find((program) => program.id === selectedProgrammeCourse.programId)
        : null;
      const cleanId = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const lessons = aiBlueprint?.modules.flatMap((module, moduleIndex) => module.lessons.map((lesson, lessonIndex) => {
        const cardLesson = lesson as CardLesson;
        return {
          ...lesson,
          moduleTitle: module.title,
          moduleIndex,
          sortOrder: moduleIndex * 100 + lessonIndex,
          blocks: cardLesson.blocks?.length ? cardLesson.blocks : buildFallbackBlocks(cardLesson),
        };
      })) ?? [];

      const coursePayload = {
        id: cleanId || `short-course-${Date.now()}`,
        title: form.title,
        description: buildShortCourseDescription({
          description: form.description,
          aiOutline,
          sourceMode,
          programmeTitle: selectedProgram?.title,
          programmeCourseTitle: selectedProgrammeCourse?.moduleTitle || selectedProgrammeCourse?.courseTitle || null,
        }),
        schoolId: form.schoolId,
        imageId: 'short-course',
        pricingType: Number(form.price) > 0 ? 'paid' : 'free',
        price: Number(form.price),
        currency: form.currency,
        certificateFee: Number(form.certificateFee),
        certificateCurrency: form.certificateCurrency,
        durationHours: Number(form.durationHours),
        level: form.level,
        status: form.status,
        modules: aiBlueprint?.modules.map((module) => ({ title: module.title, description: module.description })) ?? [],
        lessons,
        outcomes: aiBlueprint?.courseSummary.outcomes ?? [],
      };
      if (aiBlueprint) {
        await createShortCourseDraftWithBlueprint({
          course: coursePayload,
          blueprint: {
            ...aiBlueprint,
            modules: aiBlueprint.modules.map((module) => ({
              ...module,
              lessons: module.lessons.map((lesson) => ({
                ...lesson,
                blocks: (lesson as CardLesson).blocks?.length ? (lesson as CardLesson).blocks : buildFallbackBlocks(lesson as CardLesson),
              })),
            })),
          } as AiShortCourseBlueprint,
          sourceMode,
          programmeTitle: selectedProgram?.title ?? null,
          programmeCourseTitle: selectedProgrammeCourse?.moduleTitle || selectedProgrammeCourse?.courseTitle || null,
        });
      } else {
        await createCourse(coursePayload);
      }
      await refresh();
      setForm((value) => ({ ...value, title: '', description: '' }));
      setAiOutline('');
      setAiBlueprint(null);
      setAiFailedFallback(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create short course.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading short courses..." />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Short Courses</p>
        <h1 className="text-3xl font-bold">Course catalogue and AI builder</h1>
        <p className="max-w-3xl text-muted-foreground">
          Create practical short courses, set entry/certificate fees and use AI to build playable SoloLearn-style lesson cards before human review.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create Short Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={save}>
              <Field label="Creation mode">
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={sourceMode}
                  onChange={(event) => setSourceMode(event.target.value as 'new' | 'programme-course')}
                >
                  <option value="new">New short course</option>
                  <option value="programme-course">Offer programme course as short course</option>
                </select>
              </Field>
              <Field label="Programme course">
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={programmeCourseId}
                  onChange={(event) => {
                    const value = event.target.value;
                    const selected = structure.programmeCourses.find((course) => String(course.id) === value);
                    setProgrammeCourseId(value);
                    if (selected) {
                      setForm((current) => ({
                        ...current,
                        title: current.title || selected.moduleTitle || selected.courseTitle || `${selected.programTitle} Short Course`,
                        description: current.description || `A standalone short course adapted from ${selected.programTitle || 'a UnivAI programme'} for professional learners.`,
                        durationHours: current.durationHours || '8',
                        level: current.level || 'intermediate',
                      }));
                    }
                  }}
                  disabled={sourceMode !== 'programme-course'}
                >
                  <option value="">Select a programme course</option>
                  {structure.programmeCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.programTitle || course.programId} - {course.moduleTitle || course.courseTitle || `Course ${course.id}`}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title"><Input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></Field>
              <Field label="School / Faculty">
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>
                  {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                </select>
              </Field>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea required rows={6} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>AI course brief</Label>
                <Textarea
                  rows={5}
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="A rough idea is enough. Example: create a 19-hour beginner digital marketing course with interactive lessons."
                />
                <p className="text-xs text-muted-foreground">
                  UnivAI will expand vague prompts into a professional course with modules, playable lesson cards, questions between cards, assessment and certificate criteria.
                </p>
              </div>
              <Field label="Entry fee"><Input type="number" min={0} value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} /></Field>
              <Field label="Currency"><Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} /></Field>
              <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
              <Field label="Duration hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
              <Field label="Status">
                <select className="h-10 rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as 'draft' | 'published' }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Publish now</option>
                </select>
              </Field>
              <div className="space-y-2 rounded-md border p-3 text-sm sm:col-span-2">
                <p className="font-medium">Publish checklist</p>
                {checklist.map((item) => <p key={item.label} className={item.done ? 'text-green-600' : 'text-muted-foreground'}>{item.done ? '✓' : '•'} {item.label}</p>)}
                {!canPublish && form.status === 'published' ? <p className="text-xs text-destructive">Generate/edit the AI outline so it includes playable lessons before publishing.</p> : null}
              </div>
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={generateOutline} disabled={aiLoading || !(aiPrompt || form.title || programmeCourseId)}>{aiLoading ? 'Generating...' : 'Generate professional course with AI'}</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const seed = aiPrompt || form.title || 'Manual short course draft';
                    setAiBlueprint(buildManualScaffold(seed, form.level, Number(form.durationHours) || 8));
                    setAiFailedFallback(true);
                  }}
                >
                  Continue manually
                </Button>
                <Button disabled={saving || !form.schoolId || (form.status === 'published' && !canPublish)}>{saving ? 'Saving...' : form.status === 'published' ? 'Create as live' : 'Save draft'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Draft Output</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">
              {aiOutline || 'AI-generated course outlines appear here. They remain drafts until reviewed.'}
            </p>
            {aiBlueprint ? <pre className="mt-4 overflow-auto rounded border bg-muted p-3 text-xs">{JSON.stringify(aiBlueprint, null, 2)}</pre> : null}
            {aiFailedFallback ? <p className="mt-3 text-xs text-amber-700">AI failed or output was malformed. Manual scaffold has playable lesson cards so admin can continue editing.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Published Catalogue Data</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.length ? courses.map((course) => (
            <div key={course.id} className="rounded-lg border p-4">
              <p className="font-semibold">{course.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
              <p className="mt-3 text-sm text-muted-foreground">{course.pricingType === 'free' ? 'Free' : `${course.currency || 'ZMW'} ${course.price ?? 0}`}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No short courses yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function deriveShortCourseTitle(seed: string) {
  const clean = seed.trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  if (clean.length <= 72) return clean[0].toUpperCase() + clean.slice(1);
  return `${clean.slice(0, 69).trim()}...`;
}

function buildProfessionalShortCoursePrompt(input: {
  userPrompt: string;
  title: string;
  description: string;
  level: string;
  durationHours: string;
  sourceMode: 'new' | 'programme-course';
  programmeTitle?: string | null;
  programmeCourseTitle?: string | null;
  programmeRequirements?: string | null;
  credits?: number;
  deliveryMode?: string;
}) {
  return `
You are UnivAI Institute's senior academic course architect and instructional designer.

Task:
Turn the user's rough or vague idea into a professional, human-review-ready short course that can be published into UnivAI's SoloLearn-style lesson viewer.

User idea:
${input.userPrompt}

Admin draft fields:
- Proposed title: ${input.title || 'Create the best professional title'}
- Draft description: ${input.description || 'No useful description provided'}
- Level: ${input.level || 'beginner'}
- Intended duration: ${input.durationHours || '8'} hours

${input.sourceMode === 'programme-course' ? `
This short course is being adapted from a formal UnivAI programme course.
- Programme: ${input.programmeTitle || 'Unknown programme'}
- Programme course/module: ${input.programmeCourseTitle || 'Unknown course'}
- Programme admission requirements/context: ${input.programmeRequirements || 'Not provided'}
- Credits: ${input.credits ?? 'Not set'}
- Delivery mode: ${input.deliveryMode || 'online'}

Adapt it as a standalone short course without weakening academic quality. Do not claim it awards transcript credit unless admin explicitly configures that later.
` : ''}

Course requirements:
1. Infer the learner audience even if the prompt is vague.
2. Produce a polished market-ready title.
3. Write a concise course description.
4. Define 5-8 measurable learning outcomes.
5. Create a module-by-module outline with lessons.
6. Build realistic lesson counts for the requested duration.
7. Keep the course self-paced by default.
8. Include practical activities, quizzes, final assessment, pass criteria, and certificate eligibility.
9. Keep official content human-reviewed and lecturer/instructor supervised.
10. Avoid hype, fake accreditation claims, and promises of jobs.

Lesson-card rules:
- No videos for now.
- Every lesson must include playable blocks.
- Allowed block types only: explanation, example, question, fill_blank, true_false, summary.
- AI must decide the number of cards per lesson.
- Simple lesson: 6-10 cards.
- Normal lesson: 10-18 cards.
- Complex lesson: 18-30 cards.
- If a lesson needs more than 30 cards, split it into multiple lessons.
- Put questions between teaching cards, not only at the end.
- Add a checkpoint after every 2-3 explanation/example cards.
- At least 25% of cards must be interactive question/fill_blank/true_false cards.
- No more than 3 teaching cards in a row without a question.
- Each card teaches one idea only.

Return ONLY valid JSON. Do not use markdown. Do not wrap JSON in code fences.

Strict schema:
{
  "courseSummary": {
    "title": "string",
    "audience": "string",
    "level": "string",
    "description": "string",
    "prerequisites": ["string"],
    "totalDurationHours": 0,
    "outcomes": ["string"],
    "finalAssessment": "string",
    "certificateCriteria": "string"
  },
  "assessments": {
    "quizzes": ["string"],
    "practicalWork": ["string"],
    "instructorReviewChecklist": ["string"]
  },
  "modules": [
    {
      "title": "string",
      "description": "string",
      "durationMinutes": 0,
      "outcomes": ["string"],
      "moduleAssessment": "string",
      "lessons": [
        {
          "title": "string",
          "summary": "string",
          "durationMinutes": 0,
          "difficulty": "beginner",
          "outcomes": ["string"],
          "blocks": [
            { "type": "explanation", "title": "string", "body": "string" },
            { "type": "example", "title": "string", "body": "string", "code": "optional string" },
            { "type": "question", "question": "string", "options": ["A", "B", "C", "D"], "correctAnswer": "string", "explanation": "string" },
            { "type": "fill_blank", "text": "string with ____ blank", "correctAnswer": "string", "explanation": "string" },
            { "type": "true_false", "statement": "string", "correctAnswer": true, "explanation": "string" },
            { "type": "summary", "body": "string" }
          ],
          "activities": ["string"],
          "assessment": "string"
        }
      ]
    }
  ]
}
`.trim();
}

function parseAiShortCourseBlueprint(raw: string): AiShortCourseBlueprint {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned non-JSON output. Use manual fallback or regenerate.');
  }
  const candidate = parsed as AiShortCourseBlueprint;
  if (!candidate?.courseSummary?.title || !Array.isArray(candidate?.modules) || !candidate.modules.length) {
    throw new Error('AI returned malformed course structure. Use manual fallback or regenerate.');
  }
  if (!candidate.modules.every((module) => module.title && Array.isArray(module.lessons) && module.lessons.length > 0)) {
    throw new Error('AI module/lesson structure is incomplete. Use manual fallback or repair manually.');
  }
  if (!candidate.modules.every((module) => module.lessons.every((lesson) => Array.isArray((lesson as CardLesson).blocks) && (lesson as CardLesson).blocks.length >= 3))) {
    throw new Error('AI returned lessons without playable cards. Use manual fallback or regenerate.');
  }
  return candidate;
}

function buildFallbackBlocks(lesson: Partial<CardLesson>): LessonCardBlock[] {
  return [
    { type: 'explanation', title: 'Core idea', body: lesson.summary || 'This lesson introduces the main idea.' },
    { type: 'example', title: 'Simple example', body: 'Connect this concept to a practical situation before moving on.' },
    { type: 'question', question: 'What should you do after learning a new concept?', options: ['Skip practice', 'Connect it to an example', 'Ignore feedback', 'Memorize blindly'], correctAnswer: 'Connect it to an example', explanation: 'Examples help turn a concept into understanding.' },
    { type: 'summary', body: lesson.assessment || 'You have completed the main idea for this lesson.' },
  ];
}

function buildManualScaffold(seed: string, level: string, durationHours: number): AiShortCourseBlueprint {
  const title = deriveShortCourseTitle(seed) || 'New short course draft';
  const lesson: CardLesson = {
    title: 'Lesson 1 (edit)',
    summary: 'Add lesson summary.',
    durationMinutes: 45,
    difficulty: level || 'beginner',
    outcomes: ['Lesson outcome 1 (edit)'],
    blocks: buildFallbackBlocks({ summary: 'Add lesson summary.', assessment: 'Lesson check pending.' }),
    activities: ['Activity 1 (edit)'],
    assessment: 'Lesson check pending.',
  };
  return {
    courseSummary: {
      title,
      audience: 'General learners',
      level: level || 'beginner',
      description: 'Manual scaffold created after AI generation failure. Update all fields before publishing.',
      prerequisites: ['No prior experience required'],
      totalDurationHours: durationHours,
      outcomes: ['Outcome 1 (edit)', 'Outcome 2 (edit)'],
      finalAssessment: 'Final assessment pending instructor design.',
      certificateCriteria: 'Certificate criteria pending instructor review.',
    },
    assessments: {
      quizzes: ['Quiz 1 (edit)'],
      practicalWork: ['Practical activity 1 (edit)'],
      instructorReviewChecklist: ['Review module outcomes', 'Review lesson quality'],
    },
    modules: [{
      title: 'Module 1 (edit)',
      description: 'Describe module intent.',
      durationMinutes: Math.max(60, Math.round((durationHours * 60) / 2)),
      outcomes: ['Module outcome 1 (edit)'],
      moduleAssessment: 'Module assessment pending.',
      lessons: [lesson as any],
    }],
  };
}

function buildShortCourseDescription(input: {
  description: string;
  aiOutline: string;
  sourceMode: 'new' | 'programme-course';
  programmeTitle?: string | null;
  programmeCourseTitle?: string | null;
}) {
  const sourceNote = input.sourceMode === 'programme-course'
    ? `\n\nThis short course is adapted from ${input.programmeCourseTitle || 'a formal programme course'}${input.programmeTitle ? ` in ${input.programmeTitle}` : ''}. It is offered as a standalone short course and does not automatically award programme transcript credit.`
    : '';

  const reviewNote = '\n\nUnivAI academic note: AI-generated course content is a draft and must be human-reviewed before publishing.';
  return `${input.description || input.aiOutline.slice(0, 900)}${sourceNote}${reviewNote}`;
}
