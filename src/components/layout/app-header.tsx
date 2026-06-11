// src/components/layout/app-header.tsx
'use client';

import { Bell, Search, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { logout } from '@/lib/api';
import { apiFetch } from '@/lib/api/client';
import { useSession } from '@/components/providers/session-provider';

const roleDetails: { [key: string]: { name: string; email: string; avatar: string } } = {
  'premium-student': {
    name: 'Premium Student',
    email: 'student.premium@univai.edu',
    avatar: 'https://i.pravatar.cc/80?u=student-premium',
  },
  'freemium-student': {
    name: 'Freemium Student',
    email: 'student.freemium@univai.edu',
    avatar: 'https://i.pravatar.cc/80?u=student-freemium',
  },
  admin: { name: 'Admin', email: 'admin@univai.edu', avatar: 'https://i.pravatar.cc/80?u=admin' },
  lecturer: {
    name: 'Lecturer',
    email: 'lecturer@univai.edu',
    avatar: 'https://i.pravatar.cc/80?u=lecturer',
  },
  employer: {
    name: 'Employer',
    email: 'employer@univai.edu',
    avatar: 'https://i.pravatar.cc/80?u=employer',
  },
  instructor: {
    name: 'Instructor',
    email: 'instructor@univai.edu',
    avatar: 'https://i.pravatar.cc/80?u=instructor',
  },
};

const roleRoutes: { [key: string]: { profile?: string; settings?: string } } = {
  'premium-student': { profile: '/student/profile', settings: '/student/settings' },
  'freemium-student': { profile: '/student/profile', settings: '/student/settings' },
  student: { profile: '/student/profile', settings: '/student/settings' },
  lecturer: { profile: '/lecturer/profile', settings: '/lecturer/settings' },
  employer: { profile: '/employer/profile', settings: '/employer/settings' },
  instructor: { profile: '/instructor/profile', settings: '/instructor/profile' },
  admin: { settings: '/admin/settings' },
};

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

export function AppHeader({ role, hideSidebarTrigger = false }: { role?: string; hideSidebarTrigger?: boolean }) {
  const router = useRouter();
  const { session, refresh } = useSession();
  const [user, setUser] = useState({ name: '', email: '', avatar: '' });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const resolvedRole = role || session?.user?.role || 'premium-student';
    setUserRole(resolvedRole);
    const fallback = {
      name: session?.user?.name || 'Student',
      email: session?.user?.email || 'student@univai.edu',
      avatar: session?.user?.avatar || 'https://i.pravatar.cc/80?u=student',
    };
    const roleFallback = roleDetails[resolvedRole as keyof typeof roleDetails] || fallback;
    setUser({
      name: session?.user?.name || roleFallback.name,
      email: session?.user?.email || roleFallback.email,
      avatar: session?.user?.avatar || roleFallback.avatar,
    });
  }, [role, session]);

  async function loadNotifications() {
    if (!session?.user) return;
    try {
      const data = await apiFetch<NotificationsResponse>('/notifications');
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  }

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, session?.user?.email]);

  const handleLogout = async () => {
    await logout();
    await refresh();
    router.push('/login');
  };

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications read', error);
    }
  }

  async function openNotification(notification: InAppNotification) {
    try {
      if (!notification.readAt) {
        await apiFetch(`/notifications/${notification.id}/read`, { method: 'POST' });
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification read', error);
    }

    if (notification.href) {
      router.push(notification.href);
    }
  }

  const routes = roleRoutes[userRole || ''] || {};

  return (
    <header className="glass-nav sticky top-0 z-30 flex min-h-16 shrink-0 flex-wrap items-center gap-2 rounded-2xl border-b px-3 py-2 sm:flex-nowrap sm:gap-4 sm:px-6 lg:px-8">
      {!hideSidebarTrigger ? (
        <div className="shrink-0 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-xl" />
        </div>
      ) : null}
      <div className="relative order-3 w-full min-w-0 flex-1 sm:order-none sm:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="h-10 w-full rounded-xl bg-background/70 pl-8 sm:max-w-[260px] lg:max-w-[340px]"
        />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
        <ThemeToggle />
        <DropdownMenu onOpenChange={(open) => { if (open) loadNotifications(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
              <span className="sr-only">Open notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-modal w-[calc(100vw-1.5rem)] sm:w-80" align="end">
            <DropdownMenuLabel className="flex items-center justify-between gap-3">
              <span>Notifications</span>
              {unreadCount > 0 ? <button type="button" onClick={markAllRead} className="text-xs font-normal text-primary">Mark all read</button> : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
            ) : notifications.slice(0, 6).map((notification) => (
              <DropdownMenuItem key={notification.id} onSelect={(event) => { event.preventDefault(); openNotification(notification); }} className="cursor-pointer items-start gap-3 p-3">
                <span className={`mt-1 h-2 w-2 rounded-full ${notification.readAt ? 'bg-muted' : 'bg-primary'}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{notification.title}</span>
                  {notification.body ? <span className="mt-1 block text-xs text-muted-foreground">{notification.body}</span> : null}
                  {notification.createdAt ? <span className="mt-1 block text-[11px] text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</span> : null}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="cursor-pointer justify-center text-sm font-medium text-primary">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass-modal w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {routes.profile && (
              <DropdownMenuItem asChild>
                <Link href={routes.profile}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
            )}
            {routes.settings && (
              <DropdownMenuItem asChild>
                <Link href={routes.settings}>Settings</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
