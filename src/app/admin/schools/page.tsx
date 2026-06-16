'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Building2, Pencil, RefreshCw, Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/client';
import { createSchool, deleteSchool, getSchools } from '@/lib/api';
import type { School } from '@/lib/api/types';

type SchoolForm = {
  id: string;
  name: string;
  description: string;
};

const blankForm: SchoolForm = { id: '', name: '', description: '' };

function schoolDescription(school: School): string {
  const record = school as unknown as Record<string, unknown>;
  return typeof record.description === 'string' ? record.description : '';
}

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [form, setForm] = useState<SchoolForm>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadSchools() {
    setLoading(true);
    setError('');
    try {
      setSchools(await getSchools());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load schools.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchools();
  }, []);

  function editSchool(school: School) {
    setEditingId(school.id);
    setForm({
      id: school.id,
      name: school.name,
      description: schoolDescription(school),
    });
    setMessage('');
    setError('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(blankForm);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (editingId) {
        await apiFetch(`/admin/schools/${encodeURIComponent(editingId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null }),
        });
        setMessage('School updated successfully.');
      } else {
        await createSchool({
          id: form.id.trim() || undefined,
          name: form.name.trim(),
          description: form.description.trim() || null,
        });
        setMessage('School created successfully.');
      }

      resetForm();
      await loadSchools();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save this school.');
    } finally {
      setSaving(false);
    }
  }

  async function removeSchool(school: School) {
    const confirmed = window.confirm(`Delete ${school.name}? This should only be done before departments/programmes depend on it.`);
    if (!confirmed) return;

    setSaving(true);
    setMessage('');
    setError('');

    try {
      await deleteSchool(school.id);
      setMessage('School deleted successfully.');
      if (editingId === school.id) resetForm();
      await loadSchools();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete this school. It may already be linked to departments or programmes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Formal Programmes</p>
          <h1 className="text-3xl font-bold tracking-tight">Schools / Faculties</h1>
          <p className="max-w-3xl text-muted-foreground">
            Create and manage the academic schools that hold departments, programmes, curriculum and intakes.
          </p>
        </div>
        <Button variant="outline" onClick={loadSchools} disabled={loading || saving}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div> : null}
      {error ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-primary" />}
              {editingId ? 'Edit School' : 'Create School'}
            </CardTitle>
            <CardDescription>
              Example: School of ICT, School of Business, School of Education.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {!editingId ? (
                <div className="space-y-2">
                  <Label htmlFor="school-id">Optional Code / ID</Label>
                  <Input id="school-id" value={form.id} onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))} placeholder="school-ict" />
                  <p className="text-xs text-muted-foreground">Leave empty to let the backend generate it if supported.</p>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="school-name">School Name</Label>
                <Input id="school-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required placeholder="School of ICT" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school-description">Description</Label>
                <Textarea id="school-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What this school manages..." />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={saving}>
                  <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create school'}
                </Button>
                {editingId ? <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button> : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Schools</CardTitle>
            <CardDescription>{loading ? 'Loading...' : `${schools.length} school/faculty records`}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Loading schools...</p> : null}
            {!loading && schools.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No schools yet. Create the first school on the left.</div>
            ) : null}
            {schools.map((school) => (
              <div key={school.id} className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{school.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {school.id}</p>
                  {schoolDescription(school) ? <p className="mt-1 text-sm text-muted-foreground">{schoolDescription(school)}</p> : null}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => editSchool(school)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => removeSchool(school)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
