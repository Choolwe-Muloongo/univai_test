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
  ClipboardCheck,
  CalendarDays,
  Link2,
  ArrowLeftRight,
  SlidersHorizontal,
  Sparkles,
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
  key?: string;
};

const allLinks: { [key: string]: NavLink[] } = {
  'premium-student': [
    { href: '/student/dashboard', label: 'Dashboard', icon: Home },
    { href: '/student/program', label: 'My Program', icon: GraduationCap },
    { href: '/student/study-plan', label: 'Study Plan', icon: BookOpen },
    { href: '/student/ai', label: 'AI Tutor', icon: Lightbulb },
    { href: '/student/virtual-lab', label: 'Virtual Lab', icon: FlaskConical },
    { href: '/student/wallet', label: 'My Wallet', icon: Wallet },
    { href: '/student/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/student/community', label: 'Community', icon: Users },
    { href: '/student/jobs', label: 'Job Board', icon: Briefcase },
    { href: '/student/research', label: 'Research Hub', icon: FlaskConical },
    { href: '/student/payments', label: 'Billing', icon: Landmark },
  ],
  'freemium-student': [
    { href: '/student/dashboard', label: 'Dashboard', icon: Home },
    { href: '/student/program', label: 'My Program', icon: GraduationCap },
    { href: '/student/community', label: 'Community', icon: Users },
    { href: '/student/payments', label: 'Upgrade', icon: CreditCard },
  ],
  student: [
    { href: '/student/dashboard', label: 'Dashboard', icon: Home },
    { href: '/student/program', label: 'My Program', icon: GraduationCap },
    { href: '/student/study-plan', label: 'Study Plan', icon: BookOpen },
    { href: '/student/ai', label: 'AI Tutor', icon: Lightbulb },
    { href: '/student/virtual-lab', label: 'Virtual Lab', icon: FlaskConical },
    { href: '/student/wallet', label: 'My Wallet', icon: Wallet },
    { href: '/student/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/student/community', label: 'Community', icon: Users },
    { href: '/student/jobs', label: 'Job Board', icon: Briefcase },
    { href: '/student/research', label: 'Research Hub', icon: FlaskConical },
    { href: '/student/payments', label: 'Billing', icon: Landmark },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/admissions', label: 'Admissions', icon: ClipboardCheck },
    { href: '/admin/route-requests', label: 'Route Requests', icon: ArrowLeftRight },
    { href: '/admin/intakes', label: 'Intakes', icon: CalendarDays },
    { href: '/admin/assignments', label: 'Assignments', icon: Link2 },
    { href: '/admin/lecturer-applications', label: 'Lecturer Applications', icon: UserCheck },
    { href: '/admin/ai', label: 'AI Console', icon: Sparkles },
    { href: '/admin/curriculum', label: 'Curriculum', icon: BookMarked },
    { href: '/admin/policies', label: 'Policies', icon: SlidersHorizontal },
    { href: '/admin/management', label: 'Content Management', icon: Settings },
    { href: '/admin/consultants', label: 'Consultants', icon: UserCheck },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: BookMarked },
    { href: '/admin/audit', label: 'Audit Logs', icon: BadgeCheck },
    { href: '/admin/community', label: 'Manage Community', icon: Users },
    { href: '/admin/jobs', label: 'Manage Jobs', icon: Briefcase },
    { href: '/admin/system-health', label: 'System Health', icon: Shield },
  ],
  lecturer: [
    { href: '/lecturer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/lecturer/courses', label: 'Courses', icon: BookOpen },
    { href: '/lecturer/exams', label: 'Exam Bank', icon: ClipboardCheck },
    { href: '/lecturer/profile', label: 'Profile', icon: User },
    { href: '/lecturer/progress', label: 'Student Progress', icon: UserCheck },
    { href: '/lecturer/community', label: 'Community', icon: Users },
    { href: '/lecturer/research', label: 'Research Hub', icon: FlaskConical },
  ],
  employer: [
    { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employer/jobs', label: 'Job Listings', icon: Briefcase },
    { href: '/employer/research', label: 'Research', icon: FlaskConical },
    { href: '/employer/profile', label: 'Company Profile', icon: Building },
    { href: '/verify', label: 'Verify Credential', icon: BadgeCheck },
  ],
};

export function AppSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const [links, setLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    const resolvedRole = role || 'premium-student';
    const normalizedRole = resolvedRole === 'enrolled' ? 'premium-student' : resolvedRole;
    setLinks(allLinks[normalizedRole] || allLinks['premium-student']);
  }, [pathname, role]);

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
            <SidebarMenuItem key={link.key || link.href}>
              <Link href={link.href}>
                <SidebarMenuButton
                  isActive={
                    pathname === link.href ||
                    (link.href !== '/student/dashboard' &&
                      pathname.startsWith(link.href) &&
                      link.href.split('/').length > 2)
                  }
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
