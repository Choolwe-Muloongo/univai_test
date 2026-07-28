'use client';

import { useEffect, useState } from 'react';
import { FlaskConical, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createResearchLab, deleteResearchLab, getResearchLabs } from '@/lib/api';
import type { ResearchLab } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

const statusBadge: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  paused: 'secondary',
  completed: 'outline',
};

export default function ResearchLabsPage() {
  const { toast } = useToast();
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadLabs = async () => {
    setLoading(true);
    try {
      const data = await getResearchLabs();
      setLabs(data);
    } catch (error) {
      console.error('Failed to load research labs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const lab = await createResearchLab({
        title: title.trim(),
        focusArea: focusArea.trim() || undefined,
        description: description.trim() || undefined,
      });
      setLabs((prev) => [lab, ...prev]);
      setTitle('');
      setFocusArea('');
      setDescription('');
      toast({ title: 'Research lab created' });
    } catch (error) {
      toast({
        title: 'Failed to create lab',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      await deleteResearchLab(id);
      setLabs((prev) => prev.filter((lab) => lab.id !== id));
    } catch (error) {
      toast({
        title: 'Failed to remove lab',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Labs</h1>
        <p className="text-muted-foreground">Manage the labs you lead or collaborate on.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Labs</CardTitle>
          <CardDescription>Labs you own.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading labs...</p>
          ) : labs.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No research labs yet. Create one below.
            </div>
          ) : (
            labs.map((lab) => (
              <div key={lab.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{lab.title}</p>
                    <Badge variant={statusBadge[lab.status] ?? 'outline'}>{lab.status}</Badge>
                  </div>
                  {lab.focusArea ? <p className="mt-1 text-sm text-muted-foreground">{lab.focusArea}</p> : null}
                  {lab.description ? <p className="mt-1 text-sm text-muted-foreground">{lab.description}</p> : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(lab.id)} aria-label="Remove lab">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Lab Title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g., Applied AI Research Lab" />
              </div>
              <div className="grid gap-2">
                <Label>Focus Area</Label>
                <Input value={focusArea} onChange={(event) => setFocusArea(event.target.value)} placeholder="Machine Learning, Public Health, ..." />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this lab work on?" />
            </div>
            <Button onClick={handleAdd} disabled={saving || !title.trim()}>
              Create Lab
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
