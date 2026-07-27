'use client';

import { useEffect, useState } from 'react';
import { Landmark, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createResearchGrant, deleteResearchGrant, getResearchGrants, getResearchLabs } from '@/lib/api';
import type { ResearchGrant, ResearchLab } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

const statusBadge: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  applied: 'secondary',
  awarded: 'default',
  active: 'default',
  completed: 'outline',
  rejected: 'destructive',
};

export default function ResearchGrantsPage() {
  const { toast } = useToast();
  const [grants, setGrants] = useState<ResearchGrant[]>([]);
  const [labs, setLabs] = useState<ResearchLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [funder, setFunder] = useState('');
  const [amount, setAmount] = useState('');
  const [labId, setLabId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [grantData, labData] = await Promise.all([getResearchGrants(), getResearchLabs()]);
      setGrants(grantData);
      setLabs(labData);
    } catch (error) {
      console.error('Failed to load research grants', error);
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
      const grant = await createResearchGrant({
        title: title.trim(),
        funder: funder.trim() || undefined,
        amount: amount ? Number(amount) : undefined,
        labId: labId ? Number(labId) : undefined,
      });
      setGrants((prev) => [grant, ...prev]);
      setTitle('');
      setFunder('');
      setAmount('');
      setLabId('');
      toast({ title: 'Grant recorded' });
    } catch (error) {
      toast({
        title: 'Failed to record grant',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      await deleteResearchGrant(id);
      setGrants((prev) => prev.filter((grant) => grant.id !== id));
    } catch (error) {
      toast({
        title: 'Failed to remove grant',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Grants</h1>
        <p className="text-muted-foreground">Track funding applications and awards.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Grants</CardTitle>
          <CardDescription>Grants linked to your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading grants...</p>
          ) : grants.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No grants recorded yet. Add one below.
            </div>
          ) : (
            grants.map((grant) => (
              <div key={grant.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{grant.title}</p>
                    <Badge variant={statusBadge[grant.status] ?? 'outline'}>{grant.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {grant.funder ?? 'Funder not set'}
                    {grant.amount ? ` · ${grant.currency ?? 'USD'} ${grant.amount}` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(grant.id)} aria-label="Remove grant">
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
                <Label>Grant Title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g., Climate Resilience Fund" />
              </div>
              <div className="grid gap-2">
                <Label>Funder</Label>
                <Input value={funder} onChange={(event) => setFunder(event.target.value)} placeholder="Funding organization" />
              </div>
              <div className="grid gap-2">
                <Label>Amount (USD)</Label>
                <Input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-2">
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
              Record Grant
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
