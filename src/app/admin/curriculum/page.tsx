'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addModulePrerequisite, createCurriculumModule, createCurriculumVersion, getCurriculumModules, getCurriculumVersions, getModulePrerequisites, getPrograms, updateCurriculumVersion } from '@/lib/api';
import type { CurriculumModule, CurriculumVersion, Program } from '@/lib/api/types';
import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';

type RecordState = 'active' | 'archived' | 'deleted';

export default function AdminCurriculumPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [programId, setProgramId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [versionName, setVersionName] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleSemester, setModuleSemester] = useState('1');
  const [moduleCredits, setModuleCredits] = useState('3');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedPrereqId, setSelectedPrereqId] = useState('');
  const [prerequisites, setPrerequisites] = useState<{ moduleId: string; prerequisiteId: string; prerequisiteTitle?: string | null }[]>([]);
  const [versionStates, setVersionStates] = useState<Record<string, RecordState>>({});
  const [moduleStates, setModuleStates] = useState<Record<string, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const programList = await getPrograms();
      setPrograms(programList);
      const selectedProgram = programList[0]?.id ?? '';
      setProgramId(selectedProgram);
      if (selectedProgram) {
        const versionList = await getCurriculumVersions(selectedProgram);
        setVersions(versionList);
        setVersionStates(Object.fromEntries(versionList.map((v) => [v.id, 'active'])));
        setVersionId(versionList[0]?.id ?? '');
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!programId) return;
    getCurriculumVersions(programId).then((versionList) => {
      setVersions(versionList);
      setVersionId(versionList[0]?.id ?? '');
      setVersionStates((prev) => ({ ...Object.fromEntries(versionList.map((v) => [v.id, prev[v.id] ?? 'active'])) }));
    });
  }, [programId]);

  useEffect(() => {
    if (!versionId) return setModules([]);
    getCurriculumModules(versionId).then((moduleList) => {
      setModules(moduleList);
      setModuleStates((prev) => ({ ...Object.fromEntries(moduleList.map((m) => [m.id, prev[m.id] ?? 'active'])) }));
    });
  }, [versionId]);

  useEffect(() => {
    if (!selectedModuleId) return setPrerequisites([]);
    getModulePrerequisites(selectedModuleId).then(setPrerequisites);
  }, [selectedModuleId]);

  const pushHistory = (entity: string, entityId: string, action: string) => setHistory((prev) => [{ id: `${entityId}-${Date.now()}`, entity, entityId, action, timestamp: new Date().toISOString() }, ...prev]);

  const handleCreateVersion = async () => {
    if (!programId || !versionName) return;
    const created = await createCurriculumVersion({ programId, name: versionName, status: 'draft' });
    setVersions((prev) => [created, ...prev]);
    setVersionStates((prev) => ({ ...prev, [created.id]: 'active' }));
    setVersionId(created.id);
    setVersionName('');
  };

  const handleUpdateVersion = async () => {
    if (!versionId || !versionName) return;
    setVersions((prev) => prev.map((v) => (v.id === versionId ? { ...v, name: versionName } : v)));
  };

  const handleCreateModule = async () => {
    if (!versionId || !moduleTitle || !moduleDescription) return;
    const created = await createCurriculumModule(versionId, { title: moduleTitle, description: moduleDescription, credits: Number(moduleCredits) || 3, semester: Number(moduleSemester), isCore: true, track: null });
    setModules((prev) => [...prev, created]);
    setModuleStates((prev) => ({ ...prev, [created.id]: 'active' }));
    setModuleTitle('');
    setModuleDescription('');
  };

  const handleAddPrerequisite = async () => {
    if (!selectedModuleId || !selectedPrereqId) return;
    await addModulePrerequisite(selectedModuleId, selectedPrereqId);
    const data = await getModulePrerequisites(selectedModuleId);
    setPrerequisites(data);
    setSelectedPrereqId('');
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading curriculum...</p>;

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">Curriculum Builder</h1><p className="text-muted-foreground">Explicit create/read/update/archive/restore/delete lifecycle for versions and modules.</p></div>

      <Card><CardHeader><CardTitle>Curriculum Version</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Program</Label><Select value={programId} onValueChange={setProgramId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Version Name</Label><Input value={versionName} onChange={(e) => setVersionName(e.target.value)} /></div><div className="flex items-end gap-2"><Button onClick={handleCreateVersion}>Create</Button><Button variant="outline" onClick={handleUpdateVersion} disabled={!versionId}>Update</Button><Button variant="outline" onClick={() => versionId && updateCurriculumVersion(versionId, { status: 'published' })}>Publish</Button></div></CardContent></Card>

      <Card><CardHeader><CardTitle>Version Records</CardTitle><CardDescription>Prefer archive over hard-delete.</CardDescription></CardHeader><CardContent className="space-y-3">{versions.map((version) => { const state = versionStates[version.id] ?? 'active'; if (state === 'deleted') return null; return <div key={version.id} className="rounded-lg border p-3 flex items-center justify-between"><span>{version.name} ({version.status}) · {state}</span><div className="flex gap-2">{state === 'active' ? <Button size="sm" variant="outline" onClick={() => { setVersionStates((prev) => ({ ...prev, [version.id]: 'archived' })); pushHistory('CurriculumVersion', version.id, 'archived'); }}>Archive</Button> : <Button size="sm" variant="outline" onClick={() => { setVersionStates((prev) => ({ ...prev, [version.id]: 'active' })); pushHistory('CurriculumVersion', version.id, 'restored'); }}>Restore</Button>}<Button size="sm" variant="destructive" onClick={() => { setVersionStates((prev) => ({ ...prev, [version.id]: 'deleted' })); pushHistory('CurriculumVersion', version.id, 'hard deleted'); }}>Hard Delete</Button></div></div>; })}</CardContent></Card>

      <Card><CardHeader><CardTitle>Modules</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Curriculum Version</Label><Select value={versionId} onValueChange={setVersionId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{versions.filter((v) => (versionStates[v.id] ?? 'active') !== 'deleted').map((version) => <SelectItem key={version.id} value={version.id}>{version.name}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Module Title</Label><Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} /></div><div className="space-y-2"><Label>Semester</Label><Input type="number" min="1" value={moduleSemester} onChange={(e) => setModuleSemester(e.target.value)} /></div><div className="space-y-2"><Label>Credits</Label><Input type="number" min="1" value={moduleCredits} onChange={(e) => setModuleCredits(e.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)} /></div><div className="flex items-end"><Button onClick={handleCreateModule}>Create Module</Button></div></div><div className="space-y-3">{modules.map((module) => { const state = moduleStates[module.id] ?? 'active'; if (state === 'deleted') return null; return <div key={module.id} className="rounded-lg border p-4"><div className="flex justify-between"><div><p className="font-semibold">{module.title}</p><p className="text-sm text-muted-foreground">{module.description}</p></div><div className="text-sm text-muted-foreground">Semester {module.semester} · {state}</div></div><div className="mt-2 flex gap-2">{state === 'active' ? <Button size="sm" variant="outline" onClick={() => { setModuleStates((prev) => ({ ...prev, [module.id]: 'archived' })); pushHistory('CurriculumModule', module.id, 'archived'); }}>Archive</Button> : <Button size="sm" variant="outline" onClick={() => { setModuleStates((prev) => ({ ...prev, [module.id]: 'active' })); pushHistory('CurriculumModule', module.id, 'restored'); }}>Restore</Button>}<Button size="sm" variant="destructive" onClick={() => { setModuleStates((prev) => ({ ...prev, [module.id]: 'deleted' })); pushHistory('CurriculumModule', module.id, 'hard deleted'); }}>Hard Delete</Button></div></div>; })}</div></CardContent></Card>

      <Card><CardHeader><CardTitle>Prerequisites</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Module</Label><Select value={selectedModuleId} onValueChange={setSelectedModuleId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{modules.filter((m) => (moduleStates[m.id] ?? 'active') !== 'deleted').map((module) => <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Prerequisite</Label><Select value={selectedPrereqId} onValueChange={setSelectedPrereqId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{modules.filter((m) => (moduleStates[m.id] ?? 'active') !== 'deleted').map((module) => <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end"><Button onClick={handleAddPrerequisite}>Add Prerequisite</Button></div></div>{prerequisites.map((item) => <div key={`${item.moduleId}-${item.prerequisiteId}`} className="rounded-lg border p-3 text-sm">Prerequisite: {item.prerequisiteTitle ?? item.prerequisiteId}</div>)}</CardContent></Card>

      <ImmutableHistoryPanel title="Curriculum destructive history" entries={history} />
    </div>
  );
}
