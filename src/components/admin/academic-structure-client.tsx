'use client';

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react';

import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  createAcademicYear,
  createCourseUnit,
  createDepartment,
  createProgrammeCourse,
  createSemester,
  getAdminAcademicStructure,
  getPrograms,
  getSchools,
} from '@/lib/api';
import type { AdminAcademicStructureResponse, Program, School } from '@/lib/api/types';

const blankStructure: AdminAcademicStructureResponse = {
  departments: [],
  academicYears: [],
  semesters: [],
  programmeCourses: [],
  courseUnits: [],
  learningModeRules: [],
  venues: [],
  partnerInstitutions: [],
  practicalSessions: [],
};

export function AcademicStructureClient() {
  const [structure, setStructure] = useState<AdminAcademicStructureResponse>(blankStructure);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [departmentForm, setDepartmentForm] = useState({ schoolId: '', name: '', description: '' });
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '', status: 'draft' });
  const [semesterForm, setSemesterForm] = useState({ academicYearId: '', name: '', number: '1', status: 'planned' });
  const [programmeCourseForm, setProgrammeCourseForm] = useState({
    programId: '',
    departmentId: '',
    academicYearId: '',
    semesterId: '',
    yearLevel: '1',
    semesterNumber: '',
    durationType: 'one_semester',
    deliveryMode: 'online',
    credits: '0',
    status: 'draft',
  });
  const [unitForm, setUnitForm] = useState({
    programmeCourseId: '',
    semesterId: '',
    title: '',
    unitNumber: '1',
    estimatedHours: '',
    status: 'draft',
  });

  async function refresh() {
    const [structureData, schoolData, programData] = await Promise.all([
      getAdminAcademicStructure(),
      getSchools(),
      getPrograms(),
    ]);
    setStructure(structureData);
    setSchools(schoolData);
    setPrograms(programData);
  }

  useEffect(() => {
    let mounted = true;
    refresh()
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Academic structure is unavailable.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const activeYearOptions = useMemo(
    () => structure.academicYears.map((year) => ({ value: String(year.id), label: year.name })),
    [structure.academicYears]
  );

  async function submit(label: string, handler: () => Promise<unknown>) {
    setSaving(label);
    setError(null);
    try {
      await handler();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this academic structure item.');
    } finally {
      setSaving(null);
    }
  }

  function onDepartmentSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('department', async () => {
      await createDepartment(departmentForm);
      setDepartmentForm({ schoolId: departmentForm.schoolId, name: '', description: '' });
    });
  }

  function onYearSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('year', async () => {
      await createAcademicYear(yearForm);
      setYearForm({ name: '', startDate: '', endDate: '', status: 'draft' });
    });
  }

  function onSemesterSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('semester', async () => {
      await createSemester({
        academicYearId: Number(semesterForm.academicYearId),
        name: semesterForm.name,
        number: Number(semesterForm.number),
        status: semesterForm.status,
      });
      setSemesterForm({ ...semesterForm, name: '', number: '1' });
    });
  }

  function onProgrammeCourseSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('programme course', async () => {
      await createProgrammeCourse({
        programId: programmeCourseForm.programId,
        departmentId: programmeCourseForm.departmentId ? Number(programmeCourseForm.departmentId) : null,
        academicYearId: programmeCourseForm.academicYearId ? Number(programmeCourseForm.academicYearId) : null,
        semesterId: programmeCourseForm.semesterId ? Number(programmeCourseForm.semesterId) : null,
        yearLevel: Number(programmeCourseForm.yearLevel),
        semesterNumber: programmeCourseForm.semesterNumber ? Number(programmeCourseForm.semesterNumber) : null,
        durationType: programmeCourseForm.durationType,
        deliveryMode: programmeCourseForm.deliveryMode,
        credits: Number(programmeCourseForm.credits),
        status: programmeCourseForm.status,
      });
    });
  }

  function onUnitSubmit(event: FormEvent) {
    event.preventDefault();
    void submit('course unit', async () => {
      await createCourseUnit({
        programmeCourseId: Number(unitForm.programmeCourseId),
        semesterId: unitForm.semesterId ? Number(unitForm.semesterId) : null,
        title: unitForm.title,
        unitNumber: Number(unitForm.unitNumber),
        estimatedHours: unitForm.estimatedHours ? Number(unitForm.estimatedHours) : null,
        status: unitForm.status,
      });
      setUnitForm({ ...unitForm, title: '', estimatedHours: '' });
    });
  }

  if (loading) return <PageLoading message="Loading academic structure..." />;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">Academic Structure</p>
        <h1 className="text-3xl font-bold text-foreground">Schools, departments and programme courses</h1>
        <p className="max-w-3xl text-muted-foreground">
          Build the formal university hierarchy without locking courses into one rigid semester model.
        </p>
      </section>

      {error ? <PageError message={error} /> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Departments" value={structure.departments.length} />
        <SummaryCard label="Academic Years" value={structure.academicYears.length} />
        <SummaryCard label="Semesters" value={structure.semesters.length} />
        <SummaryCard label="Programme Courses" value={structure.programmeCourses.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Department</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onDepartmentSubmit}>
              <Field label="School / Faculty">
                <Select value={departmentForm.schoolId} onValueChange={(schoolId) => setDepartmentForm((form) => ({ ...form, schoolId }))}>
                  <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
                  <SelectContent>{schools.map((school) => <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Department name">
                <Input required value={departmentForm.name} onChange={(event) => setDepartmentForm((form) => ({ ...form, name: event.target.value }))} />
              </Field>
              <Field label="Description">
                <Input value={departmentForm.description} onChange={(event) => setDepartmentForm((form) => ({ ...form, description: event.target.value }))} />
              </Field>
              <Button disabled={saving === 'department' || !departmentForm.schoolId}>{saving === 'department' ? 'Saving...' : 'Create department'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Year & Semester</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onYearSubmit}>
              <Field label="Year name"><Input required value={yearForm.name} onChange={(event) => setYearForm((form) => ({ ...form, name: event.target.value }))} placeholder="2026 Academic Year" /></Field>
              <Field label="Status"><Input value={yearForm.status} onChange={(event) => setYearForm((form) => ({ ...form, status: event.target.value }))} /></Field>
              <Field label="Start date"><Input type="date" value={yearForm.startDate} onChange={(event) => setYearForm((form) => ({ ...form, startDate: event.target.value }))} /></Field>
              <Field label="End date"><Input type="date" value={yearForm.endDate} onChange={(event) => setYearForm((form) => ({ ...form, endDate: event.target.value }))} /></Field>
              <Button className="sm:col-span-2" disabled={saving === 'year'}>{saving === 'year' ? 'Saving...' : 'Create academic year'}</Button>
            </form>

            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSemesterSubmit}>
              <Field label="Academic year">
                <Select value={semesterForm.academicYearId} onValueChange={(academicYearId) => setSemesterForm((form) => ({ ...form, academicYearId }))}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>{activeYearOptions.map((year) => <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Number"><Input required min={1} type="number" value={semesterForm.number} onChange={(event) => setSemesterForm((form) => ({ ...form, number: event.target.value }))} /></Field>
              <Field label="Semester name"><Input required value={semesterForm.name} onChange={(event) => setSemesterForm((form) => ({ ...form, name: event.target.value }))} placeholder="Semester 1" /></Field>
              <Field label="Status"><Input value={semesterForm.status} onChange={(event) => setSemesterForm((form) => ({ ...form, status: event.target.value }))} /></Field>
              <Button className="sm:col-span-2" disabled={saving === 'semester' || !semesterForm.academicYearId}>{saving === 'semester' ? 'Saving...' : 'Create semester'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Programme Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onProgrammeCourseSubmit}>
              <Field label="Programme">
                <Select value={programmeCourseForm.programId} onValueChange={(programId) => setProgrammeCourseForm((form) => ({ ...form, programId }))}>
                  <SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger>
                  <SelectContent>{programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Department">
                <Select value={programmeCourseForm.departmentId} onValueChange={(departmentId) => setProgrammeCourseForm((form) => ({ ...form, departmentId }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{structure.departments.map((department) => <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Academic year">
                <Select value={programmeCourseForm.academicYearId} onValueChange={(academicYearId) => setProgrammeCourseForm((form) => ({ ...form, academicYearId }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{structure.academicYears.map((year) => <SelectItem key={year.id} value={String(year.id)}>{year.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Semester">
                <Select value={programmeCourseForm.semesterId} onValueChange={(semesterId) => setProgrammeCourseForm((form) => ({ ...form, semesterId }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{structure.semesters.map((semester) => <SelectItem key={semester.id} value={String(semester.id)}>{semester.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Duration type"><Input value={programmeCourseForm.durationType} onChange={(event) => setProgrammeCourseForm((form) => ({ ...form, durationType: event.target.value }))} /></Field>
              <Field label="Delivery mode"><Input value={programmeCourseForm.deliveryMode} onChange={(event) => setProgrammeCourseForm((form) => ({ ...form, deliveryMode: event.target.value }))} /></Field>
              <Field label="Year level"><Input type="number" min={1} value={programmeCourseForm.yearLevel} onChange={(event) => setProgrammeCourseForm((form) => ({ ...form, yearLevel: event.target.value }))} /></Field>
              <Field label="Credits"><Input type="number" min={0} value={programmeCourseForm.credits} onChange={(event) => setProgrammeCourseForm((form) => ({ ...form, credits: event.target.value }))} /></Field>
              <Button className="sm:col-span-2" disabled={saving === 'programme course' || !programmeCourseForm.programId}>{saving === 'programme course' ? 'Saving...' : 'Create programme course'}</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Course Unit / Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={onUnitSubmit}>
              <Field label="Programme course">
                <Select value={unitForm.programmeCourseId} onValueChange={(programmeCourseId) => setUnitForm((form) => ({ ...form, programmeCourseId }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{structure.programmeCourses.map((course) => <SelectItem key={course.id} value={String(course.id)}>{course.programTitle || course.courseTitle || `Course ${course.id}`}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Semester">
                <Select value={unitForm.semesterId} onValueChange={(semesterId) => setUnitForm((form) => ({ ...form, semesterId }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{structure.semesters.map((semester) => <SelectItem key={semester.id} value={String(semester.id)}>{semester.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Unit title"><Input required value={unitForm.title} onChange={(event) => setUnitForm((form) => ({ ...form, title: event.target.value }))} /></Field>
              <Field label="Unit number"><Input type="number" min={1} value={unitForm.unitNumber} onChange={(event) => setUnitForm((form) => ({ ...form, unitNumber: event.target.value }))} /></Field>
              <Field label="Estimated hours"><Input type="number" min={0} value={unitForm.estimatedHours} onChange={(event) => setUnitForm((form) => ({ ...form, estimatedHours: event.target.value }))} /></Field>
              <Button className="sm:col-span-2" disabled={saving === 'course unit' || !unitForm.programmeCourseId}>{saving === 'course unit' ? 'Saving...' : 'Create unit'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ListCard title="Departments" items={structure.departments.map((department) => `${department.name} - ${department.schoolName || department.schoolId}`)} />
        <ListCard title="Programme Courses" items={structure.programmeCourses.map((course) => `${course.programTitle || course.programId} - ${course.durationType} - ${course.deliveryMode}`)} />
        <ListCard title="Semesters" items={structure.semesters.map((semester) => `${semester.academicYearName || 'Academic year'} - ${semester.name}`)} />
        <ListCard title="Course Units" items={structure.courseUnits.map((unit) => `${unit.unitNumber}. ${unit.title}`)} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length ? items.slice(0, 8).map((item) => (
          <div key={item} className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">{item}</div>
        )) : <p className="text-sm text-muted-foreground">No records yet.</p>}
      </CardContent>
    </Card>
  );
}
