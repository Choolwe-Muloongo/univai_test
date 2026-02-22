'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  assignCurriculumPolicy,
  assignProgramPolicy,
  createAcademicPolicy,
  getAcademicPolicies,
  getCurriculumVersions,
  getPrograms,
} from '@/lib/api';
import type { AcademicPolicy, CurriculumVersion } from '@/lib/api/types';
import type { Program } from '@/lib/api/types';

const defaultBands = [
  { min: 70, max: 100, letter: 'A', points: 4.0 },
  { min: 60, max: 69, letter: 'B', points: 3.0 },
  { min: 50, max: 59, letter: 'C', points: 2.0 },
  { min: 40, max: 49, letter: 'D', points: 1.0 },
  { min: 0, max: 39, letter: 'F', points: 0.0 },
];

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<AcademicPolicy[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [programId, setProgramId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [policyId, setPolicyId] = useState('');

  const [name, setName] = useState('');
  const [passMark, setPassMark] = useState('50');
  const [repeatRule, setRepeatRule] = useState('best');
  const [maxAttempts, setMaxAttempts] = useState('3');
  const [gradeBands, setGradeBands] = useState(JSON.stringify(defaultBands, null, 2));
  const [progressionPolicy, setProgressionPolicy] = useState(
    JSON.stringify({ min_pass_percent: 0.6, probation_limit: 2, carry_limit: 2 }, null, 2)
  );
  const [holdsPolicy, setHoldsPolicy] = useState(
    JSON.stringify({ registration: true, course_access: true, exam_entry: true, results_release: true }, null, 2)
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [policyList, programList] = await Promise.all([getAcademicPolicies(), getPrograms()]);
      setPolicies(policyList);
      setPrograms(programList);
      const firstProgram = programList[0]?.id ?? '';
      setProgramId(firstProgram);
      if (firstProgram) {
        const versionList = await getCurriculumVersions(firstProgram);
        setVersions(versionList);
        setVersionId(versionList[0]?.id ?? '');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadVersions = async () => {
      if (!programId) return;
      const versionList = await getCurriculumVersions(programId);
      setVersions(versionList);
      setVersionId(versionList[0]?.id ?? '');
    };
    loadVersions();
  }, [programId]);

  const handleCreatePolicy = async () => {
    setError(null);
    try {
      const bands = JSON.parse(gradeBands);
      const progression = progressionPolicy.trim() ? JSON.parse(progressionPolicy) : null;
      const holds = holdsPolicy.trim() ? JSON.parse(holdsPolicy) : null;

      setSaving(true);
      const created = await createAcademicPolicy({
        name,
        pass_mark: Number(passMark),
        repeat_rule: repeatRule,
        max_attempts: Number(maxAttempts),
        grade_bands: bands,
        include_failed_in_gpa: true,
        include_withdrawn_in_gpa: false,
        credit_award_policy: 'pass_only',
        gpa_scale_type: '4.0',
        progression_policy: progression,
        holds_policy: holds,
        rounding_decimals: 2,
      } as AcademicPolicy);

      setPolicies((prev) => [created, ...prev]);
      setName('');
      setPassMark('50');
      setRepeatRule('best');
      setMaxAttempts('3');
    } catch (err) {
      setError('Invalid JSON in grade bands or policy fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!programId || !policyId) return;
    await assignProgramPolicy({ program_id: programId, policy_id: Number(policyId) });
  };

  const handleAssignCurriculum = async () => {
    if (!versionId || !policyId) return;
    await assignCurriculumPolicy({ curriculum_version_id: versionId, policy_id: Number(policyId) });
  };

  const selectedPolicy = useMemo(
    () => policies.find((policy) => policy.id.toString() === policyId),
    [policies, policyId]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Policies</h1>
        <p className="text-muted-foreground">
          Configure grading, progression, and repeat rules per program or curriculum version.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Policy Template</CardTitle>
            <CardDescription>Define pass mark, repeat rules, and grade bands.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Standard 4.0 / Pass 50" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Pass Mark</Label>
                <Input type="number" min="0" max="100" value={passMark} onChange={(event) => setPassMark(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Max Attempts</Label>
                <Input type="number" min="1" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Repeat Rule</Label>
              <Select value={repeatRule} onValueChange={setRepeatRule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best attempt replaces</SelectItem>
                  <SelectItem value="latest">Latest attempt replaces</SelectItem>
                  <SelectItem value="average">Average attempts</SelectItem>
                  <SelectItem value="all">All attempts count</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Grade Bands (JSON)</Label>
              <Textarea value={gradeBands} onChange={(event) => setGradeBands(event.target.value)} className="min-h-40" />
            </div>
            <div className="space-y-2">
              <Label>Progression Policy (JSON)</Label>
              <Textarea value={progressionPolicy} onChange={(event) => setProgressionPolicy(event.target.value)} className="min-h-28" />
            </div>
            <div className="space-y-2">
              <Label>Holds Policy (JSON)</Label>
              <Textarea value={holdsPolicy} onChange={(event) => setHoldsPolicy(event.target.value)} className="min-h-24" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={handleCreatePolicy} disabled={saving || !name}>Create Policy</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Policy</CardTitle>
            <CardDescription>Apply a policy to a program or curriculum version.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Policy Template</Label>
              <Select value={policyId} onValueChange={setPolicyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select policy" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id.toString()}>
                      {policy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPolicy && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Pass {selectedPolicy.pass_mark}%</Badge>
                  <Badge variant="outline">{selectedPolicy.repeat_rule}</Badge>
                  <Badge variant="outline">Max {selectedPolicy.max_attempts}</Badge>
                </div>
              )}
            </div>

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
              <Button variant="outline" onClick={handleAssignProgram} disabled={!programId || !policyId}>
                Assign to Program
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Curriculum Version</Label>
              <Select value={versionId} onValueChange={setVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((version) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name} ({version.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleAssignCurriculum} disabled={!versionId || !policyId}>
                Assign to Curriculum Version
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Policies</CardTitle>
          <CardDescription>Review available templates and their primary rules.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {policies.map((policy) => (
            <div key={policy.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{policy.name}</p>
                <Badge variant="secondary">Pass {policy.pass_mark}%</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Repeat: {policy.repeat_rule} � Max Attempts: {policy.max_attempts}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

