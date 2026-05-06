'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  createCohort,
  createCohortSection,
  createIntake,
  getCohorts,
  getCurriculumVersions,
  getIntakes,
  getPrograms,
} from '@/lib/api';
import type { Cohort, CurriculumVersion, Intake, Program } from '@/lib/api/types';

const deliveryModes = [
  { value: 'online', label: 'Online' },
  { value: 'campus', label: 'Campus' },
  { value: 'hybrid', label: 'Hybrid' },
];

const intakeStatusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

const cohortStatusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

const sectionStatusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

const timetableFromText = (summary: string) => (summary.trim() ? { summary: summary.trim() } : null);

export default function AdminIntakesPage() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
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

  const [cohortIntakeId, setCohortIntakeId] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [cohortCentre, setCohortCentre] = useState('');
  const [cohortCapacity, setCohortCapacity] = useState('');
  const [cohortTimetable, setCohortTimetable] = useState('');
  const [cohortStatus, setCohortStatus] = useState('planning');

  const [sectionCohortId, setSectionCohortId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [sectionCode, setSectionCode] = useState('');
  const [sectionCapacity, setSectionCapacity] = useState('');
  const [sectionTimetable, setSectionTimetable] = useState('');
  const [sectionStatus, setSectionStatus] = useState('open');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [intakeList, programList, cohortList] = await Promise.all([getIntakes(), getPrograms(), getCohorts()]);
      setIntakes(intakeList);
      setPrograms(programList);
      setCohorts(cohortList);
      setProgramId(programList[0]?.id ?? '');
      setCohortIntakeId(intakeList[0]?.id ?? '');
      setSectionCohortId(cohortList[0]?.id ?? '');
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

  const selectedIntake = useMemo(() => intakes.find((intake) => intake.id === cohortIntakeId), [cohortIntakeId, intakes]);
  const cohortsByIntake = useMemo(() => {
    return intakes.map((intake) => ({
      ...intake,
      cohorts: cohorts.filter((cohort) => cohort.intakeId === intake.id),
    }));
  }, [cohorts, intakes]);

  const handleCreateIntake = async () => {
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
    setCohortIntakeId((created as Intake).id);
    setName('');
    setCampus('');
    setCapacity('');
    setStartDate('');
    setEndDate('');
    setStatus('open');
  };

  const handleCreateCohort = async () => {
    const intake = selectedIntake;
    if (!intake || !cohortName) return;
    const created = await createCohort({
      intakeId: intake.id,
      programId: intake.programId,
      curriculumVersionId: intake.curriculumVersionId ?? null,
      name: cohortName,
      deliveryMode: intake.deliveryMode,
      centre: cohortCentre || intake.campus || null,
      timetable: timetableFromText(cohortTimetable),
      capacity: cohortCapacity ? Number(cohortCapacity) : intake.capacity ?? null,
      status: cohortStatus,
    });
    setCohorts((prev) => [created, ...prev]);
    setSectionCohortId(created.id);
    setCohortName('');
    setCohortCentre('');
    setCohortCapacity('');
    setCohortTimetable('');
    setCohortStatus('planning');
  };

  const handleCreateSection = async () => {
    if (!sectionCohortId || !sectionName) return;
    const created = await createCohortSection(sectionCohortId, {
      name: sectionName,
      code: sectionCode || null,
      timetable: timetableFromText(sectionTimetable),
      capacity: sectionCapacity ? Number(sectionCapacity) : null,
      status: sectionStatus,
    });
    setCohorts((prev) =>
      prev.map((cohort) => (cohort.id === sectionCohortId ? { ...cohort, sections: [...cohort.sections, created] } : cohort))
    );
    setSectionName('');
    setSectionCode('');
    setSectionCapacity('');
    setSectionTimetable('');
    setSectionStatus('open');
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading programme delivery setup...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Intakes, Cohorts & Sections</h1>
        <p className="text-muted-foreground">Create programme delivery structures that can scale across centres and timetables.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Intake</CardTitle>
          <CardDescription>Define the top-level admissions window and schedule.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
              <SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Curriculum Version</Label>
            <Select value={curriculumVersionId} onValueChange={setCurriculumVersionId}>
              <SelectTrigger><SelectValue placeholder="Select curriculum version" /></SelectTrigger>
              <SelectContent>{versions.map((version) => <SelectItem key={version.id} value={version.id}>{version.name} ({version.status})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Intake Name</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Jan 2026 Intake" /></div>
          <div className="space-y-2">
            <Label>Delivery Mode</Label>
            <Select value={deliveryMode} onValueChange={setDeliveryMode}>
              <SelectTrigger><SelectValue placeholder="Select delivery mode" /></SelectTrigger>
              <SelectContent>{deliveryModes.map((mode) => <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Campus / Centre (optional)</Label><Input value={campus} onChange={(event) => setCampus(event.target.value)} placeholder="Lusaka Campus" /></div>
          <div className="space-y-2"><Label>Capacity (optional)</Label><Input type="number" min="1" value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="200" /></div>
          <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
          <div className="space-y-2"><Label>End Date</Label><Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>{intakeStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end"><Button onClick={handleCreateIntake}>Create Intake</Button></div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Cohort</CardTitle>
            <CardDescription>Cohorts carry programme, curriculum, delivery mode, centre, timetable, capacity, and status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Intake</Label>
              <Select value={cohortIntakeId} onValueChange={setCohortIntakeId}>
                <SelectTrigger><SelectValue placeholder="Select intake" /></SelectTrigger>
                <SelectContent>{intakes.map((intake) => <SelectItem key={intake.id} value={intake.id}>{intake.name} ({intake.programId})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Cohort Name</Label><Input value={cohortName} onChange={(event) => setCohortName(event.target.value)} placeholder="CS Jan 2026 - Lusaka" /></div>
              <div className="space-y-2"><Label>Centre</Label><Input value={cohortCentre} onChange={(event) => setCohortCentre(event.target.value)} placeholder={selectedIntake?.campus ?? 'Online'} /></div>
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" min="1" value={cohortCapacity} onChange={(event) => setCohortCapacity(event.target.value)} placeholder={selectedIntake?.capacity?.toString() ?? '120'} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={cohortStatus} onValueChange={setCohortStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{cohortStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Timetable Summary</Label><Textarea value={cohortTimetable} onChange={(event) => setCohortTimetable(event.target.value)} placeholder="Mon/Wed 18:00-20:00; Saturday lab block" /></div>
            <Button onClick={handleCreateCohort} disabled={!cohortIntakeId || !cohortName}>Create Cohort</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Section</CardTitle>
            <CardDescription>Split a cohort into smaller teachable groups with optional timetable overrides.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cohort</Label>
              <Select value={sectionCohortId} onValueChange={setSectionCohortId}>
                <SelectTrigger><SelectValue placeholder="Select cohort" /></SelectTrigger>
                <SelectContent>{cohorts.map((cohort) => <SelectItem key={cohort.id} value={cohort.id}>{cohort.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Section Name</Label><Input value={sectionName} onChange={(event) => setSectionName(event.target.value)} placeholder="Section A" /></div>
              <div className="space-y-2"><Label>Code</Label><Input value={sectionCode} onChange={(event) => setSectionCode(event.target.value)} placeholder="A" /></div>
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" min="1" value={sectionCapacity} onChange={(event) => setSectionCapacity(event.target.value)} placeholder="40" /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={sectionStatus} onValueChange={setSectionStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{sectionStatusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Timetable Summary</Label><Textarea value={sectionTimetable} onChange={(event) => setSectionTimetable(event.target.value)} placeholder="Tue/Thu seminar group" /></div>
            <Button onClick={handleCreateSection} disabled={!sectionCohortId || !sectionName}>Create Section</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Plan</CardTitle>
          <CardDescription>Active and upcoming intakes with their cohorts and sections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cohortsByIntake.map((intake) => (
            <div key={intake.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{intake.name}</p>
                  <p className="text-sm text-muted-foreground">Program: {intake.programId} · {intake.deliveryMode}{intake.capacity ? ` · Capacity ${intake.capacity}` : ''}</p>
                </div>
                <Badge variant={intake.status === 'open' || intake.status === 'active' ? 'default' : 'outline'}>{intake.status}</Badge>
              </div>
              <div className="mt-4 space-y-3">
                {intake.cohorts.map((cohort) => (
                  <div key={cohort.id} className="rounded-md border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{cohort.name}</p>
                        <p className="text-xs text-muted-foreground">{cohort.deliveryMode} · {cohort.centre ?? 'No centre'} · {cohort.capacity ?? 'Unlimited'} seats</p>
                        {cohort.timetable?.summary ? <p className="mt-1 text-xs text-muted-foreground">{String(cohort.timetable.summary)}</p> : null}
                      </div>
                      <Badge variant="secondary">{cohort.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cohort.sections.map((section) => (
                        <Badge key={section.id} variant="outline">{section.name}{section.capacity ? ` · ${section.capacity}` : ''}</Badge>
                      ))}
                      {cohort.sections.length === 0 ? <span className="text-xs text-muted-foreground">No sections yet</span> : null}
                    </div>
                  </div>
                ))}
                {intake.cohorts.length === 0 ? <p className="text-sm text-muted-foreground">No cohorts assigned to this intake yet.</p> : null}
              </div>
            </div>
          ))}
          {intakes.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">No intakes created yet</p>
              <p className="mt-1">Next action: create your first intake, then attach a cohort and optional sections.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
