'use client';

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createCourse, createShortCourseDraftWithBlueprint, generateAi, getAdminAcademicStructure, getCourses, getLessonsByCourse, getPrograms, getSchools } from '@/lib/api';
import type { CourseBuilderBlueprint, CourseBuilderLesson, CourseBuilderModule, CourseBuilderSelection, LessonCardBlock } from '@/lib/api/course-builder-types';
import type { AdminAcademicStructureResponse, Course, Lesson, Program, School } from '@/lib/api/types';

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

const interactiveTypes = new Set(['question', 'fill_blank', 'true_false']);
const teachingTypes = new Set(['explanation', 'example', 'summary']);

type AiRevision = {
  scope: 'course' | 'module' | 'lesson' | 'card';
  payload: unknown;
  raw: string;
};

export function ShortCoursesClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [structure, setStructure] = useState<AdminAcademicStructureResponse>(blankStructure);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiEditing, setAiEditing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);
  const [pendingRevision, setPendingRevision] = useState<AiRevision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiOutline, setAiOutline] = useState('');
  const [aiBlueprint, setAiBlueprint] = useState<CourseBuilderBlueprint | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiActionPrompt, setAiActionPrompt] = useState('');
  const [aiFailedFallback, setAiFailedFallback] = useState(false);
  const [sourceMode, setSourceMode] = useState<'new' | 'programme-course'>('new');
  const [programmeCourseId, setProgrammeCourseId] = useState('');
  const [selection, setSelection] = useState<CourseBuilderSelection>({ moduleIndex: 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
  const [showPreview, setShowPreview] = useState(false);
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

  const selectedModule = aiBlueprint?.modules[selection.moduleIndex] ?? null;
  const selectedParentLesson = selectedModule?.lessons[selection.lessonIndex] ?? null;
  const selectedLesson = selection.subLessonIndex != null
    ? selectedParentLesson?.subLessons?.[selection.subLessonIndex] ?? null
    : selectedParentLesson;
  const selectedCard = selectedLesson?.blocks[selection.cardIndex] ?? null;

  const derivedModules = aiBlueprint?.modules.length ?? 0;
  const derivedLessons = aiBlueprint?.modules.reduce((sum, module) => sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + 1 + (lesson.subLessons?.length ?? 0), 0), 0) ?? 0;
  const derivedOutcomes = aiBlueprint?.courseSummary.outcomes.length ?? 0;
  const derivedCardLessons = aiBlueprint?.modules.every((module) => module.lessons.every((lesson) => hasPlayableCards(lesson) && (lesson.subLessons ?? []).every(hasPlayableCards))) ?? false;
  const checklist = [
    { label: 'At least 1 module', done: derivedModules > 0 },
    { label: 'At least 1 lesson or sub-lesson', done: derivedLessons > 0 },
    { label: 'At least 1 learning outcome', done: derivedOutcomes > 0 },
    { label: 'Playable lesson cards', done: derivedCardLessons },
  ];
  const canPublish = checklist.every((item) => item.done);
  const interactionStats = selectedLesson ? countInteraction(selectedLesson.blocks) : null;

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

  const selectedProgrammeCourse = useMemo(() => structure.programmeCourses.find((course) => String(course.id) === programmeCourseId), [programmeCourseId, structure.programmeCourses]);
  const selectedProgram = selectedProgrammeCourse ? programs.find((program) => program.id === selectedProgrammeCourse.programId) : null;

  async function generateOutline() {
    const seed = aiPrompt || form.title || selectedProgrammeCourse?.moduleTitle || selectedProgrammeCourse?.courseTitle || selectedProgram?.title;
    if (!seed) return;
    setAiLoading(true);
    setError(null);
    setPendingRevision(null);
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
      const parsedBlueprint = normalizeBlueprint(parseCourseBuilderBlueprint(output));
      setAiOutline(output);
      setAiBlueprint(parsedBlueprint);
      setAiFailedFallback(false);
      setEditingCourseId(null);
      setSelection({ moduleIndex: 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
      setForm((value) => ({
        ...value,
        title: value.title || parsedBlueprint.courseSummary.title || deriveShortCourseTitle(seed),
        description: value.description || parsedBlueprint.courseSummary.description || output.slice(0, 700),
      }));
    } catch (cause) {
      setAiBlueprint(normalizeBlueprint(buildManualScaffold(seed, form.level, Number(form.durationHours) || 8)));
      setAiFailedFallback(true);
      setError(cause instanceof Error ? cause.message : 'AI generation failed.');
    } finally {
      setAiLoading(false);
    }
  }

  function startManualBuild() {
    const seed = aiPrompt || form.title || 'Manual short course draft';
    const blueprint = normalizeBlueprint(buildManualScaffold(seed, form.level, Number(form.durationHours) || 8));
    setAiBlueprint(blueprint);
    setAiFailedFallback(false);
    setPendingRevision(null);
    setEditingCourseId(null);
    setSelection({ moduleIndex: 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
    setForm((value) => ({ ...value, title: value.title || blueprint.courseSummary.title, description: value.description || blueprint.courseSummary.description }));
  }

  async function loadExistingCourse(course: Course) {
    setLoadingCourseId(course.id);
    setError(null);
    setPendingRevision(null);
    try {
      const lessons = await getLessonsByCourse(course.id);
      const blueprint = blueprintFromExistingCourse(course, lessons);
      setAiBlueprint(blueprint);
      setEditingCourseId(course.id);
      setAiFailedFallback(false);
      setAiOutline('');
      setForm((value) => ({
        ...value,
        title: course.title,
        description: course.description,
        schoolId: course.schoolId || value.schoolId,
        price: String(course.price ?? 0),
        currency: course.currency || 'ZMW',
        certificateFee: String(course.certificateFee ?? 0),
        certificateCurrency: course.certificateCurrency || 'ZMW',
        durationHours: String(course.durationHours ?? 8),
        level: course.level || 'beginner',
        status: (course.status === 'published' ? 'published' : 'draft'),
      }));
      setSelection({ moduleIndex: 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load existing course lessons.');
    } finally {
      setLoadingCourseId(null);
    }
  }

  function updateBlueprint(updater: (draft: CourseBuilderBlueprint) => CourseBuilderBlueprint) {
    setAiBlueprint((current) => current ? normalizeBlueprint(updater(structuredClone(current))) : current);
  }

  function updateSelectedLesson(patch: Partial<CourseBuilderLesson>) {
    updateBlueprint((draft) => {
      const lesson = getDraftSelectedLesson(draft, selection);
      if (lesson) Object.assign(lesson, patch);
      return draft;
    });
  }

  function updateSelectedCard(card: LessonCardBlock) {
    updateBlueprint((draft) => {
      const lesson = getDraftSelectedLesson(draft, selection);
      if (lesson?.blocks[selection.cardIndex]) lesson.blocks[selection.cardIndex] = card;
      return draft;
    });
  }

  function addModule() {
    updateBlueprint((draft) => {
      draft.modules.push({ title: `Module ${draft.modules.length + 1}`, description: 'Describe this module.', durationMinutes: 60, outcomes: ['Module outcome'], moduleAssessment: 'Module check.', lessons: [newLesson()] });
      return draft;
    });
    setSelection({ moduleIndex: aiBlueprint?.modules.length ?? 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
  }

  function addLesson() {
    updateBlueprint((draft) => {
      const module = draft.modules[selection.moduleIndex];
      module?.lessons.push(newLesson(`Lesson ${(module.lessons.length ?? 0) + 1}`));
      return draft;
    });
  }

  function addSubLesson() {
    updateBlueprint((draft) => {
      const lesson = draft.modules[selection.moduleIndex]?.lessons[selection.lessonIndex];
      if (!lesson) return draft;
      lesson.subLessons = lesson.subLessons ?? [];
      lesson.subLessons.push(newLesson(`Sub-lesson ${lesson.subLessons.length + 1}`));
      return draft;
    });
  }

  function deleteSelectedLesson() {
    updateBlueprint((draft) => {
      const module = draft.modules[selection.moduleIndex];
      if (!module) return draft;
      if (selection.subLessonIndex != null) {
        const parent = module.lessons[selection.lessonIndex];
        parent.subLessons = (parent.subLessons ?? []).filter((_, index) => index !== selection.subLessonIndex);
      } else if (module.lessons.length > 1) {
        module.lessons = module.lessons.filter((_, index) => index !== selection.lessonIndex);
      }
      return draft;
    });
    setSelection({ moduleIndex: Math.max(0, selection.moduleIndex), lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
  }

  function addCard(type: LessonCardBlock['type'] = 'explanation') {
    updateBlueprint((draft) => {
      const lesson = getDraftSelectedLesson(draft, selection);
      lesson?.blocks.push(newCard(type));
      return draft;
    });
  }

  function deleteCard(index: number) {
    updateBlueprint((draft) => {
      const lesson = getDraftSelectedLesson(draft, selection);
      if (lesson && lesson.blocks.length > 1) lesson.blocks = lesson.blocks.filter((_, cardIndex) => cardIndex !== index);
      return draft;
    });
    setSelection((value) => ({ ...value, cardIndex: Math.max(0, value.cardIndex - 1) }));
  }

  function moveCard(index: number, direction: -1 | 1) {
    updateBlueprint((draft) => {
      const lesson = getDraftSelectedLesson(draft, selection);
      if (!lesson) return draft;
      const target = index + direction;
      if (target < 0 || target >= lesson.blocks.length) return draft;
      [lesson.blocks[index], lesson.blocks[target]] = [lesson.blocks[target], lesson.blocks[index]];
      return draft;
    });
    setSelection((value) => ({ ...value, cardIndex: Math.max(0, value.cardIndex + direction) }));
  }

  async function askAiToImprove(scope: 'course' | 'module' | 'lesson' | 'card') {
    if (!aiBlueprint) return;
    setAiEditing(true);
    setError(null);
    try {
      const target = scope === 'course'
        ? aiBlueprint
        : scope === 'module'
          ? selectedModule
          : scope === 'lesson'
            ? selectedLesson
            : selectedCard;
      const response = await generateAi({
        mode: 'general',
        feature: 'admin_short_course_builder',
        audience: 'admin course builder',
        prompt: buildAiRevisionPrompt(scope, aiActionPrompt || defaultAiAction(scope), target),
      });
      const raw = String((response as Record<string, unknown>).text || '');
      const parsed = JSON.parse(cleanJson(raw));
      setPendingRevision({ scope, payload: parsed, raw });
      setAiActionPrompt('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI revision failed. Try a smaller change or edit manually.');
    } finally {
      setAiEditing(false);
    }
  }

  function acceptAiRevision() {
    if (!pendingRevision) return;
    applyAiRevision(pendingRevision.scope, pendingRevision.payload);
    setPendingRevision(null);
  }

  function rejectAiRevision() {
    setPendingRevision(null);
  }

  function applyAiRevision(scope: 'course' | 'module' | 'lesson' | 'card', payload: unknown) {
    updateBlueprint((draft) => {
      if (scope === 'course') return normalizeBlueprint(payload as CourseBuilderBlueprint);
      if (scope === 'module') draft.modules[selection.moduleIndex] = normalizeModule(payload as CourseBuilderModule, selection.moduleIndex);
      if (scope === 'lesson') {
        const current = getDraftSelectedLesson(draft, selection);
        if (current) Object.assign(current, normalizeLesson(payload as CourseBuilderLesson));
      }
      if (scope === 'card') {
        const lesson = getDraftSelectedLesson(draft, selection);
        if (lesson) lesson.blocks[selection.cardIndex] = normalizeCard(payload as LessonCardBlock);
      }
      return draft;
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const cleanId = editingCourseId || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `short-course-${Date.now()}`;
      const normalized = aiBlueprint ? normalizeBlueprint(aiBlueprint) : null;
      const lessons = normalized?.modules.flatMap((module, moduleIndex) => module.lessons.flatMap((lesson, lessonIndex) => {
        const parent = {
          ...lesson,
          moduleTitle: module.title,
          moduleIndex,
          sortOrder: moduleIndex * 100 + lessonIndex,
          blocks: flattenLessonBlocks(lesson),
        };
        const children = (lesson.subLessons ?? []).map((subLesson, subIndex) => ({
          ...subLesson,
          title: `${lesson.title}: ${subLesson.title}`,
          moduleTitle: module.title,
          moduleIndex,
          sortOrder: moduleIndex * 100 + lessonIndex * 10 + subIndex + 1,
          blocks: flattenLessonBlocks(subLesson),
        }));
        return [parent, ...children];
      })) ?? [];

      const coursePayload = {
        id: cleanId,
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
        modules: normalized?.modules.map((module) => ({ title: module.title, description: module.description })) ?? [],
        lessons,
        outcomes: normalized?.courseSummary.outcomes ?? [],
      };
      if (normalized) {
        await createShortCourseDraftWithBlueprint({
          course: coursePayload as any,
          blueprint: normalized as any,
          sourceMode,
          programmeTitle: selectedProgram?.title ?? null,
          programmeCourseTitle: selectedProgrammeCourse?.moduleTitle || selectedProgrammeCourse?.courseTitle || null,
        });
      } else {
        await createCourse(coursePayload as any);
      }
      await refresh();
      setForm((value) => ({ ...value, title: '', description: '' }));
      setAiOutline('');
      setAiBlueprint(null);
      setAiFailedFallback(false);
      setEditingCourseId(null);
      setPendingRevision(null);
      setSelection({ moduleIndex: 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
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
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Admin Course Builder Studio</p>
        <h1 className="text-3xl font-bold">Build short courses manually or with AI</h1>
        <p className="max-w-3xl text-muted-foreground">
          Generate a full course, edit every module, lesson, sub-lesson and card, ask AI for targeted changes, preview the student experience, then save as draft or publish.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}

      <form className="space-y-6" onSubmit={save}>
        <Card>
          <CardHeader><CardTitle>{editingCourseId ? `Editing ${editingCourseId}` : 'Course setup'}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Creation mode">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={sourceMode} onChange={(event) => setSourceMode(event.target.value as 'new' | 'programme-course')}>
                <option value="new">New short course</option>
                <option value="programme-course">Offer programme course as short course</option>
              </select>
            </Field>
            <Field label="Programme course">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={programmeCourseId} disabled={sourceMode !== 'programme-course'} onChange={(event) => {
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
              }}>
                <option value="">Select programme course</option>
                {structure.programmeCourses.map((course) => <option key={course.id} value={course.id}>{course.programTitle || course.programId} - {course.moduleTitle || course.courseTitle || `Course ${course.id}`}</option>)}
              </select>
            </Field>
            <Field label="Title"><Input required value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></Field>
            <Field label="School / Faculty">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>
                {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </Field>
            <div className="space-y-2 sm:col-span-2 xl:col-span-4">
              <Label>Description</Label>
              <Textarea required rows={4} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
            </div>
            <Field label="Entry fee"><Input type="number" min={0} value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} /></Field>
            <Field label="Currency"><Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} /></Field>
            <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
            <Field label="Duration hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.5fr_0.9fr]">
          <Card>
            <CardHeader><CardTitle>Course tree</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea rows={5} value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Describe the course AI should build, or leave this blank and build manually." />
              <div className="grid gap-2">
                <Button type="button" onClick={generateOutline} disabled={aiLoading || !(aiPrompt || form.title || programmeCourseId)}>{aiLoading ? 'Generating...' : 'Generate full course with AI'}</Button>
                <Button type="button" variant="secondary" onClick={startManualBuild}>Make full course manually</Button>
                <Button type="button" variant="outline" onClick={addModule} disabled={!aiBlueprint}>Add module</Button>
              </div>
              <div className="space-y-2 rounded-md border p-2 text-sm">
                {!aiBlueprint ? <p className="text-muted-foreground">Generate with AI or start manually to build the course tree.</p> : aiBlueprint.modules.map((module, moduleIndex) => (
                  <div key={`${module.title}-${moduleIndex}`} className="space-y-1">
                    <button type="button" className={`w-full rounded px-2 py-1 text-left font-medium ${selection.moduleIndex === moduleIndex ? 'bg-muted' : ''}`} onClick={() => setSelection({ moduleIndex, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 })}>{module.title}</button>
                    <div className="ml-3 space-y-1 border-l pl-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={`${lesson.title}-${lessonIndex}`}>
                          <button type="button" className={`w-full rounded px-2 py-1 text-left ${selection.moduleIndex === moduleIndex && selection.lessonIndex === lessonIndex && selection.subLessonIndex == null ? 'bg-primary/10 text-primary' : ''}`} onClick={() => setSelection({ moduleIndex, lessonIndex, subLessonIndex: null, cardIndex: 0 })}>{lesson.title}</button>
                          {(lesson.subLessons ?? []).map((subLesson, subLessonIndex) => (
                            <button key={`${subLesson.title}-${subLessonIndex}`} type="button" className={`ml-4 block w-[calc(100%-1rem)] rounded px-2 py-1 text-left text-xs ${selection.moduleIndex === moduleIndex && selection.lessonIndex === lessonIndex && selection.subLessonIndex === subLessonIndex ? 'bg-primary/10 text-primary' : ''}`} onClick={() => setSelection({ moduleIndex, lessonIndex, subLessonIndex, cardIndex: 0 })}>↳ {subLesson.title}</button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 rounded-md border p-3 text-sm">
                <p className="font-medium">Publish checklist</p>
                {checklist.map((item) => <p key={item.label} className={item.done ? 'text-green-600' : 'text-muted-foreground'}>{item.done ? '✓' : '•'} {item.label}</p>)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Selected lesson editor</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {!aiBlueprint || !selectedLesson ? <p className="text-sm text-muted-foreground">Select or create a lesson to edit it.</p> : (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Module title"><Input value={selectedModule?.title ?? ''} onChange={(event) => updateBlueprint((draft) => { draft.modules[selection.moduleIndex].title = event.target.value; return draft; })} /></Field>
                    <Field label="Module assessment"><Input value={selectedModule?.moduleAssessment ?? ''} onChange={(event) => updateBlueprint((draft) => { draft.modules[selection.moduleIndex].moduleAssessment = event.target.value; return draft; })} /></Field>
                    <div className="md:col-span-2"><Field label="Module description"><Textarea rows={2} value={selectedModule?.description ?? ''} onChange={(event) => updateBlueprint((draft) => { draft.modules[selection.moduleIndex].description = event.target.value; return draft; })} /></Field></div>
                    <Field label="Lesson title"><Input value={selectedLesson.title} onChange={(event) => updateSelectedLesson({ title: event.target.value })} /></Field>
                    <Field label="Difficulty"><Input value={selectedLesson.difficulty ?? ''} onChange={(event) => updateSelectedLesson({ difficulty: event.target.value })} /></Field>
                    <Field label="Duration minutes"><Input type="number" value={selectedLesson.durationMinutes} onChange={(event) => updateSelectedLesson({ durationMinutes: Number(event.target.value) })} /></Field>
                    <Field label="Assessment"><Input value={selectedLesson.assessment ?? ''} onChange={(event) => updateSelectedLesson({ assessment: event.target.value })} /></Field>
                    <div className="md:col-span-2"><Field label="Lesson summary"><Textarea rows={3} value={selectedLesson.summary} onChange={(event) => updateSelectedLesson({ summary: event.target.value })} /></Field></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={addLesson}>Add lesson</Button>
                    <Button type="button" variant="outline" onClick={addSubLesson}>Add sub-lesson</Button>
                    <Button type="button" variant="destructive" onClick={deleteSelectedLesson}>Delete selected lesson</Button>
                    <Button type="button" variant="secondary" onClick={() => setShowPreview((value) => !value)}>{showPreview ? 'Hide preview' : 'Preview as student'}</Button>
                  </div>
                  {interactionStats ? <p className="text-xs text-muted-foreground">Interaction guide: {interactionStats.interactive} interactive cards / {interactionStats.teaching} teaching cards. 25% is guidance, not a hard rule; add enough checks for clarity.</p> : null}
                  {showPreview ? <div className="rounded-xl border p-3"><LessonPlayer lesson={{ id: 'preview', title: selectedLesson.title, content: selectedLesson.summary, learningObjects: [{ id: 'preview-object', type: 'content', title: selectedLesson.title, payload: { blocks: selectedLesson.blocks }, version: 1, isCurrent: true, isReusable: false, reviewStatus: 'draft', publicationStatus: 'draft' }] }} courseTitle={form.title || 'Course preview'} onComplete={() => undefined} /></div> : null}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {(['explanation', 'example', 'question', 'fill_blank', 'true_false', 'summary'] as LessonCardBlock['type'][]).map((type) => <Button key={type} type="button" size="sm" variant="outline" onClick={() => addCard(type)}>Add {type}</Button>)}
                    </div>
                    <div className="grid gap-3">
                      {selectedLesson.blocks.map((card, cardIndex) => (
                        <div key={cardIndex} className={`rounded-lg border p-3 ${selection.cardIndex === cardIndex ? 'border-primary' : ''}`} onClick={() => setSelection((value) => ({ ...value, cardIndex }))}>
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">Card {cardIndex + 1}: {card.type}</p>
                            <div className="flex gap-1">
                              <Button type="button" size="sm" variant="ghost" onClick={() => moveCard(cardIndex, -1)}>↑</Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => moveCard(cardIndex, 1)}>↓</Button>
                              <Button type="button" size="sm" variant="destructive" onClick={() => deleteCard(cardIndex)}>Delete</Button>
                            </div>
                          </div>
                          <CardEditor card={card} onChange={updateSelectedCard} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>AI assistant actions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea rows={6} value={aiActionPrompt} onChange={(event) => setAiActionPrompt(event.target.value)} placeholder="Tell AI what to change. Example: make this lesson simpler, add local Zambian examples, add more checkpoint questions, split this lesson, improve this card..." />
              <div className="grid gap-2">
                <Button type="button" variant="outline" disabled={!aiBlueprint || aiEditing} onClick={() => askAiToImprove('course')}>Improve whole course</Button>
                <Button type="button" variant="outline" disabled={!selectedModule || aiEditing} onClick={() => askAiToImprove('module')}>Improve module</Button>
                <Button type="button" variant="outline" disabled={!selectedLesson || aiEditing} onClick={() => askAiToImprove('lesson')}>Improve lesson/sub-lesson</Button>
                <Button type="button" variant="outline" disabled={!selectedCard || aiEditing} onClick={() => askAiToImprove('card')}>Improve selected card</Button>
              </div>
              {pendingRevision ? (
                <div className="space-y-3 rounded-md border border-primary/40 bg-primary/5 p-3 text-xs">
                  <p className="font-medium text-foreground">AI proposed {pendingRevision.scope} change</p>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-background p-2">{pendingRevision.raw}</pre>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={acceptAiRevision}>Accept</Button>
                    <Button type="button" size="sm" variant="outline" onClick={rejectAiRevision}>Reject</Button>
                  </div>
                </div>
              ) : null}
              <div className="rounded-md border p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">AI interaction rule</p>
                <p>Interactive cards are recommended around 25% or more of the teaching-card count when useful. The AI may use more or fewer depending on difficulty, topic complexity and learner level.</p>
                <p className="mt-2">Sub-lessons are a builder experience for launch. On save they are flattened into normal lessons so the existing lesson viewer and progress engine work safely.</p>
              </div>
              <Field label="Status">
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.status} onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as 'draft' | 'published' }))}>
                  <option value="draft">Save as draft</option>
                  <option value="published">Publish now</option>
                </select>
              </Field>
              <Button className="w-full" disabled={saving || !form.schoolId || !aiBlueprint || (form.status === 'published' && !canPublish)}>{saving ? 'Saving...' : form.status === 'published' ? 'Publish course' : 'Save draft'}</Button>
              {aiFailedFallback ? <p className="text-xs text-amber-700">Manual scaffold is active. You can edit everything or ask AI to improve specific parts.</p> : null}
            </CardContent>
          </Card>
        </div>
      </form>

      <Card>
        <CardHeader><CardTitle>Existing short courses</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {courses.length ? courses.map((course) => (
            <div key={course.id} className="rounded-lg border p-4">
              <p className="font-semibold">{course.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
              <p className="mt-3 text-sm text-muted-foreground">{course.pricingType === 'free' ? 'Free' : `${course.currency || 'ZMW'} ${course.price ?? 0}`}</p>
              <Button type="button" className="mt-3" size="sm" variant="outline" disabled={loadingCourseId === course.id} onClick={() => loadExistingCourse(course)}>{loadingCourseId === course.id ? 'Loading...' : 'Edit in builder'}</Button>
            </div>
          )) : <p className="text-sm text-muted-foreground">No short courses yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function CardEditor({ card, onChange }: { card: LessonCardBlock; onChange: (card: LessonCardBlock) => void }) {
  if (card.type === 'question') return <div className="grid gap-2"><Textarea value={card.question} onChange={(e) => onChange({ ...card, question: e.target.value })} /><Input value={card.options.join(' | ')} onChange={(e) => onChange({ ...card, options: e.target.value.split('|').map((item) => item.trim()).filter(Boolean) })} /><Input value={card.correctAnswer} onChange={(e) => onChange({ ...card, correctAnswer: e.target.value })} /><Textarea value={card.explanation} onChange={(e) => onChange({ ...card, explanation: e.target.value })} /></div>;
  if (card.type === 'fill_blank') return <div className="grid gap-2"><Textarea value={card.text} onChange={(e) => onChange({ ...card, text: e.target.value })} /><Input value={card.correctAnswer} onChange={(e) => onChange({ ...card, correctAnswer: e.target.value })} /><Textarea value={card.explanation} onChange={(e) => onChange({ ...card, explanation: e.target.value })} /></div>;
  if (card.type === 'true_false') return <div className="grid gap-2"><Textarea value={card.statement} onChange={(e) => onChange({ ...card, statement: e.target.value })} /><select className="h-10 rounded-md border bg-background px-3 text-sm" value={String(card.correctAnswer)} onChange={(e) => onChange({ ...card, correctAnswer: e.target.value === 'true' })}><option value="true">True</option><option value="false">False</option></select><Textarea value={card.explanation} onChange={(e) => onChange({ ...card, explanation: e.target.value })} /></div>;
  if (card.type === 'example') return <div className="grid gap-2"><Input value={card.title} onChange={(e) => onChange({ ...card, title: e.target.value })} /><Textarea value={card.body} onChange={(e) => onChange({ ...card, body: e.target.value })} /><Textarea value={card.code ?? ''} onChange={(e) => onChange({ ...card, code: e.target.value })} placeholder="Optional code" /></div>;
  return <div className="grid gap-2"><Input value={'title' in card ? card.title ?? '' : ''} onChange={(e) => onChange({ ...card, title: e.target.value } as LessonCardBlock)} /><Textarea value={'body' in card ? card.body : ''} onChange={(e) => onChange({ ...card, body: e.target.value } as LessonCardBlock)} /></div>;
}

function deriveShortCourseTitle(seed: string) {
  const clean = seed.trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  if (clean.length <= 72) return clean[0].toUpperCase() + clean.slice(1);
  return `${clean.slice(0, 69).trim()}...`;
}

function buildProfessionalShortCoursePrompt(input: { userPrompt: string; title: string; description: string; level: string; durationHours: string; sourceMode: 'new' | 'programme-course'; programmeTitle?: string | null; programmeCourseTitle?: string | null; programmeRequirements?: string | null; credits?: number; deliveryMode?: string }) {
  return `You are UnivAI Institute's senior academic course architect and instructional designer.

Build a professional, human-review-ready short course that can be published into UnivAI's SoloLearn-style lesson viewer.

User idea: ${input.userPrompt}
Proposed title: ${input.title || 'Create the best professional title'}
Draft description: ${input.description || 'No useful description provided'}
Level: ${input.level || 'beginner'}
Intended duration: ${input.durationHours || '8'} hours
${input.sourceMode === 'programme-course' ? `Adapted from formal programme: ${input.programmeTitle || 'Unknown programme'} / ${input.programmeCourseTitle || 'Unknown course'}. Requirements/context: ${input.programmeRequirements || 'Not provided'}. Credits: ${input.credits ?? 'Not set'}. Delivery mode: ${input.deliveryMode || 'online'}. Do not claim transcript credit unless admin configures it later.` : ''}

Rules:
- Generate the full course with modules, lessons, optional subLessons inside lessons, and playable lesson cards.
- Admins can later edit manually, so make the structure clear and practical.
- No videos for launch.
- Allowed card types only: explanation, example, question, fill_blank, true_false, summary.
- AI decides how many lessons, sub-lessons and cards are needed.
- Add enough checkpoint questions to make learning interactive.
- Interactive cards are recommended around 25% or more of the teaching-card count when useful, but this is not mandatory. Use more for hard lessons and fewer for simple lessons if clear.
- Put questions between teaching cards, not only at the end.
- If a lesson becomes too long, use subLessons or split it into multiple lessons.
- Avoid fake accreditation, job promises, invented fees, invented dates, and unsupported official claims.

Return ONLY valid JSON, no markdown, no code fences.
Schema:
{
  "courseSummary": {"title":"string","audience":"string","level":"string","description":"string","prerequisites":["string"],"totalDurationHours":0,"outcomes":["string"],"finalAssessment":"string","certificateCriteria":"string"},
  "assessments": {"quizzes":["string"],"practicalWork":["string"],"instructorReviewChecklist":["string"]},
  "modules": [{"title":"string","description":"string","durationMinutes":0,"outcomes":["string"],"moduleAssessment":"string","lessons":[{"title":"string","summary":"string","durationMinutes":0,"difficulty":"beginner","outcomes":["string"],"blocks":[{"type":"explanation","title":"string","body":"string"},{"type":"example","title":"string","body":"string","code":"optional string"},{"type":"question","question":"string","options":["A","B","C","D"],"correctAnswer":"string","explanation":"string"},{"type":"fill_blank","text":"string with ____ blank","correctAnswer":"string","explanation":"string"},{"type":"true_false","statement":"string","correctAnswer":true,"explanation":"string"},{"type":"summary","body":"string"}],"subLessons":[{"title":"string","summary":"string","durationMinutes":0,"difficulty":"beginner","outcomes":["string"],"blocks":[],"activities":["string"],"assessment":"string"}],"activities":["string"],"assessment":"string"}]}]
}`;
}

function buildAiRevisionPrompt(scope: string, instruction: string, target: unknown) {
  return `You are improving one ${scope} inside the UnivAI Admin Course Builder Studio. Return ONLY valid JSON for the same ${scope}. No markdown. Preserve valid structure. No videos. Make the requested change only unless improvement requires small related edits. Interactive cards are recommended around 25% or more of teaching cards when useful, but not mandatory. Instruction: ${instruction}\n\nCurrent ${scope}:\n${JSON.stringify(target, null, 2)}`;
}

function parseCourseBuilderBlueprint(raw: string): CourseBuilderBlueprint {
  const parsed = JSON.parse(cleanJson(raw)) as CourseBuilderBlueprint;
  if (!parsed?.courseSummary?.title || !Array.isArray(parsed?.modules) || !parsed.modules.length) throw new Error('AI returned malformed course structure. Use manual fallback or regenerate.');
  if (!parsed.modules.every((module) => module.title && Array.isArray(module.lessons) && module.lessons.length > 0)) throw new Error('AI module/lesson structure is incomplete. Use manual fallback or repair manually.');
  return parsed;
}

function cleanJson(raw: string) { return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim(); }
function hasPlayableCards(lesson: CourseBuilderLesson) { return Array.isArray(lesson.blocks) && lesson.blocks.length >= 1; }
function countInteraction(blocks: LessonCardBlock[]) { return { teaching: blocks.filter((block) => teachingTypes.has(block.type)).length, interactive: blocks.filter((block) => interactiveTypes.has(block.type)).length }; }
function defaultAiAction(scope: string) { return scope === 'card' ? 'Improve this card and make it clearer.' : `Improve this ${scope}, add useful examples and enough checkpoint questions where helpful.`; }
function getDraftSelectedLesson(draft: CourseBuilderBlueprint, selection: CourseBuilderSelection): CourseBuilderLesson | null { const parent = draft.modules[selection.moduleIndex]?.lessons[selection.lessonIndex]; return selection.subLessonIndex != null ? parent?.subLessons?.[selection.subLessonIndex] ?? null : parent ?? null; }
function normalizeBlueprint(blueprint: CourseBuilderBlueprint): CourseBuilderBlueprint { return { ...blueprint, modules: (blueprint.modules ?? []).map(normalizeModule) }; }
function normalizeModule(module: CourseBuilderModule, index = 0): CourseBuilderModule { return { title: module.title || `Module ${index + 1}`, description: module.description || 'Describe this module.', durationMinutes: module.durationMinutes || 60, outcomes: module.outcomes ?? [], moduleAssessment: module.moduleAssessment || 'Module check.', lessons: (module.lessons ?? []).map(normalizeLesson) }; }
function normalizeLesson(lesson: CourseBuilderLesson): CourseBuilderLesson { return { title: lesson.title || 'Untitled lesson', summary: lesson.summary || 'Add lesson summary.', durationMinutes: lesson.durationMinutes || 30, difficulty: lesson.difficulty || 'beginner', outcomes: lesson.outcomes ?? [], blocks: (lesson.blocks?.length ? lesson.blocks : buildFallbackBlocks(lesson)).map(normalizeCard), subLessons: (lesson.subLessons ?? []).map(normalizeLesson), activities: lesson.activities ?? [], assessment: lesson.assessment || 'Lesson check.' }; }
function normalizeCard(card: LessonCardBlock): LessonCardBlock { return newCard(card.type, card); }
function newLesson(title = 'New lesson'): CourseBuilderLesson { return { title, summary: 'Add lesson summary.', durationMinutes: 30, difficulty: 'beginner', outcomes: ['Lesson outcome'], blocks: buildFallbackBlocks({ summary: 'Add lesson summary.' }), activities: ['Practice activity'], assessment: 'Lesson checkpoint.' }; }
function newCard(type: LessonCardBlock['type'], seed: Partial<LessonCardBlock> = {}): LessonCardBlock { if (type === 'question') return { type, question: (seed as any).question || 'What is the best answer?', options: (seed as any).options || ['A', 'B', 'C', 'D'], correctAnswer: (seed as any).correctAnswer || 'A', explanation: (seed as any).explanation || 'Explain why this is correct.' }; if (type === 'fill_blank') return { type, text: (seed as any).text || 'Fill the blank: ____', correctAnswer: (seed as any).correctAnswer || 'answer', explanation: (seed as any).explanation || 'Explain the answer.' }; if (type === 'true_false') return { type, statement: (seed as any).statement || 'This statement is true.', correctAnswer: Boolean((seed as any).correctAnswer ?? true), explanation: (seed as any).explanation || 'Explain why.' }; if (type === 'example') return { type, title: (seed as any).title || 'Example', body: (seed as any).body || 'Add a practical example.', code: (seed as any).code || '' }; if (type === 'summary') return { type, title: (seed as any).title || 'Summary', body: (seed as any).body || 'Summarize the lesson.' }; return { type: 'explanation', title: (seed as any).title || 'Core idea', body: (seed as any).body || 'Explain one idea clearly.' }; }
function flattenLessonBlocks(lesson: CourseBuilderLesson): LessonCardBlock[] { return lesson.blocks?.length ? lesson.blocks : buildFallbackBlocks(lesson); }
function buildFallbackBlocks(lesson: Partial<CourseBuilderLesson>): LessonCardBlock[] { return [{ type: 'explanation', title: 'Core idea', body: lesson.summary || 'This lesson introduces the main idea.' }, { type: 'example', title: 'Simple example', body: 'Connect this concept to a practical situation before moving on.' }, { type: 'question', question: 'What should you do after learning a new concept?', options: ['Skip practice', 'Connect it to an example', 'Ignore feedback', 'Memorize blindly'], correctAnswer: 'Connect it to an example', explanation: 'Examples help turn a concept into understanding.' }, { type: 'summary', body: lesson.assessment || 'You have completed the main idea for this lesson.' }]; }
function buildManualScaffold(seed: string, level: string, durationHours: number): CourseBuilderBlueprint { const title = deriveShortCourseTitle(seed) || 'New short course draft'; return { courseSummary: { title, audience: 'General learners', level: level || 'beginner', description: 'Manual scaffold. Update all fields before publishing.', prerequisites: ['No prior experience required'], totalDurationHours: durationHours, outcomes: ['Outcome 1 (edit)', 'Outcome 2 (edit)'], finalAssessment: 'Final assessment pending.', certificateCriteria: 'Certificate criteria pending review.' }, assessments: { quizzes: ['Quiz 1 (edit)'], practicalWork: ['Practical activity 1 (edit)'], instructorReviewChecklist: ['Review module outcomes', 'Review lesson quality'] }, modules: [{ title: 'Module 1 (edit)', description: 'Describe module intent.', durationMinutes: Math.max(60, Math.round((durationHours * 60) / 2)), outcomes: ['Module outcome 1 (edit)'], moduleAssessment: 'Module assessment pending.', lessons: [newLesson('Lesson 1 (edit)')] }] }; }
function buildShortCourseDescription(input: { description: string; aiOutline: string; sourceMode: 'new' | 'programme-course'; programmeTitle?: string | null; programmeCourseTitle?: string | null }) { const sourceNote = input.sourceMode === 'programme-course' ? `\n\nThis short course is adapted from ${input.programmeCourseTitle || 'a formal programme course'}${input.programmeTitle ? ` in ${input.programmeTitle}` : ''}. It is offered as a standalone short course and does not automatically award programme transcript credit.` : ''; const reviewNote = '\n\nUnivAI academic note: AI-generated course content is a draft and must be human-reviewed before publishing.'; return `${input.description || input.aiOutline.slice(0, 900)}${sourceNote}${reviewNote}`; }
function blueprintFromExistingCourse(course: Course, lessons: Lesson[]): CourseBuilderBlueprint { return normalizeBlueprint({ courseSummary: { title: course.title, audience: 'Existing learners', level: course.level || 'beginner', description: course.description, prerequisites: ['Review existing course requirements'], totalDurationHours: Number(course.durationHours ?? 0), outcomes: course.outcomes ?? ['Review and add outcomes'], finalAssessment: 'Review final assessment.', certificateCriteria: 'Review certificate criteria.' }, assessments: { quizzes: [], practicalWork: [], instructorReviewChecklist: ['Review imported course content', 'Confirm every lesson has playable cards'] }, modules: [{ title: 'Existing course content', description: 'Imported lessons from the saved course.', durationMinutes: 0, outcomes: course.outcomes ?? [], moduleAssessment: 'Review module assessment.', lessons: lessons.map((lesson, index) => lessonFromApiLesson(lesson, index)) }] }); }
function lessonFromApiLesson(lesson: Lesson, index: number): CourseBuilderLesson { const objectBlocks = lesson.learningObjects?.flatMap((object) => Array.isArray(object.payload?.blocks) ? object.payload.blocks as LessonCardBlock[] : []) ?? []; return normalizeLesson({ title: lesson.title || `Lesson ${index + 1}`, summary: lesson.content || lesson.exercise || 'Imported lesson.', durationMinutes: 30, difficulty: 'beginner', outcomes: [], blocks: objectBlocks.length ? objectBlocks : buildFallbackBlocks({ summary: lesson.content || 'Imported lesson.' }), activities: [], assessment: lesson.exercise || 'Review lesson assessment.' }); }
