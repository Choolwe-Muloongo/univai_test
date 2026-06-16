'use client';

import { useEffect, useState } from 'react';
import { getStudentAcademicGate, type StudentAcademicGate } from '@/lib/api/academic-gate';

function fmt(value?: string | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function StudentStatusGrid() {
  const [gate, setGate] = useState<StudentAcademicGate | null>(null);

  useEffect(() => {
    getStudentAcademicGate().then(setGate);
  }, []);

  const calendar = gate?.calendar ?? {};
  const permissions = gate?.permissions ?? {};

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4"><p className="font-semibold">Academic status</p><p className="text-sm text-muted-foreground">{gate?.academicStatus ?? 'Loading'}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Intake</p><p className="text-sm text-muted-foreground">{gate?.intake?.name ?? 'Not assigned'}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Delivery</p><p className="text-sm text-muted-foreground">{gate?.deliveryRules?.label ?? 'Loading'}</p></div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border p-4"><p className="font-semibold">Classes</p><p className="text-sm text-muted-foreground">{fmt(calendar.classesStartDate)}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Exams</p><p className="text-sm text-muted-foreground">{fmt(calendar.examStartsAt)}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Results</p><p className="text-sm text-muted-foreground">{fmt(calendar.resultsReleaseDate)}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Progression</p><p className="text-sm text-muted-foreground">{fmt(calendar.progressionOpensAt)}</p></div>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border p-4">Modules: {permissions.canViewModules ? 'Open' : 'Closed'}</div>
        <div className="rounded-lg border p-4">Timetable: {permissions.canViewTimetable ? 'Open' : 'Closed'}</div>
        <div className="rounded-lg border p-4">Exam: {permissions.canWriteExam ? 'Open' : 'Closed'}</div>
        <div className="rounded-lg border p-4">Results: {permissions.canViewResults ? 'Open' : 'Closed'}</div>
      </div>
    </div>
  );
}
