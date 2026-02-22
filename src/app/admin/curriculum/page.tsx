'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
import type { CurriculumModule, CurriculumVersion } from '@/lib/api/types';
import type { Program } from '@/lib/api/types';

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
  const [moduleTrack, setModuleTrack] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedPrereqId, setSelectedPrereqId] = useState('');
  const [prerequisites, setPrerequisites] = useState<{ moduleId: string; prerequisiteId: string; prerequisiteTitle?: string | null }[]>([]);

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
        setVersionId(versionList[0]?.id ?? '');
      }
      setLoading(false);
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

  useEffect(() => {
    const loadPrereqs = async () => {
      if (!selectedModuleId) {
        setPrerequisites([]);
        return;
      }
      const data = await getModulePrerequisites(selectedModuleId);
      setPrerequisites(data);
    };
    loadPrereqs();
  }, [selectedModuleId]);

  const handleCreateVersion = async () => {
    if (!programId || !versionName) return;
    const created = await createCurriculumVersion({ programId, name: versionName, status: 'draft' });
    setVersions((prev) => [created, ...prev]);
    setVersionId(created.id);
    setVersionName('');
  };

  const handlePublishVersion = async () => {
    if (!versionId) return;
    const updated = await updateCurriculumVersion(versionId, { status: 'published' });
    setVersions((prev) => prev.map((version) => (version.id === updated.id ? updated : version)));
  };

  const handleCreateModule = async () => {
    if (!versionId || !moduleTitle || !moduleDescription) return;
    const created = await createCurriculumModule(versionId, {
      title: moduleTitle,
      description: moduleDescription,
      credits: Number(moduleCredits) || 3,
      semester: Number(moduleSemester),
      isCore: true,
      track: moduleTrack || null,
    });
    setModules((prev) => [...prev, created]);
    setModuleTitle('');
    setModuleDescription('');
    setModuleTrack('');
    setModuleCredits('3');
  };

  const handleAddPrerequisite = async () => {
    if (!selectedModuleId || !selectedPrereqId) return;
    await addModulePrerequisite(selectedModuleId, selectedPrereqId);
    const data = await getModulePrerequisites(selectedModuleId);
    setPrerequisites(data);
    setSelectedPrereqId('');
  };


  const selectedVersion = versions.find((version) => version.id === versionId);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading curriculum...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Curriculum Builder</h1>
        <p className="text-muted-foreground">Create curriculum versions, modules, and prerequisites.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Curriculum Version</CardTitle>
          <CardDescription>Draft a new version for the selected program.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
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
            <Label>Version Name</Label>
            <Input value={versionName} onChange={(event) => setVersionName(event.target.value)} placeholder="Curriculum 2026" />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleCreateVersion}>Create Version</Button>
            <Button variant="outline" onClick={handlePublishVersion} disabled={!selectedVersion}>
              Publish Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modules</CardTitle>
          <CardDescription>Manage modules within the selected curriculum.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Module Title</Label>
              <Input value={moduleTitle} onChange={(event) => setModuleTitle(event.target.value)} placeholder="Intro to AI" />
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Input type="number" min="1" value={moduleSemester} onChange={(event) => setModuleSemester(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Credits</Label>
              <Input type="number" min="1" value={moduleCredits} onChange={(event) => setModuleCredits(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea value={moduleDescription} onChange={(event) => setModuleDescription(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Track (optional)</Label>
              <Input value={moduleTrack} onChange={(event) => setModuleTrack(event.target.value)} placeholder="AI & Data Science" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateModule}>Add Module</Button>
            </div>
          </div>

          <div className="space-y-3">
            {modules.map((module) => (
              <div key={module.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{module.title}</p>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Semester {module.semester} · {module.credits ?? 3} credits {module.track ? `- ${module.track}` : ''}
                  </div>
                </div>
              </div>
            ))}
            {modules.length === 0 && (
              <p className="text-sm text-muted-foreground">No modules created yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
          <CardDescription>Define module dependencies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prerequisite</Label>
              <Select value={selectedPrereqId} onValueChange={setSelectedPrereqId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select prerequisite" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddPrerequisite}>Add Prerequisite</Button>
            </div>
          </div>

          <div className="space-y-3">
            {prerequisites.map((item) => (
              <div key={`${item.moduleId}-${item.prerequisiteId}`} className="rounded-lg border p-3 text-sm">
                Prerequisite: {item.prerequisiteTitle ?? item.prerequisiteId}
              </div>
            ))}
            {selectedModuleId && prerequisites.length === 0 && (
              <p className="text-sm text-muted-foreground">No prerequisites defined yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

