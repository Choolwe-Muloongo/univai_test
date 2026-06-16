export default function StudentFormalDashboardPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Student Formal Dashboard</h1>
      <p className="text-muted-foreground">Academic view for admitted programme students: enrollment, calendar, modules, timetable, assignments, exams, results, finance, and progression.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4">Enrollment status</div>
        <div className="rounded-lg border p-4">Academic calendar</div>
        <div className="rounded-lg border p-4">Modules</div>
        <div className="rounded-lg border p-4">Timetable</div>
        <div className="rounded-lg border p-4">Assignments and exams</div>
        <div className="rounded-lg border p-4">Results and progression</div>
      </div>
    </main>
  );
}
