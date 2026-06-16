import { AdminStatusGrid } from '@/components/formal/admin-status-grid';

export default function AcademicCommandPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Academic Command</h1>
      <p className="text-muted-foreground">Live readiness view for schools, departments, programmes, calendars, curriculum, lecturers, delivery, finance, and student status.</p>
      <AdminStatusGrid />
    </main>
  );
}
