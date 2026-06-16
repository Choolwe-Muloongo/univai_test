export default function AcademicCommandPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Academic Command</h1>
      <p className="text-muted-foreground">Schools, departments, programmes, calendars, curriculum, lecturers, and delivery readiness.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4">Schools and departments</div>
        <div className="rounded-lg border p-4">Programmes and fees</div>
        <div className="rounded-lg border p-4">Calendars and intakes</div>
        <div className="rounded-lg border p-4">Curriculum and modules</div>
        <div className="rounded-lg border p-4">Lecturers and sessions</div>
        <div className="rounded-lg border p-4">Finance and clearance</div>
      </div>
    </main>
  );
}
