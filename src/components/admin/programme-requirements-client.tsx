'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getPrograms, updateProgram } from '@/lib/api';
import type { Program } from '@/lib/api/types';

export function ProgrammeRequirementsClient() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getPrograms()
      .then((items) => {
        if (!mounted) return;
        setPrograms(items);
        const first = items[0];
        if (first) {
          setSelectedId(first.id);
          setRequirements(first.admissionRequirements || '');
        }
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Programme requirements are unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selected = useMemo(
    () => programs.find((program) => program.id === selectedId),
    [programs, selectedId]
  );

  function selectProgram(programId: string) {
    const program = programs.find((item) => item.id === programId);
    setSelectedId(programId);
    setRequirements(program?.admissionRequirements || '');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProgram(selected.id, {
        id: selected.id,
        title: selected.title,
        description: selected.description,
        schoolId: selected.schoolId,
        departmentId: selected.departmentId ?? null,
        qualificationLevelId: selected.qualificationLevelId || selected.qualificationLevel?.id || '',
        credits: selected.credits ?? null,
        durationMonths: selected.durationMonths ?? null,
        admissionRequirements: requirements,
        deliveryModes: selected.deliveryModes || selected.supportedDeliveryModes || ['online'],
        examClinicRequired: selected.examClinicRequired ?? false,
        requiresAccreditationApproval: selected.requiresAccreditationApproval ?? false,
        accreditationApproved: Boolean(selected.accreditationApprovedAt),
        launchStatus: selected.launchStatus || 'draft',
        imageId: selected.imageId || null,
      });
      setPrograms((items) => items.map((program) => (program.id === updated.id ? updated : program)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save requirements.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading message="Loading programme requirements..." />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Admissions</p>
        <h1 className="text-3xl font-bold">Programme Requirements</h1>
        <p className="max-w-3xl text-muted-foreground">
          Publish programme-specific admission requirements used by the public catalogue and application flow.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Requirement Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <div className="space-y-2">
              <Label>Programme</Label>
              <Select value={selectedId} onValueChange={selectProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Select programme" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admission requirements</Label>
              <Textarea
                required
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                placeholder="Example: Grade 12 certificate with five credits including English, Mathematics and Biology."
                rows={8}
              />
            </div>
            <Button disabled={saving || !selected || !(selected.qualificationLevelId || selected.qualificationLevel?.id)}>
              {saving ? 'Saving...' : 'Save programme requirements'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
