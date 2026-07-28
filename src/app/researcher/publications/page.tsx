'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookMarked, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createResearchPublication, deleteResearchPublication, getResearchLabs, getResearchPublications } from '@/lib/api';
import type { ResearchLab, ResearchPublication } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

const statusBadge: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  submitted: 'outline',
  published: 'default',
};

export default function ResearchPublicationsPage() {
  const { toast } = useToast();
  const [publications, setPublications] = useState<ResearchPublication[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [venue, setVenue] = useState('');
  const [link, setLink] = useState('');
  const [labId, setLabId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [publicationData, labData] = await Promise.all([getResearchPublications(), getResearchLabs()]);
      setPublications(publicationData);
      setLabs(labData);
    } catch (error) {
      console.error('Failed to load research publications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const publication = await createResearchPublication({
        title: title.trim(),
        authors: authors.trim() || undefined,
        venue: venue.trim() || undefined,
        link: link.trim() || undefined,
        labId: labId ? Number(labId) : undefined,
      });
      setPublications((prev) => [publication, ...prev]);
      setTitle('');
      setAuthors('');
      setVenue('');
      setLink('');
      setLabId('');
      toast({ title: 'Publication added' });
    } catch (error) {
      toast({
        title: 'Failed to add publication',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      await deleteResearchPublication(id);
      setPublications((prev) => prev.filter((publication) => publication.id !== id));
    } catch (error) {
      toast({
        title: 'Failed to remove publication',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Publications</h1>
        <p className="text-muted-foreground">Keep your research output portfolio up to date.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Publications</CardTitle>
          <CardDescription>Papers, reports, and outputs you have logged.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading publications...</p>
          ) : publications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No publications logged yet. Add one below.
            </div>
          ) : (
            publications.map((publication) => (
              <div key={publication.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{publication.title}</p>
                    <Badge variant={statusBadge[publication.status] ?? 'outline'}>{publication.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {publication.authors ?? 'Authors not set'}
                    {publication.venue ? ` · ${publication.venue}` : ''}
                  </p>
                  {publication.link ? (
                    <Link href={publication.link} className="text-xs text-primary underline" target="_blank">
                      {publication.link}
                    </Link>
                  ) : null}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(publication.id)} aria-label="Remove publication">
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
                <Label>Title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Publication title" />
              </div>
              <div className="grid gap-2">
                <Label>Authors</Label>
                <Input value={authors} onChange={(event) => setAuthors(event.target.value)} placeholder="A. Author, B. Author" />
              </div>
              <div className="grid gap-2">
                <Label>Venue</Label>
                <Input value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="Journal or conference" />
              </div>
              <div className="grid gap-2">
                <Label>Link</Label>
                <Input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://..." />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Lab (optional)</Label>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={labId}
                  onChange={(event) => setLabId(event.target.value)}
                >
                  <option value="">No lab</option>
                  {labs.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={handleAdd} disabled={saving || !title.trim()}>
              Add Publication
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
