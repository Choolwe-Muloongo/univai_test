// src/components/layout/app-sidebar.tsx
'use client';

import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Home,
  Lightbulb,
  Users,
  Shield,
  LayoutDashboard,
  Building,
  UserCheck,
  User,
  BadgeCheck,
  Wallet,
  Landmark,
  CreditCard,
  Trophy,
  FlaskConical,
  Settings,
  BookMarked,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Logo } from '@/components/icons/logo';
import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useEffect, useState } from 'react';

type NavLink = {
    href: string;
    label: string;
    icon: React.ElementType;
}

const allLinks: { [key: string]: NavLink[] } = {
  'premium-student': [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/program', label: 'My Program', icon: GraduationCap },
    { href: '/study-plan', label: 'Study Plan', icon: BookOpen },
    { href: '/tutor', label: 'AI Tutor', icon: Lightbulb },
    { href: '/virtual-lab', label: 'Virtual Lab', icon: FlaskConical },
    { href: '/wallet', label: 'My Wallet', icon: Wallet },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/jobs', label: 'Job Board', icon: Briefcase },
    { href: '/research', label: 'Research Hub', icon: FlaskConical },
    { href: '/payments', label: 'Billing', icon: Landmark },
  ],
  'freemium-student': [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/program', label: 'My Program', icon: GraduationCap },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/payments', label: 'Upgrade', icon: CreditCard },
  ],
  student: [ // Fallback for original student role
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/program', label: 'My Program', icon: GraduationCap },
    { href: '/study-plan', label: 'Study Plan', icon: BookOpen },
    { href: '/tutor', label: 'AI Tutor', icon: Lightbulb },
    { href: '/virtual-lab', label: 'Virtual Lab', icon: FlaskConical },
    { href: '/wallet', label: 'My Wallet', icon: Wallet },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/jobs', label: 'Job Board', icon: Briefcase },
    { href: '/research', label: 'Research Hub', icon: FlaskConical },
    { href: '/payments', label: 'Billing', icon: Landmark },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/management', label: 'Content Management', icon: Settings },
    { href: '/admin/consultants', label: 'Consultants', icon: UserCheck },
    { href: '/community', label: 'Manage Community', icon: Users },
    { href: '/jobs', label: 'Manage Jobs', icon: Briefcase },
    { href: '#', label: 'System Health', icon: Shield },
  ],
  lecturer: [
      { href: '/lecturer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/lecturer/profile', label: 'Profile', icon: User },
      { href: '/lecturer/dashboard', label: 'Course Management', icon: BookMarked },
      { href: '#', label: 'Student Progress', icon: UserCheck },
      { href: '/community', label: 'Community', icon: Users },
      { href: '/research', label: 'Research Hub', icon: FlaskConical },
  ],
  employer: [
    { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/jobs', label: 'Job Listings', icon: Briefcase },
    { href: '#', label: 'Company Profile', icon: Building },
    { href: '/verify/test', label: 'Verify Certificate', icon: BadgeCheck },
  ]
};

export function AppSidebar() {
  const pathname = usePathname();
  const [links, setLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'premium-student';
    setLinks(allLinks[role] || allLinks['premium-student']);
  }, [pathname]);

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <span className="text-lg font-semibold text-primary">UnivAI</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href}>
                <SidebarMenuButton
                  isActive={pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href) && link.href.split('/').length > 2)}
                  tooltip={link.label}
                  className="justify-start"
                >
                  <link.icon className="size-5" />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}

    