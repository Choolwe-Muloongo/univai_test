'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  getAdminAssignments,
  getCurriculumModules,
  getCurriculumVersions,
  getIntakes,
  getPrograms,
} from '@/lib/api';
import type { AdminAssignment, CurriculumModule, CurriculumVersion, Intake, Program } from '@/lib/api/types';

export default function AdminCurriculumOpsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [programId, setProgramId] = useState('');
  const [versionId, setVersionId] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [programList, intakeList, assignmentPayload] = await Promise.all([
        getPrograms(),
        getIntakes(),
        getAdminAssignments(),
      ]);

      setPrograms(programList);
      setIntakes(intakeList);
      setAssignments(assignmentPayload.assignments);

      const selectedProgramId = programList[0]?.id ?? '';
      setProgramId(selectedProgramId);
      if (selectedProgramId) {
        const versionList = await getCurriculumVersions(selectedProgramId);
        setVersions(versionList);
        setVersionId(versionList[0]?.id ?? '');
      }
      setLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    const loadVersions = async () => {
      if (!programId) {
        setVersions([]);
        setVersionId('');
        return;
      }

      const versionList = await getCurriculumVersions(programId);
      setVersions(versionList);
      setVersionId(versionList[0]?.id ?? '');
    };

    loadVersions();
  }, [programId]);

  useEffect(() => {
    const loadModules = async () => {
      if (!versionId) {
        setModules([]);
        return;
      }

      const moduleList = await getCurriculumModules(versionId);
      setModules(moduleList);
    };

    loadModules();
  }, [versionId]);

  const selectedProgram = useMemo(() => programs.find((program) => program.id === programId), [programId, programs]);
  const selectedVersion = useMemo(() => versions.find((version) => version.id === versionId), [versionId, versions]);

  const intakesForProgram = useMemo(
    () => intakes.filter((intake) => intake.programId === programId),
    [intakes, programId]
  );
  const intakesWithoutCurriculum = useMemo(
    () => intakesForProgram.filter((intake) => !intake.curriculumVersionId),
    [intakesForProgram]
  );

  const assignmentsForProgram = useMemo(
    () => assignments.filter((assignment) => assignment.programId === programId),
    [assignments, programId]
  );
  const assignmentsWithoutIntake = useMemo(
    () => assignmentsForProgram.filter((assignment) => !assignment.intakeId),
    [assignmentsForProgram]
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading curriculum operations...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Curriculum Operations Center</h1>
        <p className="text-muted-foreground">
          One admin workspace for governance: curriculum versions, intake alignment, and lecturer delivery readiness.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope</CardTitle>
          <CardDescription>Choose a program and curriculum version to review operational readiness.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Curriculum Version</Label>
            <Select value={versionId} onValueChange={setVersionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select curriculum version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {version.name} ({version.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Program</CardDescription>
            <CardTitle className="text-lg">{selectedProgram?.title ?? 'No program selected'}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Version Status</CardDescription>
            <CardTitle className="text-lg flex items-center gap-2">
              {selectedVersion?.name ?? 'No version'}
              {selectedVersion?.status ? <Badge variant="outline">{selectedVersion.status}</Badge> : null}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Modules in Version</CardDescription>
            <CardTitle>{modules.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Intakes in Program</CardDescription>
            <CardTitle>{intakesForProgram.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Governance Checks</CardTitle>
            <CardDescription>Catch common gaps before publishing curriculum or launching delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Intakes without curriculum version</p>
              <p className="text-sm text-muted-foreground">
                {intakesWithoutCurriculum.length === 0
                  ? 'All visible intakes are pinned to a curriculum version.'
                  : `${intakesWithoutCurriculum.length} intake(s) need curriculum version mapping.`}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Lecturer assignments without intake</p>
              <p className="text-sm text-muted-foreground">
                {assignmentsWithoutIntake.length === 0
                  ? 'All lecturer assignments are intake-scoped.'
                  : `${assignmentsWithoutIntake.length} assignment(s) are missing intake context.`}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Published version availability</p>
              <p className="text-sm text-muted-foreground">
                {versions.some((version) => version.status === 'published')
                  ? 'Program has at least one published curriculum version.'
                  : 'No published version found. Students may not resolve program modules correctly.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Snapshot</CardTitle>
            <CardDescription>Quick operational summary for the selected program.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Assignments scoped to this program:{' '}
              <span className="font-medium text-foreground">{assignmentsForProgram.length}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              {modules.slice(0, 8).map((module) => (
                <div key={module.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>{module.title}</span>
                  <span className="text-muted-foreground">Sem {module.semester}</span>
                </div>
              ))}
              {modules.length === 0 ? (
                <p className="text-sm text-muted-foreground">No modules found for the selected version.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Open the dedicated admin screens for each curriculum workflow step.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/curriculum">Manage Curriculum Versions</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/intakes">Manage Intakes</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/assignments">Manage Lecturer Assignments</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/policies">Manage Academic Policies</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/curriculum-blueprint">Open DCE1 Blueprint</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
