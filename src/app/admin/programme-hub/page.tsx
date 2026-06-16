import { AdminStatusGrid } from '@/components/formal/admin-status-grid';

export default function ProgrammeHubPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Programme Hub</h1>
      <p className="text-muted-foreground">Live admin view for setup, admissions, structure, curriculum, intakes, lecturer delivery, and readiness.</p>
      <AdminStatusGrid />
    </main>
  );
}
