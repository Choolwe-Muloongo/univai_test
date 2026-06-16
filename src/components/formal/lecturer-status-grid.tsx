'use client';

import { useEffect, useState } from 'react';
import { getLecturerDashboard } from '@/lib/api';

type Metric = { key?: string; label?: string; value?: string | number; note?: string | null };
type ManagedCourse = { id?: string | number; title?: string; studentCount?: number; avgProgress?: number; intakeName?: string | null };

type LecturerData = {
  metrics?: Metric[];
  managedCourses?: ManagedCourse[];
};

export function LecturerStatusGrid() {
  const [data, setData] = useState<LecturerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLecturerDashboard()
      .then((payload) => setData(payload as LecturerData))
      .catch(() => setError('Live lecturer data is not available yet.'));
  }, []);

  const metrics = data?.metrics ?? [];
  const courses = data?.managedCourses ?? [];

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-lg border p-4 text-sm text-muted-foreground">{error}</div> : null}
      <div className="grid gap-3 md:grid-cols-3">
        {(metrics.length ? metrics : [
          { label: 'Courses', value: courses.length },
          { label: 'Students', value: courses.reduce((sum, item) => sum + Number(item.studentCount ?? 0), 0) },
          { label: 'Reviews', value: 'Ready' },
        ]).map((metric) => (
          <div key={metric.label} className="rounded-lg border p-4">
            <p className="font-semibold">{metric.label}</p>
            <p className="text-2xl font-bold">{metric.value ?? 0}</p>
            <p className="text-sm text-muted-foreground">{metric.note ?? 'Formal delivery metric'}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4"><p className="font-semibold">Builder workbench</p><p className="text-sm text-muted-foreground">Manual, JSON, AI, and instructor builders are available from the sidebar.</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Class delivery</p><p className="text-sm text-muted-foreground">Create sessions, venue details, live links, attendance, and delivery mode notes.</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Assessment flow</p><p className="text-sm text-muted-foreground">Prepare coursework, questions, grading, and student progress records.</p></div>
      </div>
      <div className="space-y-2">
        {courses.map((course) => (
          <div key={String(course.id)} className="rounded-lg border p-4">
            <p className="font-semibold">{course.title ?? 'Course'}</p>
            <p className="text-sm text-muted-foreground">{course.studentCount ?? 0} students · {course.avgProgress ?? 0}% average progress {course.intakeName ? `· ${course.intakeName}` : ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
