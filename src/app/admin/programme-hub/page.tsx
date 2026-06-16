export default function ProgrammeHubPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Programme Hub</h1>
      <p className="text-muted-foreground">Use this hub for setup, admissions, structure, curriculum, intakes, and lecturer delivery.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-4">Setup</div>
        <div className="rounded-lg border p-4">Admissions</div>
        <div className="rounded-lg border p-4">Structure</div>
        <div className="rounded-lg border p-4">Curriculum</div>
        <div className="rounded-lg border p-4">Intakes</div>
        <div className="rounded-lg border p-4">Lecturers</div>
      </div>
    </main>
  );
}
