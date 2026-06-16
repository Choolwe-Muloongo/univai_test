import { LecturerStatusGrid } from '@/components/formal/lecturer-status-grid';

export default function LecturerFormalDashboardPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Lecturer Formal Dashboard</h1>
      <p className="text-muted-foreground">Teaching workflow for formal programmes: courses, sessions, builders, assignments, exams, students, and grading.</p>
      <LecturerStatusGrid />
    </main>
  );
}
