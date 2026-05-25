'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ClipboardCheck, Filter, Lock, Search, Trophy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getMyShortCourses, type ShortCourseEnrollmentSummary } from '@/lib/api/short-courses';

type ArenaFilter = 'all' | 'ready' | 'locked' | 'in_progress' | 'completed';
type ArenaSort = 'recent' | 'progress_desc' | 'progress_asc' | 'title';

const filterTabs: Array<{ key: ArenaFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'ready', label: 'Ready' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'locked', label: 'Locked' },
];

export default function StudentTrainingArenaPage() {
  const [items, setItems] = useState<ShortCourseEnrollmentSummary[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ArenaFilter>('ready');
  const [level, setLevel] = useState('all');
  const [sort, setSort] = useState<ArenaSort>('progress_asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMyShortCourses()
      .then((data) => { if (mounted) setItems(data.filter((item) => item.course)); })
      .catch((cause) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load Training Arena.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const activeItems = useMemo(() => items.filter((item) => item.entryFeePaid), [items]);
  const lockedItems = useMemo(() => items.filter((item) => !item.entryFeePaid), [items]);
  const levels = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.course?.level ?? 'beginner')))], [items]);
  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    const rows = items.filter((item) => {
      const course = item.course;
      if (!course) return false;
      const progress = Number(item.progress ?? 0);
      const locked = !item.entryFeePaid;
      const matchesSearch = !search || `${course.title} ${course.description ?? ''} ${course.level ?? ''}`.toLowerCase().includes(search);
      const matchesLevel = level === 'all' || (course.level ?? 'beginner') === level;
      const matchesFilter = filter === 'all'
        || (filter === 'ready' && !locked)
        || (filter === 'locked' && locked)
        || (filter === 'in_progress' && !locked && progress > 0 && progress < 100)
        || (filter === 'completed' && progress >= 100);
      return matchesSearch && matchesLevel && matchesFilter;
    });

    return rows.sort((a, b) => {
      const aTitle = a.course?.title ?? '';
      const bTitle = b.course?.title ?? '';
      const aProgress = Number(a.progress ?? 0);
      const bProgress = Number(b.progress ?? 0);
      if (sort === 'title') return aTitle.localeCompare(bTitle);
      if (sort === 'progress_desc') return bProgress - aProgress;
      if (sort === 'progress_asc') return aProgress - bProgress;
      return Number(b.id ?? 0) - Number(a.id ?? 0);
    });
  }, [filter, items, level, query, sort]);

  if (loading) return <PageLoading message="Loading Training Arena..." />;
  if (error) return <PageError message={error} actionHref="/student/dashboard" actionLabel="Back to dashboard" />;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 overflow-hidden px-3 py-4 sm:px-5 lg:px-6">
      <section className="overflow-hidden rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">Training Arena</p>
        <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">Choose a Journey to train</h1>
        <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground">Search, filter, and enter practice without scrolling through every Journey blindly.</p>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric title="Enrolled Journeys" value={items.length} icon={ClipboardCheck} />
        <Metric title="Arena Ready" value={activeItems.length} icon={Trophy} />
        <Metric title="Locked" value={lockedItems.length} icon={Lock} />
      </div>

      <section className="rounded-3xl border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4 text-primary" /> Journey filters</p>
            <p className="mt-1 break-words text-xs text-muted-foreground">Showing {filteredItems.length} of {items.length} Journey{items.length === 1 ? '' : 's'}.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_160px] lg:w-[720px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="min-h-11 w-full rounded-2xl border bg-background pl-9 pr-3 text-sm" placeholder="Search your journeys..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <select className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm capitalize" value={level} onChange={(event) => setLevel(event.target.value)}>
              {levels.map((item) => <option key={item} value={item}>{item === 'all' ? 'All levels' : item}</option>)}
            </select>
            <select className="min-h-11 w-full rounded-2xl border bg-background px-3 text-sm" value={sort} onChange={(event) => setSort(event.target.value as ArenaSort)}>
              <option value="progress_asc">Least progress first</option>
              <option value="progress_desc">Most progress first</option>
              <option value="title">Title A-Z</option>
              <option value="recent">Newest first</option>
            </select>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {filterTabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setFilter(tab.key)} className={`min-h-10 rounded-2xl border px-3 py-2 text-sm transition ${filter === tab.key ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/50'}`}>{tab.label}</button>
          ))}
        </div>
      </section>

      {items.length ? (
        filteredItems.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredItems.map((item) => <ArenaJourneyCard key={item.id} item={item} />)}
          </div>
        ) : (
          <Card className="rounded-3xl border-dashed"><CardContent className="space-y-4 p-6 text-center sm:p-8"><p className="font-semibold">No Journeys match those filters.</p><p className="text-sm text-muted-foreground">Clear the search or choose a different status/level filter.</p><Button variant="outline" onClick={() => { setQuery(''); setFilter('all'); setLevel('all'); setSort('progress_asc'); }}>Clear filters</Button></CardContent></Card>
        )
      ) : (
        <Card className="rounded-3xl border-dashed"><CardContent className="space-y-4 p-8 text-center"><p className="font-semibold">No enrolled Journeys yet.</p><p className="text-sm text-muted-foreground">Choose a short course first, then return here to practice.</p><Button asChild><Link href="/student/courses">Choose New Journey</Link></Button></CardContent></Card>
      )}
    </main>
  );
}

function ArenaJourneyCard({ item }: { item: ShortCourseEnrollmentSummary }) {
  const course = item.course!;
  const locked = !item.entryFeePaid;
  const progress = Number(item.progress ?? 0);
  return (
    <Card className="min-w-0 overflow-hidden rounded-3xl">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-1 capitalize">{course.level ?? 'beginner'}</span>
          <span className="rounded-full bg-muted px-2 py-1">{course.durationHours ?? 0}h</span>
          <span className={`rounded-full px-2 py-1 ${locked ? 'bg-amber-100 text-amber-800' : 'bg-primary/10 text-primary'}`}>{locked ? 'Locked' : 'Ready'}</span>
        </div>
        <CardTitle className="break-words text-lg sm:text-xl">{course.title}</CardTitle>
        <CardDescription className="line-clamp-3 break-words">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0 sm:px-5 sm:pb-5">
        <div><div className="mb-2 flex items-center justify-between text-sm"><span>Journey progress</span><strong>{progress}%</strong></div><Progress value={progress} className="h-3" /></div>
        {locked ? <div className="rounded-2xl border border-dashed p-3 text-sm text-muted-foreground">Access is locked. Pay entry or activate access from Mission Control before entering this Arena.</div> : null}
        <div className="grid gap-2 sm:grid-cols-3">
          <Button asChild className="min-h-11 gap-2" variant={locked ? 'secondary' : 'default'}><Link href={locked ? `/student/courses/${course.id}` : `/student/courses/${course.id}/practice`}>{locked ? 'Activate' : 'Practice'} <ArrowRight className="h-4 w-4" /></Link></Button>
          <Button asChild variant="outline" className="min-h-11 gap-2"><Link href={`/student/courses/${course.id}`}>Mission</Link></Button>
          <Button asChild variant="outline" className="min-h-11"><Link href={locked ? `/student/courses/${course.id}` : `/student/courses/${course.id}/exam`}>Exam</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof ClipboardCheck }) {
  return (
    <Card className="rounded-3xl"><CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5"><div className="min-w-0"><p className="break-words text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold sm:text-3xl">{value}</p></div><Icon className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" /></CardContent></Card>
  );
}
