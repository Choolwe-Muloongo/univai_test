'use client';

import { useEffect, useState } from 'react';

import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { deliveryModeLabel, deliveryModes } from '@/lib/delivery-modes';
import {
  addModulePrerequisite,
  createCurriculumModule,
  createCurriculumVersion,
  getCurriculumModules,
  getCurriculumVersions,
  getModulePrerequisites,
  getPrograms,
  updateCurriculumVersion,
} from '@/lib/api';
import type { CurriculumModule, CurriculumVersion, Program } from '@/lib/api/types';

type RecordState = 'active' | 'archived';
type CurriculumVersionPatch = { name?: string; status?: string };

export default function AdminCurriculumPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programId, setProgramId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [versionName, setVersionName] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleSemester, setModuleSemester] = useState('1');
  const [moduleCredits, setModuleCredits] = useState('3');
  const [moduleDeliveryModes, setModuleDeliveryModes] = useState<string[]>(['software_only', 'hybrid', 'physical']);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedPrereqId, setSelectedPrereqId] = useState('');
  const [prerequisites, setPrerequisites] = useState<{ moduleId: string; prerequisiteId: string; prerequisiteTitle?: string | null }[]>([]);
  const [versionStates, setVersionStates] = useState<Record<string, RecordState>>({});
  const [moduleStates, setModuleStates] = useState<Record<string, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const loadPrograms = async () => {
      setLoading(true);
      setError(null);

      try {
        const programList = await getPrograms();
        setPrograms(programList);
        setProgramId(programList[0]?.id ?? '');
      } catch (loadError: any) {
        console.error('Failed to load programs', loadError);
        setError(loadError?.message ?? 'Could not load curriculum data.');
      } finally {
        setLoading(false);
      }
    };

    loadPrograms();
  }, []);

  useEffect(() => {
    if (!programId) {
      setVersions([]);
      setVersionId('');
      return;
    }

    getCurriculumVersions(programId)
      .then((versionList) => {
        setVersions(versionList);
        setVersionId(versionList[0]?.id ?? '');
        setVersionStates((prev) => ({
          ...prev,
          ...Object.fromEntries(versionList.map((item) => [item.id, prev[item.id] ?? 'active'])),
        }));
      })
      .catch((loadError) => {
        console.error('Failed to load curriculum versions', loadError);
        setError('Could not load curriculum versions.');
      });
  }, [programId]);

  useEffect(() => {
    if (!versionId) {
      setModules([]);
      return;
    }

    getCurriculumModules(versionId)
      .then((moduleList) => {
        setModules(moduleList);
        setModuleStates((prev) => ({
          ...prev,
          ...Object.fromEntries(moduleList.map((item) => [item.id, prev[item.id] ?? 'active'])),
        }));
      })
      .catch((loadError) => {
        console.error('Failed to load modules', loadError);
        setError('Could not load curriculum modules.');
      });
  }, [versionId]);

  useEffect(() => {
    if (!selectedModuleId) {
      setPrerequisites([]);
      return;
    }

    getModulePrerequisites(selectedModuleId)
      .then(setPrerequisites)
      .catch((loadError) => {
        console.error('Failed to load prerequisites', loadError);
        setPrerequisites([]);
      });
  }, [selectedModuleId]);

  const pushHistory = (entity: string, entityId: string, action: string) => {
    setHistory((prev) => [
      { id: `${entityId}-${Date.now()}`, entity, entityId, action, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  };

  const patchCurriculumVersion = (id: string, payload: CurriculumVersionPatch) => {
    return updateCurriculumVersion(id, payload as { status: string });
  };

  const handleCreateVersion = async () => {
    if (!programId || !versionName) return;

    try {
      const created = await createCurriculumVersion({ programId, name: versionName, status: 'draft' });
      setVersions((prev) => [created, ...prev]);
      setVersionStates((prev) => ({ ...prev, [created.id]: 'active' }));
      setVersionId(created.id);
      setVersionName('');
      pushHistory('CurriculumVersion', created.id, 'created');
    } catch (createError) {
      console.error('Failed to create curriculum version', createError);
      setError('Could not create curriculum version.');
    }
  };

  const handleUpdateVersion = async () => {
    if (!versionId || !versionName) return;

    try {
      const updated = await patchCurriculumVersion(versionId, { name: versionName });
      setVersions((prev) => prev.map((item) => (item.id === versionId ? { ...item, ...updated, name: versionName } : item)));
      pushHistory('CurriculumVersion', versionId, 'updated');
      setVersionName('');
    } catch (updateError) {
      console.error('Failed to update curriculum version', updateError);
      setError('Could not update curriculum version.');
    }
  };

  const handlePublishVersion = async () => {
    if (!versionId) return;

    try {
      const updated = await patchCurriculumVersion(versionId, { status: 'published' });
      setVersions((prev) => prev.map((item) => (item.id === versionId ? { ...item, ...updated } : item)));
      pushHistory('CurriculumVersion', versionId, 'published');
    } catch (publishError) {
      console.error('Failed to publish curriculum version', publishError);
      setError('Could not publish curriculum version.');
    }
  };

  const handleCreateModule = async () => {
    if (!versionId || !moduleTitle || !moduleDescription) return;

    try {
      const created = await createCurriculumModule(versionId, {
        title: moduleTitle,
        description: moduleDescription,
        credits: Number(moduleCredits) || 3,
        semester: Number(moduleSemester) || 1,
        isCore: true,
        track: null,
        supportedDeliveryModes: moduleDeliveryModes,
      });
      setModules((prev) => [...prev, created]);
      setModuleStates((prev) => ({ ...prev, [created.id]: 'active' }));
      setModuleTitle('');
      setModuleDescription('');
      setModuleCredits('3');
      setModuleSemester('1');
      setModuleDeliveryModes(['software_only', 'hybrid', 'physical']);
      pushHistory('CurriculumModule', created.id, 'created');
    } catch (createError) {
      console.error('Failed to create module', createError);
      setError('Could not create curriculum module.');
    }
  };

  const handleAddPrerequisite = async () => {
    if (!selectedModuleId || !selectedPrereqId) return;

    try {
      await addModulePrerequisite(selectedModuleId, selectedPrereqId);
      const updated = await getModulePrerequisites(selectedModuleId);
      setPrerequisites(updated);
      setSelectedPrereqId('');
      pushHistory('CurriculumPrerequisite', selectedModuleId, `added prerequisite ${selectedPrereqId}`);
    } catch (prereqError) {
      console.error('Failed to add prerequisite', prereqError);
      setError('Could not add prerequisite.');
    }
  };

  const visibleVersions = versions.filter((item) => (versionStates[item.id] ?? 'active') !== 'archived');
  const visibleModules = modules.filter((item) => (moduleStates[item.id] ?? 'active') !== 'archived');

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading curriculum...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Curriculum Builder</h1>
        <p className="text-muted-foreground">Create curriculum versions, modules, and prerequisite rules.</p>
      </div>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-4 text-sm text-amber-900">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Curriculum Version</CardTitle>
          <CardDescription>Create, update, or publish a program curriculum version.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Version Name</Label>
            <Input value={versionName} onChange={(event) => setVersionName(event.target.value)} placeholder="2026 Intake Version" />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleCreateVersion}>Create</Button>
            <Button variant="outline" onClick={handleUpdateVersion} disabled={!versionId}>Update</Button>
            <Button variant="outline" onClick={handlePublishVersion} disabled={!versionId}>Publish</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version Records</CardTitle>
          <CardDescription>Select an active version to manage its modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleVersions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No active curriculum versions found.</div>
          ) : (
            visibleVersions.map((version) => (
              <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-semibold">{version.name}</p>
                  <p className="text-sm text-muted-foreground">Status: {version.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setVersionId(version.id)}>Open</Button>
                  <Button size="sm" variant="outline" onClick={() => { setVersionStates((prev) => ({ ...prev, [version.id]: 'archived' })); pushHistory('CurriculumVersion', version.id, 'archived'); }}>Archive</Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>Add modules to the selected curriculum version.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Curriculum Version</Label>
            <Select value={versionId} onValueChange={setVersionId}>
              <SelectTrigger><SelectValue placeholder="Select version" /></SelectTrigger>
              <SelectContent>{visibleVersions.map((version) => <SelectItem key={version.id} value={version.id}>{version.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Module Title</Label>
              <Input value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Input type="number" min="1" value={moduleSemester} onChange={(event) => setModuleSemester(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input type="number" min="1" value={moduleCredits} onChange={(event) => setModuleCredits(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Supported Delivery Modes</Label>
              <div className="flex flex-wrap gap-2">
                {deliveryModes.map((mode) => {
                  const selected = moduleDeliveryModes.includes(mode.value);
                  return (
                    <Button
                      key={mode.value}
                      type="button"
                      size="sm"
                      variant={selected ? 'default' : 'outline'}
                      onClick={() => setModuleDeliveryModes((prev) => selected ? prev.filter((item) => item !== mode.value) : [...prev, mode.value])}
                    >
                      {mode.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={moduleDescription} onChange={(event) => setModuleDescription(event.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateModule}>Create Module</Button>
            </div>
          </div>

          <div className="space-y-3">
            {visibleModules.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No active modules created yet.</div>
            ) : (
              visibleModules.map((module) => (
                <div key={module.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold">{module.title}</p>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">Semester {module.semester} · {module.credits ?? 3} credits · {(module.supportedDeliveryModes ?? []).map(deliveryModeLabel).join(', ') || 'All modes'}</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedModuleId(module.id)}>Prerequisites</Button>
                    <Button size="sm" variant="outline" onClick={() => { setModuleStates((prev) => ({ ...prev, [module.id]: 'archived' })); pushHistory('CurriculumModule', module.id, 'archived'); }}>Archive</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
          <CardDescription>Connect prerequisite modules to the selected module.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                <SelectContent>{visibleModules.map((module) => <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prerequisite</Label>
              <Select value={selectedPrereqId} onValueChange={setSelectedPrereqId}>
                <SelectTrigger><SelectValue placeholder="Select prerequisite" /></SelectTrigger>
                <SelectContent>{visibleModules.map((module) => <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddPrerequisite}>Add Prerequisite</Button>
            </div>
          </div>
          <div className="space-y-3">
            {prerequisites.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No prerequisites defined for this module.</div>
            ) : (
              prerequisites.map((item) => (
                <div key={`${item.moduleId}-${item.prerequisiteId}`} className="rounded-lg border p-3 text-sm">
                  Prerequisite: {item.prerequisiteTitle ?? item.prerequisiteId}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ImmutableHistoryPanel title="Curriculum history" entries={history} />
    </div>
  );
}
