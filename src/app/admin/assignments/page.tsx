'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAssignment, getAdminAssignments } from '@/lib/api';
import type { AdminAssignment, AdminAssignmentsResponse } from '@/lib/api/types';
import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';

const roles = [
  { value: 'lead', label: 'Lead Lecturer' },
  { value: 'assistant', label: 'Assistant Lecturer' },
];

type RecordState = 'active' | 'archived' | 'deleted';

export default function AdminAssignmentsPage() {
  const [data, setData] = useState<AdminAssignmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [intakeId, setIntakeId] = useState('');
  const [role, setRole] = useState('lead');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [recordStates, setRecordStates] = useState<Record<number, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getAdminAssignments();
      setData(response);
      setCourseId(response.courses[0]?.id ?? '');
      setModuleId(response.modules[0]?.id ?? '');
      setLecturerId(response.lecturers[0]?.id ?? '');
      setIntakeId(response.intakes[0]?.id ?? '');
      setRecordStates(Object.fromEntries(response.assignments.map((a) => [a.id, 'active'])));
      setLoading(false);
    };
    load();
  }, []);

  const pushHistory = (id: number, action: string) => setHistory((prev) => [{ id: `${id}-${Date.now()}`, entity: 'Assignment', entityId: String(id), action, timestamp: new Date().toISOString() }, ...prev]);

  const handleAssign = async () => {
    if (!courseId || !lecturerId) return;
    const created = await createAssignment({ courseId, moduleId: moduleId || null, lecturerId, intakeId: intakeId || null, role });
    setData((prev) => prev ? { ...prev, assignments: [created as AdminAssignment, ...prev.assignments] } : prev);
    setRecordStates((prev) => ({ ...prev, [(created as AdminAssignment).id]: 'active' }));
  };

  const applyBulkAssignmentUpdate = () => {
    if (!data || selectedIds.length === 0) return;
    setData({
      ...data,
      assignments: data.assignments.map((assignment) => selectedIds.includes(assignment.id)
        ? { ...assignment, lecturerId, lecturerName: data.lecturers.find((l) => l.id === lecturerId)?.name, moduleId, moduleTitle: data.modules.find((m) => m.id === moduleId)?.title, role }
        : assignment),
    });
    selectedIds.forEach((id) => pushHistory(id, `bulk reassigned lecturer/module (${lecturerId}/${moduleId})`));
    setSelectedIds([]);
  };

  const setLifecycleState = (id: number, next: RecordState) => {
    setRecordStates((prev) => ({ ...prev, [id]: next }));
    pushHistory(id, next === 'active' ? 'restored' : next === 'archived' ? 'archived' : 'hard deleted');
  };

  if (loading || !data) return <p className="text-sm text-muted-foreground">Loading assignments...</p>;

  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold tracking-tight">Lecturer Assignments</h1><p className="text-muted-foreground">Create, update, archive, restore, and bulk manage assignments.</p></div>

      <Card>
        <CardHeader><CardTitle>New Assignment</CardTitle><CardDescription>Create records.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>Program</Label><Select value={courseId} onValueChange={setCourseId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{data.courses.map((course) => <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Module</Label><Select value={moduleId} onValueChange={setModuleId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{data.modules.map((module) => <SelectItem key={module.id} value={module.id}>{module.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Lecturer</Label><Select value={lecturerId} onValueChange={setLecturerId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{data.lecturers.map((lecturer) => <SelectItem key={lecturer.id} value={lecturer.id}>{lecturer.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Intake</Label><Select value={intakeId} onValueChange={setIntakeId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{data.intakes.map((intake) => <SelectItem key={intake.id} value={intake.id}>{intake.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Role</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex items-end"><Button onClick={handleAssign}>Create Assignment</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bulk lecturer/module operations</CardTitle><CardDescription>Operationally required reassignment controls.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={applyBulkAssignmentUpdate} disabled={selectedIds.length === 0}>Apply to selected ({selectedIds.length})</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Current Assignments</CardTitle><CardDescription>Read, update, deactivate/archive, restore, and hard-delete.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {data.assignments.map((assignment) => {
            const state = recordStates[assignment.id] ?? 'active';
            if (state === 'deleted') return null;
            return (
              <div key={assignment.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Checkbox checked={selectedIds.includes(assignment.id)} onCheckedChange={(checked) => setSelectedIds((prev) => checked ? [...prev, assignment.id] : prev.filter((id) => id !== assignment.id))} />
                    <div>
                      <p className="font-semibold">{assignment.moduleTitle ?? assignment.courseTitle ?? assignment.courseId}</p>
                      <p className="text-sm text-muted-foreground">Lecturer: {assignment.lecturerName ?? assignment.lecturerId} · {assignment.role ?? 'lead'} · {state}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {state === 'active' ? <Button size="sm" variant="outline" onClick={() => setLifecycleState(assignment.id, 'archived')}>Archive</Button> : <Button size="sm" variant="outline" onClick={() => setLifecycleState(assignment.id, 'active')}>Restore</Button>}
                  <Button size="sm" variant="destructive" onClick={() => setLifecycleState(assignment.id, 'deleted')}>Hard Delete</Button>
                </div>
              </div>
            );
          })}
            </div>
          ))}
          {data.assignments.length === 0 && (
            <div className="rounded-lg border border-dashed p-4">
              <p className="font-medium">No assignments created yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Next action: confirm lecturers, modules, and intakes are available, then create the first assignment.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/lecturer-applications">Review lecturer pipeline</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/intakes">Open intake setup</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ImmutableHistoryPanel title="Assignment destructive history" entries={history} />
    </div>
  );
}
