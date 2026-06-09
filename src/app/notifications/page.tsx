'use client';

import { Bell, CheckCircle2, ExternalLink, Inbox, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { PageHeader } from '@/components/student/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api/client';

type InAppNotification = {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
};

type NotificationsResponse = {
  items: InAppNotification[];
  unreadCount: number;
};

const typeLabels: Record<string, string> = {
  feedback: 'Feedback',
  rating: 'Rating',
  rating_reminder: 'Feedback Reminder',
  payment: 'Payment',
  invoice: 'Invoice',
  course: 'Course',
  lesson: 'Lesson',
  assignment: 'Assignment',
  certificate: 'Certificate',
  announcement: 'Announcement',
  application: 'Application',
  system: 'System',
  admin: 'Admin',
  general: 'General',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await apiFetch<NotificationsResponse>('/notifications');
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const visibleItems = useMemo(() => {
    if (filter === 'unread') return items.filter((item) => !item.readAt);
    return items;
  }, [items, filter]);

  async function markAllRead() {
    await apiFetch('/notifications/read-all', { method: 'POST' });
    const timestamp = new Date().toISOString();
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt ?? timestamp })));
    setUnreadCount(0);
  }

  async function openNotification(notification: InAppNotification) {
    if (!notification.readAt) {
      await apiFetch(`/notifications/${notification.id}/read`, { method: 'POST' });
      setItems((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    if (notification.href) {
      router.push(notification.href);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Track important UnivAI updates, feedback replies, payments, reminders, and system messages in one place."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-3xl border p-5">
          <p className="text-sm text-muted-foreground">Unread</p>
          <p className="mt-2 text-3xl font-bold">{unreadCount}</p>
        </div>
        <div className="glass-card rounded-3xl border p-5">
          <p className="text-sm text-muted-foreground">Total shown</p>
          <p className="mt-2 text-3xl font-bold">{items.length}</p>
        </div>
        <div className="glass-card rounded-3xl border p-5">
          <p className="text-sm text-muted-foreground">Monthly reminder</p>
          <p className="mt-2 text-sm font-medium">Students are gently reminded once a month to rate UnivAI or give feedback.</p>
        </div>
      </section>

      <section className="glass-card rounded-3xl border p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
            <Button variant={filter === 'unread' ? 'default' : 'outline'} onClick={() => setFilter('unread')}>Unread</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadNotifications}>Refresh</Button>
            <Button onClick={markAllRead} disabled={unreadCount === 0}>Mark all read</Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading notifications...
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
            <Inbox className="h-10 w-10" />
            <div>
              <p className="font-medium text-foreground">No notifications here yet.</p>
              <p className="text-sm">Important updates will appear here automatically.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleItems.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                className="w-full rounded-2xl border bg-background/60 p-4 text-left transition hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt ? 'bg-muted' : 'bg-primary'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {typeLabels[notification.type] ?? notification.type.replace(/_/g, ' ')}
                      </span>
                      {!notification.readAt ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Unread</span> : null}
                    </div>
                    <h3 className="mt-2 text-base font-semibold">{notification.title}</h3>
                    {notification.body ? <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p> : null}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {notification.createdAt ? <span>{new Date(notification.createdAt).toLocaleString()}</span> : null}
                      {notification.href ? <span className="inline-flex items-center gap-1 text-primary"><ExternalLink className="h-3.5 w-3.5" /> Open</span> : null}
                      {notification.readAt ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Read</span> : null}
                    </div>
                  </div>
                  <Bell className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
