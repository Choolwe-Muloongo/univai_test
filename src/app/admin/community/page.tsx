'use client';

import { MessageSquare, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { getDiscussions } from '@/lib/api';
import type { Discussion } from '@/lib/api/types';
import { ImmutableHistoryPanel, type AdminHistoryEntry } from '@/components/admin/immutable-history-panel';

type RecordState = 'active' | 'archived' | 'deleted';

export default function CommunityPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [recordStates, setRecordStates] = useState<Record<string, RecordState>>({});
  const [history, setHistory] = useState<AdminHistoryEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getDiscussions();
      setDiscussions(data);
      setRecordStates(Object.fromEntries(data.map((d) => [d.id, 'active'])));
    };
    load();
  }, []);

  const pushHistory = (id: string, action: string) => setHistory((prev) => [{ id: `${id}-${Date.now()}`, entity: 'Discussion', entityId: id, action, timestamp: new Date().toISOString() }, ...prev]);

  const applyBulkModeration = (action: 'archive' | 'restore' | 'hard_delete') => {
    const nextState: RecordState = action === 'archive' ? 'archived' : action === 'restore' ? 'active' : 'deleted';
    setRecordStates((prev) => {
      const copy = { ...prev };
      selectedIds.forEach((id) => { copy[id] = nextState; pushHistory(id, `bulk moderation: ${action}`); });
      return copy;
    });
    setSelectedIds([]);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Hub</h1>
          <p className="text-muted-foreground">Moderate discussions with archive-first operations.</p>
        </div>
        <Button asChild><Link href="/admin/community/new"><PlusCircle className="mr-2 h-4 w-4" />Start a Discussion</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Bulk moderation actions</CardTitle><CardDescription>Operationally required controls for flagged content.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => applyBulkModeration('archive')} disabled={selectedIds.length === 0}>Archive selected</Button>
          <Button variant="outline" onClick={() => applyBulkModeration('restore')} disabled={selectedIds.length === 0}>Restore selected</Button>
          <Button variant="destructive" onClick={() => applyBulkModeration('hard_delete')} disabled={selectedIds.length === 0}>Hard-delete selected</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active Discussions</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {discussions.map((discussion) => {
              const state = recordStates[discussion.id] ?? 'active';
              if (state === 'deleted') return null;
              return (
                <li key={discussion.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2"><Checkbox checked={selectedIds.includes(discussion.id)} onCheckedChange={(checked) => setSelectedIds((prev) => checked ? [...prev, discussion.id] : prev.filter((id) => id !== discussion.id))} /><Badge variant={state === 'active' ? 'secondary' : 'outline'}>{state}</Badge></div>
                    {state === 'active' ? <Button size="sm" variant="outline" onClick={() => { setRecordStates((prev) => ({ ...prev, [discussion.id]: 'archived' })); pushHistory(discussion.id, 'archived'); }}>Archive</Button> : <Button size="sm" variant="outline" onClick={() => { setRecordStates((prev) => ({ ...prev, [discussion.id]: 'active' })); pushHistory(discussion.id, 'restored'); }}>Restore</Button>}
                  </div>
                  <Link href={`/admin/community/${discussion.id}`} className="block transition-all hover:bg-muted/50 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12"><AvatarImage src={discussion.avatar} alt={discussion.author} /><AvatarFallback>{discussion.author.charAt(0)}</AvatarFallback></Avatar>
                      <div className="flex-1"><p className="font-semibold text-lg">{discussion.title}</p><p className="text-sm text-muted-foreground line-clamp-2">{discussion.snippet}</p><div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground"><span>By {discussion.author}</span><span>{discussion.timestamp}</span><div className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /><span>{discussion.comments.length} comments</span></div></div></div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <ImmutableHistoryPanel title="Community moderation history" entries={history} />
    </div>
  );
}
