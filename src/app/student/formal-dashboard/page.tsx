import { StudentStatusGrid } from '@/components/formal/student-status-grid';

export default function StudentFormalDashboardPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Student Formal Dashboard</h1>
      <p className="text-muted-foreground">Academic view for admitted programme students: enrollment, calendar, modules, timetable, assessments, finance, and progression.</p>
      <StudentStatusGrid />
    </main>
  );
}
