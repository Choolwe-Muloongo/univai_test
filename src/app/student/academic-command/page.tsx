export default function StudentAcademicCommandPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Student Academic Command</h1>
      <p className="text-muted-foreground">Academic control view for enrollment, calendar, modules, timetable, coursework, exams, results, finance, and progression.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4">Enrollment</div>
        <div className="rounded-lg border p-4">Calendar</div>
        <div className="rounded-lg border p-4">Modules</div>
        <div className="rounded-lg border p-4">Timetable</div>
        <div className="rounded-lg border p-4">Assessments</div>
        <div className="rounded-lg border p-4">Results</div>
      </div>
    </main>
  );
}
