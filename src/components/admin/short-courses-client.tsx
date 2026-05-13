'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import { createCourse, generateAi, getAdminAcademicStructure, getCourses, getPrograms, getSchools } from '@/lib/api';
import type { AdminAcademicStructureResponse, Course, Program, School } from '@/lib/api/types';

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
  const [aiPrompt, setAiPrompt] = useState('');
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
  });

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
        mode: 'professional_course_blueprint',
        audience: 'short-course learners',
        brandContext: 'UnivAI uses AI-powered learning, human-reviewed academic content and instructor/lecturer supervision.',
      });
      const generated = response as Record<string, unknown>;
      const output = String(generated.text || generated.output || generated.content || JSON.stringify(response));
      setAiOutline(output);
      setForm((value) => ({
        ...value,
        title: value.title || deriveShortCourseTitle(seed),
        description: value.description || output.slice(0, 700),
      }));
    } catch (cause) {
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

      await createCourse({
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
      });
      await refresh();
      setForm((value) => ({ ...value, title: '', description: '' }));
      setAiOutline('');
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
          Create practical short courses, set entry/certificate fees and use AI for draft outlines before human review.
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
                  placeholder="A rough idea is enough. Example: teach nurses data basics, or turn database systems into a beginner short course."
                />
                <p className="text-xs text-muted-foreground">
                  UnivAI will expand vague prompts into a professional course blueprint with outcomes, modules, lessons, quizzes, assessment and certificate criteria.
                </p>
              </div>
              <Field label="Entry fee"><Input type="number" min={0} value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} /></Field>
              <Field label="Currency"><Input value={form.currency} onChange={(event) => setForm((value) => ({ ...value, currency: event.target.value.toUpperCase() }))} /></Field>
              <Field label="Certificate fee"><Input type="number" min={0} value={form.certificateFee} onChange={(event) => setForm((value) => ({ ...value, certificateFee: event.target.value }))} /></Field>
              <Field label="Duration hours"><Input type="number" min={1} value={form.durationHours} onChange={(event) => setForm((value) => ({ ...value, durationHours: event.target.value }))} /></Field>
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <Button type="button" variant="outline" onClick={generateOutline} disabled={aiLoading || !(aiPrompt || form.title || programmeCourseId)}>{aiLoading ? 'Generating...' : 'Generate professional course with AI'}</Button>
                <Button disabled={saving || !form.schoolId}>{saving ? 'Saving...' : 'Create short course'}</Button>
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
You are UnivAI's senior academic course architect and instructional designer.

Task:
Turn the user's rough or vague idea into a professional, human-review-ready short course blueprint.

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

Requirements:
1. Infer the learner audience even if the prompt is vague.
2. Produce a polished market-ready title.
3. Write a concise course description.
4. Define 5-8 measurable learning outcomes.
5. Create a module-by-module outline with lessons.
6. Include practical activities and AI-powered study support.
7. Include quiz ideas, final assessment, pass criteria, and certificate eligibility.
8. Include prerequisites or "no prior experience required" where appropriate.
9. Keep official content human-reviewed and lecturer/instructor supervised.
10. Avoid hype, fake accreditation claims, and promises of jobs.

Return in this exact structure:
Title:
Audience:
Level:
Duration:
Prerequisites:
Description:
Learning Outcomes:
Modules and Lessons:
Practical Work:
Quizzes:
Final Assessment:
Certificate Criteria:
AI Study Support:
Instructor Review Checklist:
`.trim();
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
