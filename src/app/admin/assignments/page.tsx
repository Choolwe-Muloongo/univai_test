'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAssignment, getAdminAssignments } from '@/lib/api';
import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';

type RecordState = 'active' | 'archived';

type AssignmentItem = {
  id: number;
  courseId?: string;
  courseTitle?: string | null;
  moduleId?: string | null;
  moduleTitle?: string | null;
  lecturerId?: string;
  lecturerName?: string | null;
  intakeId?: string | null;
  intakeName?: string | null;
  role?: string | null;
};

type OptionItem = {
  id: string;
  title?: string;
  name?: string;
};

type AssignmentData = {
  assignments: AssignmentItem[];
  courses: OptionItem[];
  modules: OptionItem[];
  lecturers: OptionItem[];
  intakes: OptionItem[];
};

const roleOptions = [
  { value: 'lead', label: 'Lead Lecturer' },
  { value: 'assistant', label: 'Assistant Lecturer' },
];

export default function AdminAssignmentsPage() {
  const [data, setData] = useState<AssignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseId, setCourseId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [intakeId, setIntakeId] = useState('');
  const [role, setRole] = useState('lead');
  const [recordStates, setRecordStates] = useState<Record<number, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = (await getAdminAssignments()) as AssignmentData;
        setData(response);
        setCourseId(response.courses?.[0]?.id ?? '');
        setModuleId(response.modules?.[0]?.id ?? '');
        setLecturerId(response.lecturers?.[0]?.id ?? '');
        setIntakeId(response.intakes?.[0]?.id ?? '');
        setRecordStates(Object.fromEntries((response.assignments ?? []).map((item) => [item.id, 'active'])));
      } catch (loadError: any) {
        console.error('Failed to load assignments', loadError);
        setError(loadError?.message ?? 'Could not load lecturer assignments.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const visibleAssignments = useMemo(() => {
    return (data?.assignments ?? []).filter((assignment) => (recordStates[assignment.id] ?? 'active') !== 'archived');
  }, [data?.assignments, recordStates]);

  const pushHistory = (id: number, action: string) => {
    setHistory((prev) => [
      {
        id: `${id}-${Date.now()}`,
        entity: 'Assignment',
        entityId: String(id),
        action,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const handleAssign = async () => {
    if (!courseId || !lecturerId) return;

    try {
      const created = (await createAssignment({
        courseId,
        moduleId: moduleId || null,
        lecturerId,
        intakeId: intakeId || null,
        role,
      })) as AssignmentItem;

      setData((prev) =>
        prev
          ? {
              ...prev,
              assignments: [created, ...prev.assignments],
            }
          : prev
      );
      setRecordStates((prev) => ({ ...prev, [created.id]: 'active' }));
      pushHistory(created.id, 'created');
    } catch (assignError) {
      console.error('Failed to create assignment', assignError);
      setError('Could not create assignment. Check required fields and try again.');
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading assignments...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lecturer Assignments</h1>
          <p className="text-muted-foreground">Assign lecturers to courses, modules, and intakes.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/lecturer-applications">Review Lecturer Applications</Link>
        </Button>
      </div>

      {error ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-4 text-sm text-amber-900">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Create Assignment</CardTitle>
          <CardDescription>Select a lecturer and connect them to academic delivery.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>{(data?.courses ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.title ?? item.name ?? item.id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Module</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
              <SelectContent>{(data?.modules ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.title ?? item.name ?? item.id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lecturer</Label>
            <Select value={lecturerId} onValueChange={setLecturerId}>
              <SelectTrigger><SelectValue placeholder="Select lecturer" /></SelectTrigger>
              <SelectContent>{(data?.lecturers ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name ?? item.title ?? item.id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Intake</Label>
            <Select value={intakeId} onValueChange={setIntakeId}>
              <SelectTrigger><SelectValue placeholder="Select intake" /></SelectTrigger>
              <SelectContent>{(data?.intakes ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name ?? item.title ?? item.id}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{roleOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAssign}>Create Assignment</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>Archive records locally when they are no longer active.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleAssignments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No active assignments found. Create one above or review lecturer applications.
            </div>
          ) : (
            visibleAssignments.map((assignment) => (
              <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{assignment.moduleTitle ?? assignment.courseTitle ?? assignment.courseId}</p>
                  <p className="text-sm text-muted-foreground">
                    Lecturer: {assignment.lecturerName ?? assignment.lecturerId} · Role: {assignment.role ?? 'lead'}
                  </p>
                  <p className="text-xs text-muted-foreground">Intake: {assignment.intakeName ?? assignment.intakeId ?? 'Not assigned'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">active</Badge>
                  <Button size="sm" variant="outline" onClick={() => { setRecordStates((prev) => ({ ...prev, [assignment.id]: 'archived' })); pushHistory(assignment.id, 'archived'); }}>
                    Archive
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ImmutableHistoryPanel title="Assignment history" entries={history} />
    </div>
  );
}
