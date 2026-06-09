'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/student/page-header';
import { apiFetch } from '@/lib/api/client';

type FeedbackPost = {
  id: number;
  type: 'feature' | 'bug' | 'suggestion' | 'rating';
  title: string;
  body: string;
  rating?: number | null;
  status: 'open' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected' | 'duplicate';
  adminResponse?: string | null;
  upvotesCount: number;
  commentsCount: number;
  authorName: string;
};

type FeedbackSummary = {
  totalPosts: number;
  openBugs: number;
  plannedFeatures: number;
  completedRequests: number;
  averageRating: number;
  totalRatings: number;
};

type FeedbackResponse = { items: FeedbackPost[]; summary: FeedbackSummary };

const statusLabels = {
  open: 'Open',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'Being Worked On',
  completed: 'Done',
  rejected: 'Not Planned',
  duplicate: 'Duplicate',
} as const;

const statuses = Object.keys(statusLabels) as FeedbackPost['status'][];

export default function AdminFeedbackPage() {
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [selected, setSelected] = useState<FeedbackPost | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadFeedback() {
    setLoading(true);
    const data = await apiFetch<FeedbackResponse>('/admin/feedback');
    setPosts(data.items);
    setSummary(data.summary);
    setLoading(false);
  }

  useEffect(() => {
    loadFeedback().catch((error) => {
      console.error('Failed to load feedback', error);
      setLoading(false);
    });
  }, []);

  function choosePost(post: FeedbackPost) {
    setSelected(post);
    setAdminResponse(post.adminResponse ?? '');
  }

  async function updatePost(status?: FeedbackPost['status']) {
    if (!selected) return;
    setSaving(true);
    const updated = await apiFetch<FeedbackPost>(`/admin/feedback/${selected.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status ?? selected.status, adminResponse }),
    });
    setSelected(updated);
    setPosts((items) => items.map((item) => item.id === updated.id ? updated : item));
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Feedback Board" description="Review student ideas, bug reports, feature requests, and app ratings." />

      {summary ? (
        <div className="grid gap-3 md:grid-cols-5">
          <Stat label="Posts" value={summary.totalPosts} />
          <Stat label="Open Bugs" value={summary.openBugs} />
          <Stat label="Planned" value={summary.plannedFeatures} />
          <Stat label="Completed" value={summary.completedRequests} />
          <Stat label="Rating" value={summary.totalRatings ? `${summary.averageRating}/5` : 'No ratings'} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Student feedback</CardTitle>
                <CardDescription>Highest votes appear first.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadFeedback}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Loading feedback...</p> : null}
            {posts.map((post) => (
              <button key={post.id} type="button" onClick={() => choosePost(post)} className={`w-full rounded-2xl border p-4 text-left hover:bg-muted ${selected?.id === post.id ? 'border-primary bg-primary/5' : ''}`}>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge>{post.type}</Badge>
                  <Badge>{statusLabels[post.status]}</Badge>
                  {post.rating ? <Badge><Star className="mr-1 inline h-3 w-3" />{post.rating}/5</Badge> : null}
                </div>
                <p className="mt-3 font-semibold">{post.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.body}</p>
                <p className="mt-3 text-xs text-muted-foreground">{post.upvotesCount} votes · {post.commentsCount} comments · {post.authorName}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
            <CardDescription>Change status and add an official response.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">Select a post to review it.</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{selected.body}</p>
                </div>
                <select value={selected.status} onChange={(event) => updatePost(event.target.value as FeedbackPost['status'])} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                </select>
                <textarea value={adminResponse} onChange={(event) => setAdminResponse(event.target.value)} rows={7} placeholder="Write the official UnivAI response." className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                <Button onClick={() => updatePost()} disabled={saving}>{saving ? 'Saving...' : 'Save response'}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border bg-card p-4"><MessageSquare className="mb-2 h-4 w-4 text-primary" /><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium">{children}</span>;
}
