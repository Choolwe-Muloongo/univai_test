'use client';

import Link from 'next/link';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createShortCourseDraftWithBlueprint, getCourses, getLessonsByCourse, getSchools } from '@/lib/api';
import { generateShortCourseContent } from '@/lib/api/short-course-generation';
import type { CourseBuilderBlueprint } from '@/lib/api/course-builder-types';
import type { Course, School } from '@/lib/api/types';
import { extractDocumentText, type DocumentExtractionProgress } from '@/lib/document-text-extractor';

type SourceDoc = { name: string; mode: string; text: string; warning?: string };
type FormState = { title: string; description: string; schoolId: string; durationHours: string; level: string; price: string; currency: string; certificateFee: string; certificateCurrency: string };

export function ShortCourseAiBuilderV2Client() {
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [existingLessonCount, setExistingLessonCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<DocumentExtractionProgress | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [documents, setDocuments] = useState<SourceDoc[]>([]);
  const [blueprintText, setBlueprintText] = useState('');
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

  const sourceText = useMemo(() => documents.map((doc, index) => `DOCUMENT ${index + 1}: ${doc.name}\nTYPE: ${doc.mode.toUpperCase()}\n${doc.text}`).join('\n\n---\n\n').slice(0, 180000), [documents]);
  const parsedBlueprint = useMemo(() => {
    if (!blueprintText.trim()) return null;
    try { return normalizeBlueprint(JSON.parse(cleanJson(blueprintText)) as CourseBuilderBlueprint); } catch { return null; }
  }, [blueprintText]);

  async function selectExistingCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setMessage(null);
    setError(null);
    if (!courseId) {
      setExistingLessonCount(0);
      setForm((value) => ({ ...value, title: '', description: '', durationHours: '8', level: 'beginner', price: '0', certificateFee: '0' }));
      return;
    }
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;
    setForm({
      title: course.title ?? '',
      description: course.description ?? '',
      schoolId: course.schoolId || schools[0]?.id || '',
      durationHours: String(course.durationHours ?? 8),
      level: course.level ?? 'beginner',
      price: String(course.price ?? 0),
      currency: course.currency ?? 'ZMW',
      certificateFee: String(course.certificateFee ?? 0),
      certificateCurrency: course.certificateCurrency ?? 'ZMW',
    });
    try {
      const lessons = await getLessonsByCourse(courseId);
      setExistingLessonCount(lessons.length);
      setMessage(lessons.length ? `Loaded existing course with ${lessons.length} lesson(s). AI updates will save back to this course ID.` : 'Loaded existing course. No lessons found, so this is ready for AI content generation.');
    } catch {
      setExistingLessonCount(0);
      setMessage('Loaded existing course. Lesson count could not be checked, but you can still regenerate content.');
    }
  }

  async function readDocuments(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setReading(true); setError(null); setMessage(null); setExtractionProgress(null);
    try {
      const extracted: SourceDoc[] = [];
      for (const file of files) {
        const result = await extractDocumentText(file, { onProgress: setExtractionProgress });
        extracted.push({ name: file.name, mode: result.mode, text: result.text.slice(0, 60000), warning: result.warning });
      }
      setDocuments((current) => [...current, ...extracted]);
      setMessage(`${extracted.length} document(s) loaded. The AI will combine them as one course source.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to read documents.');
    } finally {
      setReading(false);
      setExtractionProgress(null);
      event.target.value = '';
    }
  }

  async function generateCourse() {
    const seed = prompt.trim() || form.title.trim() || 'Create a complete short course from the attached documents.';
    if (!seed && !sourceText.trim()) { setError('Add a course prompt or upload at least one readable document.'); return; }
    setGenerating(true); setError(null); setMessage(null);
    try {
      const response = await generateShortCourseContent({
        mode: 'general',
        feature: 'admin_short_course_builder_multi_document',
        audience: 'short-course learners',
        brandContext: 'UnivAI Institute builds human-reviewed short courses from one or many source documents. Existing courses may be regenerated and must return to draft/review before publishing.',
        prompt: buildPrompt(seed, form, sourceText, documents.map((doc) => doc.name), selectedCourseId, existingLessonCount),
      });
      const raw = String((response as Record<string, unknown>).text || (response as Record<string, unknown>).output || (response as Record<string, unknown>).content || JSON.stringify(response));
      const blueprint = normalizeBlueprint(JSON.parse(cleanJson(raw)) as CourseBuilderBlueprint);
      setBlueprintText(JSON.stringify(blueprint, null, 2));
      setForm((value) => ({ ...value, title: value.title || blueprint.courseSummary.title, description: value.description || blueprint.courseSummary.description, durationHours: String(blueprint.courseSummary.totalDurationHours || value.durationHours), level: blueprint.courseSummary.level || value.level }));
      setMessage(selectedCourseId ? 'Updated content draft generated for the selected course. Review the blueprint, then save it back to that course.' : 'Course draft generated. Review the blueprint, then save it as a new draft.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    if (!parsedBlueprint) { setError('Blueprint is not valid JSON yet.'); return; }
    if (!parsedBlueprint.modules.length) { setError('Blueprint needs at least one module.'); return; }
    setSaving(true); setError(null); setMessage(null);
    try {
      const courseTitle = form.title || parsedBlueprint.courseSummary.title;
      const courseId = selectedCourseId || slugify(courseTitle || `short-course-${Date.now()}`);
      await createShortCourseDraftWithBlueprint({
        course: {
          id: courseId,
          title: courseTitle,
          description: form.description || parsedBlueprint.courseSummary.description,
          schoolId: form.schoolId,
          imageId: 'short-course',
          pricingType: Number(form.price) > 0 ? 'paid' : 'free',
          price: Number(form.price),
          currency: form.currency,
          certificateFee: Number(form.certificateFee),
          certificateCurrency: form.certificateCurrency,
          durationHours: Number(form.durationHours || parsedBlueprint.courseSummary.totalDurationHours || 1),
          level: form.level || parsedBlueprint.courseSummary.level || 'beginner',
          status: 'draft',
          modules: parsedBlueprint.modules.map((module) => ({ title: module.title, description: module.description })),
          lessons: flattenLessons(parsedBlueprint),
          outcomes: parsedBlueprint.courseSummary.outcomes ?? [],
        } as any,
        blueprint: parsedBlueprint as any,
        sourceMode: documents.length ? 'document' as any : selectedCourseId ? 'existing-course' as any : 'new',
        programmeTitle: selectedCourseId ? `Existing course: ${selectedCourseId}` : null,
        programmeCourseTitle: documents.map((doc) => doc.name).join(', ') || null,
      });
      setCourses(await getCourses());
      setMessage(selectedCourseId ? 'Existing course updated as a draft. Go to Review & Publish to approve and publish it.' : 'New draft saved. Go to Review & Publish to approve and publish it.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save draft.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading AI course builder..." />;

  return (
    <div className="space-y-6">
      {error ? <PageError message={error} /> : null}
      {message ? <div className="rounded-xl border bg-muted/40 p-4 text-sm">{message}</div> : null}
      {extractionProgress ? <div className="rounded-xl border bg-primary/5 p-4 text-sm"><div className="mb-2 flex items-center justify-between gap-3"><span>{extractionProgress.message}</span><span className="font-medium">{extractionProgress.percent ?? 0}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(1, extractionProgress.percent ?? 1)}%` }} /></div>{extractionProgress.currentPage && extractionProgress.totalPages ? <p className="mt-2 text-xs text-muted-foreground">Page {extractionProgress.currentPage} of {extractionProgress.totalPages}</p> : null}</div> : null}
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader><CardTitle>{selectedCourseId ? 'Edit existing course with AI' : 'Build with AI'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Edit existing course or create new">
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={selectedCourseId} onChange={(event) => void selectExistingCourse(event.target.value)}>
                <option value="">Create a new short course draft</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title} ({course.status ?? 'draft'})</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Choose an old course to regenerate missing lesson content. Saving uses the same course ID so you do not create a duplicate.</p>
            </Field>
            <Field label="Single prompt box">
              <Textarea rows={8} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: Rebuild this existing course using uploaded Unit 1 to Unit 6 documents. Create complete modules, lessons, card-based content, quizzes, maths/tables where needed, and practice questions by difficulty." />
            </Field>
            <Field label="Upload one or many source documents">
              <Input type="file" multiple accept=".txt,.md,.markdown,.csv,.json,.html,.htm,.xml,.pdf,.docx,.png,.jpg,.jpeg,.webp" onChange={readDocuments} disabled={reading} />
              <p className="text-xs text-muted-foreground">Upload one full document or several unit documents. OCR runs for scanned PDFs/images and may take time on large files.</p>
            </Field>
            {documents.length ? <div className="space-y-2 rounded-xl border p-3 text-sm"><p className="font-medium">Loaded documents</p>{documents.map((doc, index) => <div key={`${doc.name}-${index}`} className="rounded-lg bg-muted/40 p-2"><p>{index + 1}. {doc.name}</p>{doc.warning ? <p className="text-xs text-amber-600">{doc.warning}</p> : null}</div>)}<Button type="button" variant="ghost" size="sm" onClick={() => setDocuments([])}>Clear documents</Button></div> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title"><Input value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} /></Field>
              <Field label="Level"><Input value={form.level} onChange={(event) => setForm((value) => ({ ...value, level: event.target.value }))} /></Field>
              <Field label="Hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
              <Field label="School"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.schoolId} onChange={(event) => setForm((value) => ({ ...value, schoolId: event.target.value }))}>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></Field>
              <Field label="Entry fee"><Input type="number" min={0} value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} /></Field>
              <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
            </div>
            <Field label="Description"><Textarea rows={3} value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} /></Field>
            <div className="grid gap-2 sm:grid-cols-2"><Button type="button" onClick={generateCourse} disabled={generating || reading}>{generating ? 'Generating...' : selectedCourseId ? 'Regenerate selected course' : 'Generate course with AI'}</Button><Button type="button" variant="outline" asChild><Link href="/admin/short-courses/manual">Make course manually</Link></Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reviewable course blueprint</CardTitle></CardHeader>
          <CardContent className="space-y-4"><Textarea className="font-mono text-xs" rows={32} value={blueprintText} onChange={(event) => setBlueprintText(event.target.value)} placeholder="AI-generated course JSON appears here. Review and edit before saving." /><Button className="w-full" onClick={saveDraft} disabled={saving || !parsedBlueprint}>{saving ? 'Saving draft...' : selectedCourseId ? 'Update selected course draft' : 'Save new draft for review'}</Button></CardContent>
        </Card>
      </div>
      <Card><CardHeader><CardTitle>Existing short courses</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{courses.slice(0, 8).map((course) => <button type="button" key={course.id} onClick={() => void selectExistingCourse(course.id)} className="rounded-xl border p-3 text-left text-sm transition hover:border-primary"><p className="font-medium">{course.title}</p><p className="text-muted-foreground">{course.status ?? 'draft'} · {course.durationHours ?? 0}h</p></button>)}{!courses.length ? <p className="text-sm text-muted-foreground">No courses yet.</p> : null}</CardContent></Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function cleanJson(raw: string) { return raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim(); }
function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `short-course-${Date.now()}`; }
function normalizeBlueprint(blueprint: CourseBuilderBlueprint): CourseBuilderBlueprint {
  const summary = blueprint.courseSummary ?? {} as CourseBuilderBlueprint['courseSummary'];
  return { courseSummary: { title: summary.title || 'Untitled short course', audience: summary.audience || 'Short-course learners', level: summary.level || 'beginner', description: summary.description || 'Short-course draft.', prerequisites: summary.prerequisites ?? [], totalDurationHours: Number(summary.totalDurationHours || 1), outcomes: summary.outcomes?.length ? summary.outcomes : ['Complete the course outcomes.'], finalAssessment: summary.finalAssessment || 'Final assessment.', certificateCriteria: summary.certificateCriteria || 'Complete lessons and pass the final assessment.' }, assessments: blueprint.assessments ?? { quizzes: [], practicalWork: [], instructorReviewChecklist: [] }, modules: (blueprint.modules ?? []).map((module, moduleIndex) => ({ title: module.title || `Module ${moduleIndex + 1}`, description: module.description || 'Module description.', durationMinutes: Number(module.durationMinutes || 60), outcomes: module.outcomes ?? [], moduleAssessment: module.moduleAssessment || 'Module assessment.', lessons: (module.lessons ?? []).map((lesson, lessonIndex) => ({ title: lesson.title || `Lesson ${lessonIndex + 1}`, summary: lesson.summary || 'Lesson summary.', durationMinutes: Number(lesson.durationMinutes || 20), difficulty: lesson.difficulty || 'beginner', outcomes: lesson.outcomes ?? [], blocks: lesson.blocks?.length ? lesson.blocks : [{ type: 'explanation', title: 'Core idea', body: 'Explain the lesson clearly.' } as any], subLessons: lesson.subLessons ?? [], activities: lesson.activities ?? [], assessment: lesson.assessment || 'Lesson check.' })) })) };
}
function flattenLessons(blueprint: CourseBuilderBlueprint) { return blueprint.modules.flatMap((module, moduleIndex) => module.lessons.flatMap((lesson, lessonIndex) => [{ ...lesson, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex }, ...(lesson.subLessons ?? []).map((subLesson, subIndex) => ({ ...subLesson, title: `${lesson.title}: ${subLesson.title}`, moduleTitle: module.title, moduleIndex, sortOrder: moduleIndex * 100 + lessonIndex * 10 + subIndex + 1 }))])); }
function buildPrompt(seed: string, form: FormState, sourceText: string, names: string[], selectedCourseId: string, existingLessonCount: number) { const source = sourceText.trim() ? `\n\nSOURCE DOCUMENTS (${names.length}):\n${sourceText}\n\nTreat these as ordered course source material. If named Unit 1, Unit 2, etc., preserve that structure as modules or lesson groups.` : ''; const existing = selectedCourseId ? `\nExisting course ID: ${selectedCourseId}. Existing lesson count: ${existingLessonCount}. Recreate or complete missing lesson content for this existing course, but keep the course identity.` : ''; return `Create a launch-ready UnivAI Institute short course in strict JSON only. No markdown.\nPrompt: ${seed}${existing}\nTitle: ${form.title || 'Create a suitable title'}\nDescription: ${form.description || 'Create a suitable description'}\nLevel: ${form.level}\nDuration hours: ${form.durationHours}${source}\n\nRules:\n- Build a complete self-paced course from one or many source documents.\n- Use SoloLearn-style lesson cards.\n- Allowed card types: explanation, example, equation, graph, table, number_line, matrix, formula_sheet, geometry, question, fill_blank, true_false, summary.\n- Add questions between teaching cards.\n- Create practice-question guidance in assessments.quizzes for easy, medium, hard, and very_hard levels.\n- Include finalAssessment and certificateCriteria.\n- For math, use LaTeX-friendly notation and visual cards where useful.\n- Avoid fake accreditation, job guarantees, unsupported claims, or official dates.\n- Return JSON shaped exactly like: {"courseSummary":{"title":"","audience":"","level":"","description":"","prerequisites":[],"totalDurationHours":0,"outcomes":[],"finalAssessment":"","certificateCriteria":""},"assessments":{"quizzes":[],"practicalWork":[],"instructorReviewChecklist":[]},"modules":[{"title":"","description":"","durationMinutes":0,"outcomes":[],"moduleAssessment":"","lessons":[{"title":"","summary":"","durationMinutes":0,"difficulty":"","outcomes":[],"blocks":[],"subLessons":[],"activities":[],"assessment":""}]}]}`; }