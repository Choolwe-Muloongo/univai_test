export default function LecturerFormalDashboardPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Lecturer Formal Dashboard</h1>
      <p className="text-muted-foreground">Teaching workflow for formal programmes: courses, sessions, builders, assignments, exams, students, and grading.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4">Assigned courses</div>
        <div className="rounded-lg border p-4">Course builders</div>
        <div className="rounded-lg border p-4">Timetable sessions</div>
        <div className="rounded-lg border p-4">Assignments</div>
        <div className="rounded-lg border p-4">Exam bank</div>
        <div className="rounded-lg border p-4">Student progress</div>
      </div>
    </main>
  );
}
