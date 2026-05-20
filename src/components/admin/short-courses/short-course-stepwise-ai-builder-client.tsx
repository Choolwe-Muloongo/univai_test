'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { LessonPlayer } from '@/components/learning/lesson-player';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getCourses, getLessonsByCourse, getSchools } from '@/lib/api';
import type { AiBuilderAction, CourseBuilderBlueprint, CourseBuilderLesson, CourseBuilderSelection, CourseDocumentChunk, CourseSourceDocument, LessonCardBlock } from '@/lib/api/course-builder-types';
import { generateShortCourseContent } from '@/lib/api/short-course-generation';
import type { Course, School } from '@/lib/api/types';
import { applyAiGeneratedPatch, buildAiGenerationRequest, chunkSourceDocument, courseAndLessonsToBuilderBlueprint, getSelectedLesson, type AiBuilderGeneratedPatch } from '@/lib/short-course-ai-builder-engine';
import { extractDocumentText, type DocumentExtractionProgress } from '@/lib/document-text-extractor';

type BuilderStep = 'source' | 'plan' | 'modules' | 'lessons' | 'cards' | 'questions' | 'preview' | 'validate' | 'save';

type FormState = {
  title: string;
  description: string;
  schoolId: string;
  durationHours: string;
  level: string;
  price: string;
  currency: string;
  certificateFee: string;
  certificateCurrency: string;
};

const steps: Array<{ id: BuilderStep; label: string }> = [
  { id: 'source', label: '1. Source' },
  { id: 'plan', label: '2. Course Plan' },
  { id: 'modules', label: '3. Modules' },
  { id: 'lessons', label: '4. Lessons' },
  { id: 'cards', label: '5. Cards' },
  { id: 'questions', label: '6. Questions' },
  { id: 'preview', label: '7. Preview' },
  { id: 'validate', label: '8. Validate' },
  { id: 'save', label: '9. Save Draft' },
];

const blankBlueprint: CourseBuilderBlueprint = {
  courseSummary: {
    title: 'Untitled short course',
    audience: 'Short-course learners',
    level: 'beginner',
    description: 'Build this course step by step.',
    prerequisites: [],
    totalDurationHours: 8,
    outcomes: ['Complete the course outcomes.'],
    finalAssessment: 'Final assessment.',
    certificateCriteria: 'Complete the required lessons and pass the final assessment.',
  },
  assessments: {
    quizzes: [],
    practicalWork: [],
    instructorReviewChecklist: [],
  },
  modules: [],
  documents: [],
};

export function ShortCourseStepwiseAiBuilderClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [existingLessonCount, setExistingLessonCount] = useState(0);
  const [activeStep, setActiveStep] = useState<BuilderStep>('source');
  const [blueprint, setBlueprint] = useState<CourseBuilderBlueprint>(blankBlueprint);
  const [selection, setSelection] = useState<CourseBuilderSelection>({ moduleIndex: 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState('5');
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);
  const [generating, setGenerating] = useState<AiBuilderAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<DocumentExtractionProgress | null>(null);
  const [rawPatch, setRawPatch] = useState('');
  const [validationReport, setValidationReport] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ title: '', description: '', schoolId: '', durationHours: '8', level: 'beginner', price: '0', currency: 'ZMW', certificateFee: '0', certificateCurrency: 'ZMW' });

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), getCourses()])
      .then(([schoolData, courseData]) => {
        if (!mounted) return;
        setSchools(schoolData);
        setCourses(courseData);
        if (schoolData[0]) setForm((value) => ({ ...value, schoolId: schoolData[0].id }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load builder data.'))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  const chunks = useMemo(() => blueprint.documents?.flatMap((document) => document.chunks ?? []) ?? [], [blueprint.documents]);
  const selectedChunks = useMemo(() => chunks.filter((chunk) => selectedChunkIds.includes(chunk.id)), [chunks, selectedChunkIds]);
  const selectedModule = blueprint.modules[selection.moduleIndex] ?? null;
  const selectedParentLesson = selectedModule?.lessons[selection.lessonIndex] ?? null;
  const selectedLesson = getSelectedLesson(blueprint, selection);
  const selectedCard = selectedLesson?.blocks[selection.cardIndex] ?? null;

  async function readDocuments(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setReading(true);
    setError(null);
    setMessage(null);
    setExtractionProgress(null);
    try {
      const docs: CourseSourceDocument[] = [];
      for (const file of files) {
        const result = await extractDocumentText(file, { onProgress: setExtractionProgress });
        const id = slugify(`${file.name}-${Date.now()}-${docs.length}`);
        docs.push(chunkSourceDocument({ id, name: file.name, mode: result.mode, text: result.text.slice(0, 120000), warning: result.warning }));
      }
      setBlueprint((current) => normalizeBlueprint({ ...current, documents: [...(current.documents ?? []), ...docs] }));
      setMessage(`${docs.length} document(s) added and chunked for controlled generation.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read documents.');
    } finally {
      setReading(false);
      setExtractionProgress(null);
      event.target.value = '';
    }
  }

  async function selectExistingCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setMessage(null);
    setError(null);
    setRawPatch('');
    if (!courseId) {
      setExistingLessonCount(0);
      setBlueprint(blankBlueprint);
      setSelection({ moduleIndex: 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
      return;
    }
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;
    setForm((value) => ({
      ...value,
      title: course.title ?? '',
      description: course.description ?? '',
      schoolId: course.schoolId || value.schoolId,
      durationHours: String(course.durationHours ?? 8),
      level: course.level ?? 'beginner',
      price: String(course.price ?? 0),
      currency: course.currency ?? 'ZMW',
      certificateFee: String(course.certificateFee ?? 0),
      certificateCurrency: course.certificateCurrency ?? 'ZMW',
    }));
    try {
      const lessons = await getLessonsByCourse(courseId);
      const importedBlueprint = normalizeBlueprint(courseAndLessonsToBuilderBlueprint(course, lessons));
      setBlueprint(importedBlueprint);
      setSelection({ moduleIndex: 0, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 });
      setExistingLessonCount(lessons.length);
      setMessage(`Existing course imported into the AI builder with ${importedBlueprint.modules.length} module(s) and ${lessons.length} lesson(s). Imported lesson structure may need review, so check module placement before generating new content.`);
    } catch (cause) {
      setExistingLessonCount(0);
      setBlueprint(normalizeBlueprint(courseAndLessonsToBuilderBlueprint(course, [])));
      setMessage(cause instanceof Error ? `Existing course basics loaded, but lessons could not be imported: ${cause.message}` : 'Existing course basics loaded, but lessons could not be imported.');
    }
  }

  async function runAction(action: AiBuilderAction, instruction?: string) {
    setGenerating(action);
    setError(null);
    setMessage(null);
    setValidationReport([]);
    try {
      const aiInstruction = instruction || prompt || defaultInstruction(action);
      const request = buildAiGenerationRequest({
        action,
        currentBlueprint: blueprint,
        selection,
        selectedDocumentChunks: selectedChunks,
        count: Number(count) || undefined,
        difficulty: form.level || blueprint.courseSummary.level,
        instruction: aiInstruction,
      });
      const response = await generateShortCourseContent({
        action,
        builderRequest: request,
        mode: 'general',
        feature: 'admin_short_course_stepwise_builder',
        audience: 'short-course learners',
        brandContext: 'UnivAI Institute uses one shared course blueprint for manual and AI-assisted course building.',
        prompt: aiInstruction,
      });
      const raw = String(response.text || response.output || response.content || JSON.stringify(response));
      const patch = parsePatch(raw);
      setRawPatch(JSON.stringify(patch, null, 2));
      if (action === 'validate_course' || action === 'suggest_improvements') {
        setValidationReport([...(patch.issues ?? []), ...(patch.suggestions ?? [])]);
        setMessage(action === 'validate_course' ? 'Validation completed. Review the report before saving.' : 'Suggestions generated. Review before applying manually.');
        return;
      }
      setBlueprint((current) => normalizeBlueprint(applyAiGeneratedPatch(current, selection, action, patch)));
      setMessage(successMessage(action));
      syncFormFromBlueprint(patch);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI action failed.');
    } finally {
      setGenerating(null);
    }
  }

  function syncFormFromBlueprint(patch: AiBuilderGeneratedPatch) {
    if (!patch.courseSummary) return;
    setForm((value) => ({
      ...value,
      title: value.title || patch.courseSummary?.title || '',
      description: value.description || patch.courseSummary?.description || '',
      durationHours: String(patch.courseSummary?.totalDurationHours || value.durationHours),
      level: patch.courseSummary?.level || value.level,
    }));
  }

  async function saveDraft() {
    const finalBlueprint = normalizeBlueprint({
      ...blueprint,
      courseSummary: {
        ...blueprint.courseSummary,
        title: form.title || blueprint.courseSummary.title,
        description: form.description || blueprint.courseSummary.description,
        totalDurationHours: Number(form.durationHours || blueprint.courseSummary.totalDurationHours || 1),
        level: form.level || blueprint.courseSummary.level,
      },
    });
    if (!finalBlueprint.modules.length) { setError('Add or generate at least one module before saving.'); return; }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const courseTitle = form.title || finalBlueprint.courseSummary.title;
      const courseId = selectedCourseId || slugify(courseTitle || `short-course-${Date.now()}`);
      await createShortCourseDraftWithBlueprint({
        course: {
          id: courseId,
          title: courseTitle,
          description: form.description || finalBlueprint.courseSummary.description,
          schoolId: form.schoolId,
          imageId: 'short-course',
          pricingType: Number(form.price) > 0 ? 'paid' : 'free',
          price: Number(form.price),
          currency: form.currency,
          certificateFee: Number(form.certificateFee),
          certificateCurrency: form.certificateCurrency,
          durationHours: Number(form.durationHours || finalBlueprint.courseSummary.totalDurationHours || 1),
          level: form.level || finalBlueprint.courseSummary.level || 'beginner',
          status: 'draft',
          modules: finalBlueprint.modules.map((module) => ({ title: module.title, description: module.description })),
          lessons: flattenLessons(finalBlueprint),
          outcomes: finalBlueprint.courseSummary.outcomes ?? [],
        } as any,
        blueprint: finalBlueprint as any,
        sourceMode: finalBlueprint.documents?.length ? 'document' as any : selectedCourseId ? 'existing-course' as any : 'new',
        programmeTitle: selectedCourseId ? `Existing course: ${selectedCourseId}` : null,
        programmeCourseTitle: finalBlueprint.documents?.map((doc) => doc.name).join(', ') || null,
      });
      setCourses(await getCourses());
      setBlueprint(finalBlueprint);
      setMessage('Draft saved. Review & Publish remains the final gate before learners see it.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  }

  function addManualModule() {
    setBlueprint((current) => normalizeBlueprint({
      ...current,
      modules: [...current.modules, { title: `Module ${current.modules.length + 1}`, description: 'Describe this module.', durationMinutes: 60, outcomes: ['Module outcome'], moduleAssessment: 'Module review.', lessons: [] }],
    }));
  }

  function addManualLesson() {
    setBlueprint((current) => {
      const draft = structuredClone(current);
      const module = draft.modules[selection.moduleIndex];
      if (!module) return current;
      module.lessons.push(newLesson(`Lesson ${module.lessons.length + 1}`));
      return normalizeBlueprint(draft);
    });
  }

  function updateBlueprintJson(value: string) {
    setRawPatch(value);
    try {
      const parsed = JSON.parse(value) as CourseBuilderBlueprint;
      if (parsed.courseSummary && Array.isArray(parsed.modules)) setBlueprint(normalizeBlueprint(parsed));
    } catch {
      // Keep editing raw JSON until valid.
    }
  }

  const previewLesson = selectedLesson ? lessonToPlayable(selectedLesson) : null;

  if (loading) return <PageLoading message="Loading step-by-step AI builder..." />;

  return (
    <div className="space-y-6">
      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-xl border bg-muted/40 p-4 text-sm">{message}</div> : null}
      {extractionProgress ? <ProgressNotice progress={extractionProgress} /> : null}

      <div className="flex flex-wrap gap-2">
        {steps.map((step) => (
          <button key={step.id} type="button" onClick={() => setActiveStep(step.id)} className={`rounded-full border px-3 py-2 text-xs transition ${activeStep === step.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/60'}`}>{step.label}</button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="h-fit rounded-2xl">
          <CardHeader><CardTitle>Course control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Start from">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedCourseId} onChange={(event) => void selectExistingCourse(event.target.value)}>
                <option value="">New draft</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title} ({course.status ?? 'draft'})</option>)}
              </select>
              {selectedCourseId ? <p className="text-xs text-muted-foreground">Existing lesson count: {existingLessonCount}</p> : null}
            </Field>
            <Field label="Course title"><Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></Field>
            <Field label="Description"><Textarea rows={3} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Level"><Input value={form.level} onChange={(event) => setForm((value) => ({ ...value, level: event.target.value }))} /></Field>
              <Field label="Hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
              <Field label="Entry fee"><Input type="number" min={0} value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} /></Field>
              <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
            </div>
            <Field label="School"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field>
            <Field label="AI instruction"><Textarea rows={5} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: Generate beginner-friendly HTML lessons for the selected module using only chunks 2 and 3." /></Field>
            <Field label="Generate count"><Input type="number" min={1} max={12} value={count} onChange={(event) => setCount(event.target.value)} /></Field>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {activeStep === 'source' ? <SourceStep reading={reading} chunks={chunks} selectedChunkIds={selectedChunkIds} setSelectedChunkIds={setSelectedChunkIds} onReadDocuments={readDocuments} onDocumentMap={() => void runAction('document_map')} generating={generating} /> : null}
          {activeStep === 'plan' ? <ActionStep title="Course plan" description="Generate only the high-level course plan, then edit it before moving on." primaryLabel="Generate course plan" action="course_plan" generating={generating} onRun={runAction} /> : null}
          {activeStep === 'modules' ? <ModulesStep blueprint={blueprint} onAddManual={addManualModule} selection={selection} setSelection={setSelection} generating={generating} onRun={runAction} /> : null}
          {activeStep === 'lessons' ? <LessonsStep module={selectedModule} lesson={selectedParentLesson} selection={selection} setSelection={setSelection} onAddManual={addManualLesson} generating={generating} onRun={runAction} /> : null}
          {activeStep === 'cards' ? <CardsStep lesson={selectedLesson} selectedCard={selectedCard} selection={selection} setSelection={setSelection} generating={generating} onRun={runAction} /> : null}
          {activeStep === 'questions' ? <ActionStep title="Questions" description="Generate checkpoint cards for the selected lesson only." primaryLabel="Generate questions" action="generate_questions" generating={generating} onRun={runAction} /> : null}
          {activeStep === 'preview' ? <PreviewStep lesson={previewLesson} /> : null}
          {activeStep === 'validate' ? <ValidateStep report={validationReport} generating={generating} onRun={runAction} /> : null}
          {activeStep === 'save' ? <SaveStep blueprint={blueprint} saving={saving} onSave={saveDraft} /> : null}

          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Editable blueprint JSON</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea className="font-mono text-xs" rows={18} value={rawPatch || JSON.stringify(blueprint, null, 2)} onChange={(event) => updateBlueprintJson(event.target.value)} />
              <p className="text-xs text-muted-foreground">This is still the same CourseBuilderBlueprint used by the manual builder, preview, draft saving, review, and publish flow.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SourceStep({ reading, chunks, selectedChunkIds, setSelectedChunkIds, onReadDocuments, onDocumentMap, generating }: { reading: boolean; chunks: CourseDocumentChunk[]; selectedChunkIds: string[]; setSelectedChunkIds: (ids: string[]) => void; onReadDocuments: (event: ChangeEvent<HTMLInputElement>) => void; onDocumentMap: () => void; generating: AiBuilderAction | null }) {
  return <Card className="rounded-2xl"><CardHeader><CardTitle>Source setup</CardTitle></CardHeader><CardContent className="space-y-4"><Input type="file" multiple accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={onReadDocuments} disabled={reading} /><p className="text-sm text-muted-foreground">Upload documents, then select only the chunks the AI should use for the next action.</p><div className="grid gap-2 md:grid-cols-2">{chunks.map((chunk) => <label key={chunk.id} className="flex gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={selectedChunkIds.includes(chunk.id)} onChange={(event) => setSelectedChunkIds(event.target.checked ? [...selectedChunkIds, chunk.id] : selectedChunkIds.filter((id) => id !== chunk.id))} /><span><strong>{chunk.title ?? chunk.id}</strong><br /><span className="text-xs text-muted-foreground line-clamp-3">{chunk.text}</span></span></label>)}</div><Button type="button" onClick={onDocumentMap} disabled={generating === 'document_map'}>{generating === 'document_map' ? 'Mapping...' : 'Ask AI to map document outline'}</Button></CardContent></Card>;
}

function ActionStep({ title, description, primaryLabel, action, generating, onRun }: { title: string; description: string; primaryLabel: string; action: AiBuilderAction; generating: AiBuilderAction | null; onRun: (action: AiBuilderAction) => void }) {
  return <Card className="rounded-2xl"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{description}</p><Button type="button" onClick={() => onRun(action)} disabled={generating === action}>{generating === action ? 'Generating...' : primaryLabel}</Button></CardContent></Card>;
}

function ModulesStep({ blueprint, selection, setSelection, onAddManual, generating, onRun }: { blueprint: CourseBuilderBlueprint; selection: CourseBuilderSelection; setSelection: (selection: CourseBuilderSelection) => void; onAddManual: () => void; generating: AiBuilderAction | null; onRun: (action: AiBuilderAction) => void }) {
  return <Card className="rounded-2xl"><CardHeader><CardTitle>Modules</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2"><Button onClick={() => onRun('generate_modules')} disabled={generating === 'generate_modules'}>{generating === 'generate_modules' ? 'Generating...' : 'Generate modules'}</Button><Button variant="outline" onClick={onAddManual}>Add module manually</Button></div><div className="grid gap-2">{blueprint.modules.map((module, index) => <button type="button" key={`${module.title}-${index}`} onClick={() => setSelection({ moduleIndex: index, lessonIndex: 0, subLessonIndex: null, cardIndex: 0 })} className={`rounded-xl border p-3 text-left text-sm ${selection.moduleIndex === index ? 'border-primary bg-primary/5' : ''}`}><p className="font-medium">{index + 1}. {module.title}</p><p className="text-muted-foreground">{module.description}</p></button>)}</div></CardContent></Card>;
}

function LessonsStep({ module, lesson, selection, setSelection, onAddManual, generating, onRun }: { module: CourseBuilderBlueprint['modules'][number] | null; lesson: CourseBuilderLesson | null; selection: CourseBuilderSelection; setSelection: (selection: CourseBuilderSelection) => void; onAddManual: () => void; generating: AiBuilderAction | null; onRun: (action: AiBuilderAction) => void }) {
  if (!module) return <Card><CardContent className="p-4 text-sm text-muted-foreground">Select or create a module first.</CardContent></Card>;
  return <Card className="rounded-2xl"><CardHeader><CardTitle>Lessons and sub-lessons for {module.title}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2"><Button onClick={() => onRun('generate_lessons')} disabled={generating === 'generate_lessons'}>Generate lessons</Button><Button onClick={() => onRun('generate_sub_lessons')} disabled={!lesson || generating === 'generate_sub_lessons'} variant="outline">Generate sub-lessons</Button><Button variant="outline" onClick={onAddManual}>Add lesson manually</Button></div><div className="grid gap-2">{module.lessons.map((item, index) => <button type="button" key={`${item.title}-${index}`} onClick={() => setSelection({ moduleIndex: selection.moduleIndex, lessonIndex: index, subLessonIndex: null, cardIndex: 0 })} className={`rounded-xl border p-3 text-left text-sm ${selection.lessonIndex === index && selection.subLessonIndex == null ? 'border-primary bg-primary/5' : ''}`}><p className="font-medium">{index + 1}. {item.title}</p><p className="text-muted-foreground">{item.summary}</p>{item.subLessons?.length ? <p className="mt-1 text-xs text-muted-foreground">Sub-lessons: {item.subLessons.map((sub) => sub.title).join(', ')}</p> : null}</button>)}</div></CardContent></Card>;
}

function CardsStep({ lesson, selectedCard, selection, setSelection, generating, onRun }: { lesson: CourseBuilderLesson | null; selectedCard: LessonCardBlock | null; selection: CourseBuilderSelection; setSelection: (selection: CourseBuilderSelection) => void; generating: AiBuilderAction | null; onRun: (action: AiBuilderAction) => void }) {
  if (!lesson) return <Card><CardContent className="p-4 text-sm text-muted-foreground">Select or create a lesson first.</CardContent></Card>;
  return <Card className="rounded-2xl"><CardHeader><CardTitle>Card studio for {lesson.title}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2"><Button onClick={() => onRun('generate_cards')} disabled={generating === 'generate_cards'}>Generate cards</Button><Button variant="outline" onClick={() => onRun('generate_single_card')} disabled={generating === 'generate_single_card'}>Add one card</Button><Button variant="outline" onClick={() => onRun('generate_code_card')} disabled={generating === 'generate_code_card'}>Generate coding card</Button><Button variant="outline" onClick={() => onRun('repair_card')} disabled={!selectedCard || generating === 'repair_card'}>Repair selected card</Button></div><div className="grid gap-2 md:grid-cols-2">{lesson.blocks.map((block, index) => <button type="button" key={`${block.type}-${index}`} onClick={() => setSelection({ ...selection, cardIndex: index })} className={`rounded-xl border p-3 text-left text-sm ${selection.cardIndex === index ? 'border-primary bg-primary/5' : ''}`}><p className="font-medium">{index + 1}. {block.type.replace(/_/g, ' ')}</p><p className="text-xs text-muted-foreground">{'title' in block ? block.title : 'Lesson card'}</p></button>)}</div></CardContent></Card>;
}

function PreviewStep({ lesson }: { lesson: ReturnType<typeof lessonToPlayable> | null }) {
  return <Card className="rounded-2xl"><CardHeader><CardTitle>Preview</CardTitle></CardHeader><CardContent>{lesson ? <LessonPlayer lesson={lesson as any} courseTitle="Draft preview" completeLabel="Preview complete" /> : <p className="text-sm text-muted-foreground">Select a lesson with cards to preview.</p>}</CardContent></Card>;
}

function ValidateStep({ report, generating, onRun }: { report: string[]; generating: AiBuilderAction | null; onRun: (action: AiBuilderAction) => void }) {
  return <Card className="rounded-2xl"><CardHeader><CardTitle>Validate course</CardTitle></CardHeader><CardContent className="space-y-4"><Button onClick={() => onRun('validate_course')} disabled={generating === 'validate_course'}>{generating === 'validate_course' ? 'Checking...' : 'Validate course'}</Button>{report.length ? <ul className="grid gap-2 text-sm text-muted-foreground">{report.map((item, index) => <li key={`${item}-${index}`} className="rounded-xl border p-3">{item}</li>)}</ul> : <p className="text-sm text-muted-foreground">Validation checks will appear here.</p>}</CardContent></Card>;
}

function SaveStep({ blueprint, saving, onSave }: { blueprint: CourseBuilderBlueprint; saving: boolean; onSave: () => void }) {
  const lessonCount = blueprint.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  return <Card className="rounded-2xl"><CardHeader><CardTitle>Save draft</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Current draft: {blueprint.modules.length} module(s), {lessonCount} lesson(s). Publishing still happens from Review & Publish.</p><Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save draft for review'}</Button></CardContent></Card>;
}

function ProgressNotice({ progress }: { progress: DocumentExtractionProgress }) {
  return <div className="rounded-xl border bg-primary/5 p-4 text-sm"><div className="mb-2 flex items-center justify-between gap-3"><span>{progress.message}</span><span className="font-medium">{progress.percent ?? 0}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(1, progress.percent ?? 1)}%` }} /></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }

function parsePatch(raw: string): AiBuilderGeneratedPatch {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned) as AiBuilderGeneratedPatch;
  } catch {
    const objectStart = cleaned.indexOf('{');
    const objectEnd = cleaned.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
      return JSON.parse(cleaned.slice(objectStart, objectEnd + 1)) as AiBuilderGeneratedPatch;
    }
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      const parsedArray = JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1));
      return { payload: parsedArray } as AiBuilderGeneratedPatch;
    }
    throw new Error('AI returned content that could not be parsed as JSON. Regenerate or ask the AI to return strict JSON only.');
  }
}

function normalizeBlueprint(blueprint: CourseBuilderBlueprint): CourseBuilderBlueprint {
  const summary = blueprint.courseSummary ?? blankBlueprint.courseSummary;
  return {
    courseSummary: {
      title: summary.title || 'Untitled short course',
      audience: summary.audience || 'Short-course learners',
      level: summary.level || 'beginner',
      description: summary.description || 'Short-course draft.',
      prerequisites: summary.prerequisites ?? [],
      totalDurationHours: Number(summary.totalDurationHours || 1),
      outcomes: summary.outcomes?.length ? summary.outcomes : ['Complete the course outcomes.'],
      finalAssessment: summary.finalAssessment || 'Final assessment.',
      certificateCriteria: summary.certificateCriteria || 'Complete lessons and pass the final assessment.',
      targetLearner: summary.targetLearner,
      assessmentApproach: summary.assessmentApproach,
      projectIdea: summary.projectIdea,
    },
    assessments: blueprint.assessments ?? blankBlueprint.assessments,
    modules: (blueprint.modules ?? []).map((module, moduleIndex) => ({
      title: module.title || `Module ${moduleIndex + 1}`,
      description: module.description || 'Module description.',
      durationMinutes: Number(module.durationMinutes || 60),
      outcomes: module.outcomes ?? [],
      moduleAssessment: module.moduleAssessment || 'Module assessment.',
      sourceChunkIds: module.sourceChunkIds ?? [],
      lessons: (module.lessons ?? []).map((lesson, lessonIndex) => ({
        title: lesson.title || `Lesson ${lessonIndex + 1}`,
        summary: lesson.summary || 'Lesson summary.',
        durationMinutes: Number(lesson.durationMinutes || 20),
        difficulty: lesson.difficulty || 'beginner',
        outcomes: lesson.outcomes ?? [],
        blocks: lesson.blocks?.length ? lesson.blocks : [{ type: 'explanation', title: 'Core idea', body: 'Explain the lesson clearly.' } as LessonCardBlock],
        subLessons: lesson.subLessons ?? [],
        activities: lesson.activities ?? [],
        assessment: lesson.assessment || 'Lesson check.',
        sourceChunkIds: lesson.sourceChunkIds ?? [],
      })),
    })),
    documents: blueprint.documents ?? [],
  };
}

function newLesson(title: string): CourseBuilderLesson {
  return { title, summary: 'Describe this lesson.', durationMinutes: 20, difficulty: 'beginner', outcomes: ['Lesson outcome'], blocks: [{ type: 'explanation', title: 'Core idea', body: 'Write the lesson content here.' }], subLessons: [], activities: [], assessment: 'Lesson checkpoint.' };
}

function lessonToPlayable(lesson: CourseBuilderLesson) {
  return { title: lesson.title, summary: lesson.summary, estimatedMinutes: lesson.durationMinutes, difficulty: lesson.difficulty, content: JSON.stringify({ blocks: lesson.blocks, subLessons: lesson.subLessons }) };
}

function flattenLessons(blueprint: CourseBuilderBlueprint) {
  return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.flatMap((lesson, lessonIndex) => [
    { ...lesson, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex },
    ...(lesson.subLessons ?? []).map((subLesson, subIndex) => ({ ...subLesson, title: `${lesson.title}: ${subLesson.title}`, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex * 10 + subIndex + 1 })),
  ]));
}

function defaultInstruction(action: AiBuilderAction) {
  const labels: Record<AiBuilderAction, string> = {
    document_map: 'Map the selected document chunks into outline, topics, difficulty, and missing parts.',
    course_plan: 'Generate the high-level course plan only.',
    generate_modules: 'Generate modules only.',
    generate_lessons: 'Generate lessons for the selected module only.',
    generate_sub_lessons: 'Generate sub-lessons for the selected lesson only.',
    generate_cards: 'Generate teaching cards for the selected lesson only.',
    generate_single_card: 'Generate one useful teaching card for the selected lesson.',
    repair_card: 'Repair the selected card while preserving its intent.',
    generate_questions: 'Generate checkpoint question cards for the selected lesson only.',
    generate_code_card: 'Generate one complete first-class coding card for the selected lesson.',
    validate_course: 'Validate the current draft and list issues.',
    suggest_improvements: 'Suggest improvements for the current draft.',
  };
  return labels[action];
}

function successMessage(action: AiBuilderAction) {
  return `${defaultInstruction(action)} Done. Review, edit, then continue.`;
}

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `short-course-${Date.now()}`; }
