'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Textarea } from '@/components/ui/textarea';
import {
  createInstructorAiGeneration,
  createInstructorCourseSource,
  getInstructorPortalOverview,
} from '@/lib/api';

type Row = Record<string, unknown>;

type InstructorOverview = {
  instructor?: Row | null;
  applications?: Row[];
  earnings?: Row[];
  payouts?: Row[];
  courseSources?: Row[];
  aiGenerations?: Row[];
  aiPackages?: Row[];
};

export function InstructorAiBuilderClient({ mode = 'builder' }: { mode?: 'dashboard' | 'sources' | 'generations' | 'packages' | 'builder' }) {
  const [overview, setOverview] = useState<InstructorOverview>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState({
    title: '',
    sourceType: 'document',
    extractedText: '',
  });
  const [generationForm, setGenerationForm] = useState({
    title: '',
    generationType: 'course_outline',
    prompt: '',
    selectedSourceIds: [] as string[],
  });

  async function refresh() {
    const data = (await getInstructorPortalOverview()) as InstructorOverview;
    setOverview(data);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Instructor workspace is unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const sources = overview.courseSources ?? [];
  const generations = overview.aiGenerations ?? [];
  const packages = overview.aiPackages ?? [];
  const selectedSources = useMemo(
    () => sources.filter((source) => generationForm.selectedSourceIds.includes(String(source.id))),
    [generationForm.selectedSourceIds, sources],
  );

  async function saveSource(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createInstructorCourseSource({
        title: sourceForm.title,
        sourceType: sourceForm.sourceType,
        extractedText: sourceForm.extractedText,
        status: 'uploaded',
      });
      setSourceForm({ title: '', sourceType: 'document', extractedText: '' });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save source material.');
    } finally {
      setSaving(false);
    }
  }

  async function generateCourse(event: FormEvent) {
    event.preventDefault();
    if (!generationForm.selectedSourceIds.length) {
      setError('Select at least one source document before using the Instructor AI Course Builder.');
      return;
    }

    setGenerating(true);
    setError(null);
    try {
      await createInstructorAiGeneration({
        generationType: generationForm.generationType,
        sourceIds: generationForm.selectedSourceIds.map((id) => Number(id)),
        title: generationForm.title || deriveTitle(generationForm.prompt, selectedSources),
        prompt: buildInstructorPrompt(generationForm.prompt, selectedSources),
      });
      setGenerationForm((value) => ({ ...value, title: '', prompt: '' }));
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to generate course material.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <PageLoading message="Loading instructor AI workspace..." />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Paid AI Course Builder</p>
        <h1 className="text-3xl font-bold">Instructor AI Course Builder</h1>
        <p className="max-w-3xl text-muted-foreground">
          Upload source material, turn rough ideas into professional short-course drafts, and keep every AI output in review before publication.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Sources" value={sources.length} />
        <Metric label="AI drafts" value={generations.length} />
        <Metric label="Packages" value={packages.length} />
        <Metric label="Payouts" value={(overview.payouts ?? []).length} />
      </div>

      {mode === 'packages' ? <PackageList packages={packages} /> : null}

      {mode !== 'generations' && mode !== 'packages' ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>Source Material</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={saveSource}>
                <Field label="Source title">
                  <Input required value={sourceForm.title} onChange={(event) => setSourceForm((value) => ({ ...value, title: event.target.value }))} />
                </Field>
                <Field label="Source type">
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={sourceForm.sourceType} onChange={(event) => setSourceForm((value) => ({ ...value, sourceType: event.target.value }))}>
                    <option value="document">Document</option>
                    <option value="slides">Slides</option>
                    <option value="notes">Instructor notes</option>
                    <option value="curriculum">Curriculum</option>
                    <option value="video_script">Video script</option>
                  </select>
                </Field>
                <Field label="Extracted text or source notes">
                  <Textarea required rows={8} value={sourceForm.extractedText} onChange={(event) => setSourceForm((value) => ({ ...value, extractedText: event.target.value }))} />
                </Field>
                <Button disabled={saving}>{saving ? 'Saving...' : 'Save source material'}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generate Professional Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={generateCourse}>
                <Field label="Draft title">
                  <Input value={generationForm.title} onChange={(event) => setGenerationForm((value) => ({ ...value, title: event.target.value }))} placeholder="Optional. UnivAI can infer one." />
                </Field>
                <Field label="Output type">
                  <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={generationForm.generationType} onChange={(event) => setGenerationForm((value) => ({ ...value, generationType: event.target.value }))}>
                    <option value="course_outline">Course outline</option>
                    <option value="lesson_pack">Lesson pack</option>
                    <option value="quizzes">Quizzes</option>
                    <option value="assignment">Assignment</option>
                    <option value="certificate_exam">Certificate exam</option>
                  </select>
                </Field>
                <div className="space-y-2">
                  <Label>Use source material</Label>
                  <div className="grid gap-2 rounded-lg border p-3">
                    {sources.length ? sources.map((source) => {
                      const id = String(source.id);
                      return (
                        <label key={id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={generationForm.selectedSourceIds.includes(id)}
                            onChange={(event) => {
                              setGenerationForm((value) => ({
                                ...value,
                                selectedSourceIds: event.target.checked
                                  ? [...value.selectedSourceIds, id]
                                  : value.selectedSourceIds.filter((item) => item !== id),
                              }));
                            }}
                          />
                          <span>{String(source.title ?? `Source ${id}`)}</span>
                        </label>
                      );
                    }) : <p className="text-sm text-muted-foreground">Add source material first. AI generation is source-gated.</p>}
                  </div>
                </div>
                <Field label="Prompt or rough idea">
                  <Textarea rows={6} value={generationForm.prompt} onChange={(event) => setGenerationForm((value) => ({ ...value, prompt: event.target.value }))} placeholder="A vague prompt is fine. Example: turn this into a leadership course for new supervisors." />
                </Field>
                <Button disabled={generating || !sources.length}>{generating ? 'Generating...' : 'Generate review-ready draft'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {mode !== 'sources' && mode !== 'packages' ? <GenerationList generations={generations} /> : null}
      {mode === 'sources' ? <SourceList sources={sources} /> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function GenerationList({ generations }: { generations: Row[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generated Drafts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {generations.length ? generations.map((generation) => {
          const id = String(generation.id);
          const output = String(generation.output ?? '');
          const isExpanded = expanded[id] ?? false;
          const preview = isExpanded ? output : output.slice(0, 1600);

          return (
            <article key={id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{String(generation.title ?? generation.generation_type ?? 'AI draft')}</p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{String(generation.status ?? 'ai_generated')}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{preview}</p>
              {output.length > 1600 ? (
                <Button
                  type="button"
                  variant="link"
                  className="mt-2 h-auto px-0 text-xs"
                  onClick={() => setExpanded((current) => ({ ...current, [id]: !isExpanded }))}
                >
                  {isExpanded ? 'Show less' : 'View full draft'}
                </Button>
              ) : null}
            </article>
          );
        }) : <p className="text-sm text-muted-foreground">No generated drafts yet.</p>}
      </CardContent>
    </Card>
  );
}

function SourceList({ sources }: { sources: Row[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Sources</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {sources.length ? sources.map((source) => (
          <div key={String(source.id)} className="rounded-lg border p-4">
            <p className="font-semibold">{String(source.title ?? 'Source')}</p>
            <p className="text-sm text-muted-foreground">{String(source.source_type ?? 'document')}</p>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{String(source.extracted_text ?? '')}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No source material uploaded yet.</p>}
      </CardContent>
    </Card>
  );
}

function PackageList({ packages }: { packages: Row[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Packages</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {packages.length ? packages.map((item) => (
          <div key={String(item.id)} className="rounded-lg border p-4">
            <p className="font-semibold">{String(item.name ?? 'AI package')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{String(item.description ?? 'Paid instructor AI entitlement')}</p>
            <p className="mt-3 text-sm font-medium">{String(item.currency ?? 'ZMW')} {String(item.price ?? '0')}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">AI packages will appear after migration seeding.</p>}
      </CardContent>
    </Card>
  );
}

function deriveTitle(prompt: string, sources: Row[]) {
  const seed = prompt.trim() || String(sources[0]?.title ?? 'Professional Short Course');
  return seed.length > 80 ? `${seed.slice(0, 77)}...` : seed;
}

function buildInstructorPrompt(prompt: string, sources: Row[]) {
  const sourceTitles = sources.map((source) => String(source.title ?? 'Untitled source')).join(', ');
  return `
Instructor request:
${prompt || 'Create the strongest professional short course from the selected source material.'}

Selected source titles:
${sourceTitles}

UnivAI prompt engineering rules:
- Infer the real learner audience if the prompt is vague.
- Turn incomplete instructions into a polished course architecture.
- Use only instructor-uploaded source material as the academic base.
- Generate a professional title, outcomes, lesson plan, activities, quizzes, final assessment and review checklist.
- Mark all output as AI-generated and requiring instructor/admin review before publication.
`.trim();
}
