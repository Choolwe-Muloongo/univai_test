'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAdminAssignments, createAssignment } from '@/lib/api';
import type { AdminAssignment, AdminAssignmentsResponse } from '@/lib/api/types';

const roles = [
  { value: 'lead', label: 'Lead Lecturer' },
  { value: 'assistant', label: 'Assistant Lecturer' },
];

export default function AdminAssignmentsPage() {
  const [data, setData] = useState<AdminAssignmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [courseId, setCourseId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [lecturerId, setLecturerId] = useState('');
  const [intakeId, setIntakeId] = useState('');
  const [role, setRole] = useState('lead');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await getAdminAssignments();
      setData(response);
      setCourseId(response.courses[0]?.id ?? '');
      const firstModule = response.modules.find((module) => module.programId === response.courses[0]?.id);
      setModuleId(firstModule?.id ?? '');
      setLecturerId(response.lecturers[0]?.id ?? '');
      setIntakeId(response.intakes[0]?.id ?? '');
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!data) return;
    const availableModules = data.modules.filter((module) => module.programId === courseId);
    setModuleId(availableModules[0]?.id ?? '');
  }, [courseId, data]);

  const handleAssign = async () => {
    if (!courseId || !lecturerId) return;
    const created = await createAssignment({
      courseId,
      moduleId: moduleId || null,
      lecturerId,
      intakeId: intakeId || null,
      role,
    });
    setData((prev) =>
      prev
        ? { ...prev, assignments: [created as AdminAssignment, ...prev.assignments] }
        : prev
    );
  };

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground">Loading assignments...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lecturer Assignments</h1>
        <p className="text-muted-foreground">Assign lecturers to intakes and courses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Assignment</CardTitle>
          <CardDescription>Match lecturers with the right intake.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Program</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {data.courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Module (Semester)</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {data.modules
                  .filter((module) => module.programId === courseId)
                  .map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      Semester {module.semester} - {module.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lecturer</Label>
            <Select value={lecturerId} onValueChange={setLecturerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select lecturer" />
              </SelectTrigger>
              <SelectContent>
                {data.lecturers.map((lecturer) => (
                  <SelectItem key={lecturer.id} value={lecturer.id}>
                    {lecturer.name} ({lecturer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Intake</Label>
            <Select value={intakeId} onValueChange={setIntakeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select intake" />
              </SelectTrigger>
              <SelectContent>
                {data.intakes.map((intake) => (
                  <SelectItem key={intake.id} value={intake.id}>
                    {intake.name} - {intake.deliveryMode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleAssign}>Assign Lecturer</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>All active lecturer assignments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {assignment.moduleTitle ?? assignment.courseTitle ?? assignment.courseId}
                  </p>
                  {assignment.moduleSemester && (
                    <p className="text-xs text-muted-foreground">
                      Semester {assignment.moduleSemester} - Program {assignment.programId ?? assignment.courseId}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Lecturer: {assignment.lecturerName ?? assignment.lecturerId}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {assignment.intakeName ?? 'No intake'} - {assignment.role ?? 'lead'}
                </div>
              </div>
            </div>
          ))}
          {data.assignments.length === 0 && (
            <p className="text-sm text-muted-foreground">No assignments created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

