'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getIntakes, getPrograms, createIntake, getCurriculumVersions } from '@/lib/api';
import type { Intake } from '@/lib/api/types';
import type { Program } from '@/lib/api/types';
import type { CurriculumVersion } from '@/lib/api/types';

const deliveryModes = [
  { value: 'online', label: 'Online' },
  { value: 'campus', label: 'Campus' },
  { value: 'hybrid', label: 'Hybrid' },
];

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

export default function AdminIntakesPage() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [versions, setVersions] = useState<CurriculumVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const [programId, setProgramId] = useState('');
  const [curriculumVersionId, setCurriculumVersionId] = useState('');
  const [name, setName] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('hybrid');
  const [campus, setCampus] = useState('');
  const [capacity, setCapacity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('open');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [intakeList, programList] = await Promise.all([getIntakes(), getPrograms()]);
      setIntakes(intakeList);
      setPrograms(programList);
      setProgramId(programList[0]?.id ?? '');
      if (programList[0]?.id) {
        const versionList = await getCurriculumVersions(programList[0].id);
        setVersions(versionList);
        setCurriculumVersionId(versionList[0]?.id ?? '');
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const loadVersions = async () => {
      if (!programId) {
        setVersions([]);
        setCurriculumVersionId('');
        return;
      }
      const versionList = await getCurriculumVersions(programId);
      setVersions(versionList);
      setCurriculumVersionId(versionList[0]?.id ?? '');
    };
    loadVersions();
  }, [programId]);

  const handleCreate = async () => {
    if (!programId || !name || !startDate) return;
    const created = await createIntake({
      programId,
      curriculumVersionId: curriculumVersionId || null,
      name,
      deliveryMode,
      campus: campus || null,
      capacity: capacity ? Number(capacity) : null,
      startDate,
      endDate: endDate || null,
      status,
    });
    setIntakes((prev) => [created as Intake, ...prev]);
    setName('');
    setCampus('');
    setCapacity('');
    setStartDate('');
    setEndDate('');
    setStatus('open');
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading intakes...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Program Intakes</h1>
        <p className="text-muted-foreground">Create and manage intakes for hybrid delivery.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Intake</CardTitle>
          <CardDescription>Define the intake schedule and delivery mode.</CardDescription>
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
            <Select value={curriculumVersionId} onValueChange={setCurriculumVersionId}>
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
          <div className="space-y-2">
            <Label>Intake Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jan 2026 Intake" />
          </div>
          <div className="space-y-2">
            <Label>Delivery Mode</Label>
            <Select value={deliveryMode} onValueChange={setDeliveryMode}>
              <SelectTrigger>
                <SelectValue placeholder="Select delivery mode" />
              </SelectTrigger>
              <SelectContent>
                {deliveryModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Campus (optional)</Label>
            <Input value={campus} onChange={(event) => setCampus(event.target.value)} placeholder="Lusaka Campus" />
          </div>
          <div className="space-y-2">
            <Label>Capacity (optional)</Label>
            <Input
              type="number"
              min="1"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="200"
            />
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate}>Create Intake</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Intakes</CardTitle>
          <CardDescription>Active and upcoming intakes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {intakes.map((intake) => (
            <div key={intake.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{intake.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Program: {intake.programId} - {intake.deliveryMode}
                    {intake.capacity ? ` - Capacity ${intake.capacity}` : ''}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {intake.startDate} {intake.endDate ? `-> ${intake.endDate}` : ''} - {intake.status}
                </div>
              </div>
            </div>
          ))}
          {intakes.length === 0 && (
            <p className="text-sm text-muted-foreground">No intakes created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

