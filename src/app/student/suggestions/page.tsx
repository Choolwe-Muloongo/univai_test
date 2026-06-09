'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, Bug, Lightbulb, MessageSquare, RefreshCw, Send, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/student/page-header';
import { apiFetch } from '@/lib/api/client';

type FeedbackType = 'feature' | 'bug' | 'suggestion' | 'rating';
type FeedbackStatus = 'open' | 'under_review' | 'planned' | 'in_progress' | 'completed' | 'rejected' | 'duplicate';

type FeedbackPost = {
  id: number;
  type: FeedbackType;
  title: string;
  body: string;
  rating?: number | null;
  status: FeedbackStatus;
  adminResponse?: string | null;
  upvotesCount: number;
  commentsCount: number;
  hasVoted: boolean;
  authorName: string;
  createdAt?: string | null;
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

const requestTypes: Array<{ value: FeedbackType; label: string; icon: typeof Lightbulb; helper: string }> = [
  { value: 'feature', label: 'Feature request', icon: Lightbulb, helper: 'Suggest a new tool, page, card, or learning experience.' },
  { value: 'bug', label: 'Report an error', icon: Bug, helper: 'Tell us what broke, where it happened, and what you expected.' },
  { value: 'suggestion', label: 'Suggestion', icon: MessageSquare, helper: 'Share what can make UnivAI clearer or better.' },
  { value: 'rating', label: 'Rate UnivAI', icon: Star, helper: 'Give the app a star rating and explain your experience.' },
];

const statusLabels: Record<FeedbackStatus, string> = {
  open: 'Open',
  under_review: 'Under Review',
  planned: 'Planned',
  in_progress: 'Being Worked On',
  completed: 'Done',
  rejected: 'Not Planned',
  duplicate: 'Duplicate',
};

const typeLabels: Record<FeedbackType, string> = {
  feature: 'Feature Request',
  bug: 'Bug Report',
  suggestion: 'Suggestion',
  rating: 'App Rating',
};

export default function StudentSuggestionsPage() {
  const [type, setType] = useState<FeedbackType>('feature');
  const [filter, setFilter] = useState<'all' | FeedbackType>('all');
  const [sort, setSort] = useState('top');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [rating, setRating] = useState(5);
  const [posts, setPosts] = useState<FeedbackPost[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('sort', sort);
    if (filter !== 'all') params.set('type', filter);
    return params.toString();
  }, [filter, sort]);

  async function loadFeedback() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<FeedbackResponse>(`/feedback?${query}`);
      setPosts(data.items);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to load feedback', err);
      setError('Could not load feedback right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await apiFetch<FeedbackPost>('/feedback', {
        method: 'POST',
        body: JSON.stringify({ type, title, body: details, rating: type === 'rating' ? rating : null }),
      });
      setMessage('Feedback posted. Students can now upvote it.');
      setTitle('');
      setDetails('');
      setRating(5);
      setFilter('all');
      setSort('newest');
      await loadFeedback();
    } catch (err) {
      console.error('Failed to submit feedback', err);
      setError('Could not submit feedback. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleVote(post: FeedbackPost) {
    const previousPosts = posts;
    setPosts(posts.map((item) => item.id === post.id
      ? { ...item, hasVoted: !item.hasVoted, upvotesCount: Math.max(0, item.upvotesCount + (item.hasVoted ? -1 : 1)) }
      : item,
    ));

    try {
      await apiFetch<FeedbackPost>(`/feedback/${post.id}/vote`, { method: post.hasVoted ? 'DELETE' : 'POST' });
    } catch (err) {
      console.error('Failed to update vote', err);
      setPosts(previousPosts);
      setError('Could not update vote. Please try again.');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ideas & Feedback" description="Post ideas, report problems, rate UnivAI, and upvote what matters most. The most useful ideas rise to the top." />

      {summary ? (
        <div className="grid gap-3 md:grid-cols-5">
          <Stat label="Posts" value={summary.totalPosts} />
          <Stat label="Open Bugs" value={summary.openBugs} />
          <Stat label="Planned Features" value={summary.plannedFeatures} />
          <Stat label="Completed" value={summary.completedRequests} />
          <Stat label="Rating" value={summary.totalRatings ? `${summary.averageRating}/5` : 'No ratings'} />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        {requestTypes.map((item) => {
          const Icon = item.icon;
          const active = type === item.value;
          return (
            <button key={item.value} type="button" onClick={() => setType(item.value)} className={`rounded-2xl border p-4 text-left transition hover:bg-muted ${active ? 'border-primary bg-primary/5' : 'bg-card'}`}>
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.helper}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Post feedback</CardTitle>
            <CardDescription>Be clear and specific so other students and the team can understand it fast.</CardDescription>
          </CardHeader>
          <CardContent>
            {message ? <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{message}</div> : null}
            {error ? <div className="mb-4 rounded-lg border p-3 text-sm text-red-600">{error}</div> : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {type === 'rating' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">App rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button key={value} type="button" onClick={() => setRating(value)} className="rounded-lg border px-3 py-2 text-sm hover:bg-muted">
                        <Star className={`h-5 w-5 ${value <= rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="feedback-title" className="text-sm font-medium">Title</label>
                <input id="feedback-title" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} placeholder={type === 'bug' ? 'Example: Lesson player does not open sub-lessons' : 'Example: Add more MA110 practice questions'} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <div className="space-y-2">
                <label htmlFor="feedback-details" className="text-sm font-medium">Details</label>
                <textarea id="feedback-details" value={details} onChange={(event) => setDetails(event.target.value)} required minLength={10} rows={7} placeholder="Explain what happened, what you want added, or what confused you." className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" />
              </div>

              <Button type="submit" disabled={saving}><Send className="mr-2 h-4 w-4" />{saving ? 'Posting...' : 'Post feedback'}</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'feature', 'bug', 'suggestion', 'rating'] as const).map((item) => <Button key={item} size="sm" variant={filter === item ? 'default' : 'outline'} onClick={() => setFilter(item)}>{item === 'all' ? 'All' : typeLabels[item]}</Button>)}
            </div>
            <div className="flex gap-2">
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
                <option value="top">Top</option>
                <option value="newest">Newest</option>
                <option value="most_commented">Most discussed</option>
                <option value="planned">Planned first</option>
                <option value="completed">Completed first</option>
              </select>
              <Button variant="outline" size="icon" onClick={loadFeedback} title="Refresh feedback"><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>

          {loading ? <div className="rounded-2xl border p-6 text-sm text-muted-foreground">Loading feedback...</div> : null}
          {!loading && posts.length === 0 ? <div className="rounded-2xl border p-6 text-sm text-muted-foreground">No feedback yet. Be the first to post.</div> : null}

          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="grid gap-4 p-4 sm:grid-cols-[80px_1fr]">
                <button type="button" onClick={() => toggleVote(post)} className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition hover:bg-muted ${post.hasVoted ? 'border-primary bg-primary/5 text-primary' : ''}`}>
                  <ArrowUp className="h-5 w-5" />
                  <span className="mt-1 text-xl font-bold">{post.upvotesCount}</span>
                  <span className="text-xs">votes</span>
                </button>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{typeLabels[post.type]}</Badge>
                    <Badge>{statusLabels[post.status]}</Badge>
                    {post.rating ? <Badge>{post.rating}/5 stars</Badge> : null}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{post.title}</h2>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{post.body}</p>
                  </div>
                  {post.adminResponse ? <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm"><strong>UnivAI response:</strong> {post.adminResponse}</div> : null}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Posted by {post.authorName}</span>
                    <span>{post.commentsCount} comments</span>
                    <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium">{children}</span>;
}
