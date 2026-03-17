'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { assignCurriculumPolicy, assignProgramPolicy, createAcademicPolicy, getAcademicPolicies, getCurriculumVersions, getPrograms, updateAcademicPolicy } from '@/lib/api';
import type { AcademicPolicy, CurriculumVersion, Program } from '@/lib/api/types';
import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';

type RecordState = 'active' | 'archived' | 'deleted';

const defaultBands = [{ min: 70, max: 100, letter: 'A', points: 4.0 }, { min: 60, max: 69, letter: 'B', points: 3.0 }, { min: 50, max: 59, letter: 'C', points: 2.0 }, { min: 40, max: 49, letter: 'D', points: 1.0 }, { min: 0, max: 39, letter: 'F', points: 0.0 }];

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
  const [error, setError] = useState<string | null>(null);
  const [recordStates, setRecordStates] = useState<Record<number, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const [policyList, programList] = await Promise.all([getAcademicPolicies(), getPrograms()]);
      setPolicies(policyList);
      setRecordStates(Object.fromEntries(policyList.map((p) => [p.id, 'active'])));
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

  const pushHistory = (id: number, action: string) => setHistory((prev) => [{ id: `${id}-${Date.now()}`, entity: 'Policy', entityId: String(id), action, timestamp: new Date().toISOString() }, ...prev]);

  const handleCreatePolicy = async () => {
    setError(null);
    try {
      const bands = JSON.parse(gradeBands);
      const created = await createAcademicPolicy({ name, pass_mark: Number(passMark), repeat_rule: repeatRule, max_attempts: Number(maxAttempts), grade_bands: bands, include_failed_in_gpa: true, include_withdrawn_in_gpa: false, credit_award_policy: 'pass_only', gpa_scale_type: '4.0', rounding_decimals: 2 } as AcademicPolicy);
      setPolicies((prev) => [created, ...prev]);
      setRecordStates((prev) => ({ ...prev, [created.id]: 'active' }));
      setName('');
    } catch {
      setError('Invalid JSON in grade bands.');
    }
  };

  const handleUpdatePolicy = async () => {
    if (!policyId) return;
    const updated = await updateAcademicPolicy(Number(policyId), { pass_mark: Number(passMark), repeat_rule: repeatRule, max_attempts: Number(maxAttempts) });
    setPolicies((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const setLifecycleState = (id: number, next: RecordState) => {
    setRecordStates((prev) => ({ ...prev, [id]: next }));
    pushHistory(id, next === 'active' ? 'restored' : next === 'archived' ? 'archived' : 'hard deleted');
  };

  const selectedPolicy = useMemo(() => policies.find((policy) => policy.id.toString() === policyId), [policies, policyId]);

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">Academic Policies</h1><p className="text-muted-foreground">Explicit create/read/update/archive/restore/delete controls.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>Create Policy Template</CardTitle></CardHeader><CardContent className="space-y-4"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /><Label>Pass Mark</Label><Input type="number" value={passMark} onChange={(e) => setPassMark(e.target.value)} /><Label>Repeat Rule</Label><Input value={repeatRule} onChange={(e) => setRepeatRule(e.target.value)} /><Label>Max Attempts</Label><Input type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} /><Label>Grade Bands (JSON)</Label><Textarea value={gradeBands} onChange={(e) => setGradeBands(e.target.value)} className="min-h-40" />{error && <p className="text-sm text-destructive">{error}</p>}<Button onClick={handleCreatePolicy} disabled={!name}>Create Policy</Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Assign & Update Policy</CardTitle></CardHeader><CardContent className="space-y-4"><Label>Policy</Label><Select value={policyId} onValueChange={setPolicyId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{policies.filter((p) => (recordStates[p.id] ?? 'active') !== 'deleted').map((policy) => <SelectItem key={policy.id} value={policy.id.toString()}>{policy.name}</SelectItem>)}</SelectContent></Select>{selectedPolicy && <div className="flex gap-2"><Badge variant="outline">Pass {selectedPolicy.pass_mark}%</Badge><Badge variant="outline">{recordStates[selectedPolicy.id] ?? 'active'}</Badge></div>}<Button variant="outline" onClick={handleUpdatePolicy} disabled={!policyId}>Update Selected</Button><Label>Program</Label><Select value={programId} onValueChange={setProgramId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => policyId && programId && assignProgramPolicy({ program_id: programId, policy_id: Number(policyId) })}>Assign to Program</Button><Label>Curriculum Version</Label><Select value={versionId} onValueChange={setVersionId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{versions.map((version) => <SelectItem key={version.id} value={version.id}>{version.name}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={() => policyId && versionId && assignCurriculumPolicy({ curriculum_version_id: versionId, policy_id: Number(policyId) })}>Assign to Curriculum</Button></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Existing Policies</CardTitle><CardDescription>Prefer archive over hard-delete.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {policies.map((policy) => {
            const state = recordStates[policy.id] ?? 'active';
            if (state === 'deleted') return null;
            return <div key={policy.id} className="rounded-lg border p-4 space-y-2"><div className="flex items-center justify-between"><p className="font-semibold">{policy.name}</p><Badge variant="secondary">{state}</Badge></div><div className="text-sm text-muted-foreground">Repeat: {policy.repeat_rule} · Max Attempts: {policy.max_attempts}</div><div className="flex gap-2">{state === 'active' ? <Button size="sm" variant="outline" onClick={() => setLifecycleState(policy.id, 'archived')}>Archive</Button> : <Button size="sm" variant="outline" onClick={() => setLifecycleState(policy.id, 'active')}>Restore</Button>}<Button size="sm" variant="destructive" onClick={() => setLifecycleState(policy.id, 'deleted')}>Hard Delete</Button></div></div>;
          })}
        </CardContent>
      </Card>

      <ImmutableHistoryPanel title="Policy destructive history" entries={history} />
    </div>
  );
}
