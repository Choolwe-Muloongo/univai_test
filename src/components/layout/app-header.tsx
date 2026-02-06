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
};

const roleRoutes: { [key: string]: { profile?: string; settings?: string } } = {
  'premium-student': { profile: '/student/profile', settings: '/student/settings' },
  'freemium-student': { profile: '/student/profile', settings: '/student/settings' },
  student: { profile: '/student/profile', settings: '/student/settings' },
  lecturer: { profile: '/lecturer/profile', settings: '/lecturer/settings' },
  employer: { profile: '/employer/profile', settings: '/employer/settings' },
  admin: { settings: '/admin/settings' },
};

export function AppHeader({ role }: { role?: string }) {
  const router = useRouter();
  const { session, refresh } = useSession();
  const [user, setUser] = useState({ name: '', email: '', avatar: '' });
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const resolvedRole = role || session?.user?.role || 'premium-student';
    setUserRole(resolvedRole);
    const fallback = {
      name: session?.user?.name || 'Student',
      email: session?.user?.email || 'student@univai.edu',
      avatar: 'https://i.pravatar.cc/80?u=student',
    };
    setUser(roleDetails[resolvedRole as keyof typeof roleDetails] || fallback);
  }, [role, session]);

  const handleLogout = async () => {
    await logout();
    await refresh();
    router.push('/login');
  };

  const routes = roleRoutes[userRole || ''] || {};

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
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
