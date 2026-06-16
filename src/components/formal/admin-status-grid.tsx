'use client';

import { useEffect, useState } from 'react';
import { getAdminAcademicStructure, getApplications, getIntakes, getPrograms } from '@/lib/api';

type State = {
  schools: number;
  departments: number;
  programs: number;
  intakes: number;
  applications: number;
  offers: number;
  admitted: number;
};

export function AdminStatusGrid() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [structure, programs, intakes, applications] = await Promise.all([
          getAdminAcademicStructure().catch(() => ({} as any)),
          getPrograms().catch(() => []),
          getIntakes().catch(() => []),
          getApplications().catch(() => []),
        ]);

        setState({
          schools: Array.isArray((structure as any).schools) ? (structure as any).schools.length : 0,
          departments: Array.isArray((structure as any).departments) ? (structure as any).departments.length : 0,
          programs: Array.isArray(programs) ? programs.length : 0,
          intakes: Array.isArray(intakes) ? intakes.length : 0,
          applications: Array.isArray(applications) ? applications.length : 0,
          offers: Array.isArray(applications) ? applications.filter((item: any) => ['offer_sent', 'approved'].includes(item.status)).length : 0,
          admitted: Array.isArray(applications) ? applications.filter((item: any) => item.status === 'admitted').length : 0,
        });
      } catch {
        setError('Live admin data is not available yet.');
      }
    }

    load();
  }, []);

  const data = state ?? { schools: 0, departments: 0, programs: 0, intakes: 0, applications: 0, offers: 0, admitted: 0 };

  return (
    <div className="space-y-4">
      {error ? <div className="rounded-lg border p-4 text-sm text-muted-foreground">{error}</div> : null}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border p-4"><p className="font-semibold">Schools</p><p className="text-2xl font-bold">{data.schools}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Departments</p><p className="text-2xl font-bold">{data.departments}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Programmes</p><p className="text-2xl font-bold">{data.programs}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Intakes</p><p className="text-2xl font-bold">{data.intakes}</p></div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4"><p className="font-semibold">Applications</p><p className="text-2xl font-bold">{data.applications}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Offers</p><p className="text-2xl font-bold">{data.offers}</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Admitted</p><p className="text-2xl font-bold">{data.admitted}</p></div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4"><p className="font-semibold">Setup readiness</p><p className="text-sm text-muted-foreground">Needs school, department, programme, intake, curriculum, and lecturers.</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Delivery readiness</p><p className="text-sm text-muted-foreground">Needs calendar, delivery modes, sessions, venues, links, and assessments.</p></div>
        <div className="rounded-lg border p-4"><p className="font-semibold">Student readiness</p><p className="text-sm text-muted-foreground">Needs admissions, invoices, enrollment, module selection, and clearance.</p></div>
      </div>
    </div>
  );
}
