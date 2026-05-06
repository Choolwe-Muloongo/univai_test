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
  Workflow,
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
import { useSession } from '@/components/providers/session-provider';
import { ADMIN_PERMISSIONS, adminHasPermission, isAdminRole, type AdminPermission } from '@/lib/auth/roles';

type NavLink = {
  href: string;
  label: string;
  icon: React.ElementType;
  key?: string;
  permission?: AdminPermission;
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
    { href: '/admin/admissions', label: 'Admissions', icon: ClipboardCheck, permission: ADMIN_PERMISSIONS.REGISTRAR_MANAGE },
    { href: '/admin/users', label: 'User Management', icon: Users, permission: ADMIN_PERMISSIONS.USERS_MANAGE },
    { href: '/admin/route-requests', label: 'Route Requests', icon: ArrowLeftRight, permission: ADMIN_PERMISSIONS.ACADEMIC_MANAGE },
    { href: '/admin/intakes', label: 'Intakes', icon: CalendarDays, permission: ADMIN_PERMISSIONS.CENTRE_MANAGE },
    { href: '/admin/assignments', label: 'Assignments', icon: Link2, permission: ADMIN_PERMISSIONS.ACADEMIC_MANAGE },
    { href: '/admin/lecturer-applications', label: 'Lecturer Applications', icon: UserCheck, permission: ADMIN_PERMISSIONS.REGISTRAR_MANAGE },
    { href: '/admin/ai', label: 'AI Console', icon: Sparkles, permission: ADMIN_PERMISSIONS.CONTENT_REVIEW },
    { href: '/admin/curriculum', label: 'Curriculum', icon: BookMarked, permission: ADMIN_PERMISSIONS.CURRICULUM_MANAGE },
    { href: '/admin/curriculum-ops', label: 'Curriculum Ops', icon: Workflow, permission: ADMIN_PERMISSIONS.CURRICULUM_MANAGE },
    { href: '/admin/curriculum-blueprint', label: 'DCE1 Blueprint', icon: BookMarked, permission: ADMIN_PERMISSIONS.CURRICULUM_MANAGE },
    { href: '/admin/policies', label: 'Policies', icon: SlidersHorizontal, permission: ADMIN_PERMISSIONS.QA_MANAGE },
    { href: '/admin/management', label: 'Content Management', icon: Settings, permission: ADMIN_PERMISSIONS.CONTENT_REVIEW },
    { href: '/admin/consultants', label: 'Consultants', icon: UserCheck, permission: ADMIN_PERMISSIONS.REGISTRAR_MANAGE },
    { href: '/admin/reports', label: 'Reports & Analytics', icon: BookMarked, permission: ADMIN_PERMISSIONS.FINANCE_MANAGE },
    { href: '/admin/audit', label: 'Audit Logs', icon: BadgeCheck, permission: ADMIN_PERMISSIONS.AUDIT_VIEW },
    { href: '/admin/community', label: 'Manage Community', icon: Users, permission: ADMIN_PERMISSIONS.CONTENT_REVIEW },
    { href: '/admin/jobs', label: 'Manage Jobs', icon: Briefcase, permission: ADMIN_PERMISSIONS.CONTENT_REVIEW },
    { href: '/admin/system-health', label: 'System Health', icon: Shield, permission: ADMIN_PERMISSIONS.SYSTEM_MANAGE },
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
  const { session } = useSession();
  const [links, setLinks] = useState<NavLink[]>([]);

  useEffect(() => {
    const resolvedRole = role || 'premium-student';
    const sessionRole = session?.user?.role;
    const effectiveRole = isAdminRole(sessionRole) ? sessionRole : resolvedRole;
    const normalizedRole = effectiveRole === 'enrolled' ? 'premium-student' : isAdminRole(effectiveRole) ? 'admin' : effectiveRole;
    const nextLinks = allLinks[normalizedRole] || allLinks['premium-student'];

    if (normalizedRole === 'admin') {
      setLinks(
        nextLinks.filter((link) =>
          link.permission ? adminHasPermission(effectiveRole, link.permission, session?.user?.adminPermissions) : true
        )
      );
      return;
    }

    setLinks(nextLinks);
  }, [pathname, role, session]);

  return (
    <>
      <SidebarHeader className="glass-nav rounded-t-xl border-b border-sidebar-border/60">
        <div className="flex items-center gap-2">
          <Logo className="size-8 text-primary" />
          <span className="text-lg font-semibold text-primary">UnivAI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="glass-surface rounded-b-xl border border-sidebar-border/50 p-1">
        <SidebarMenu>
          {links.map((link) => (
            <SidebarMenuItem key={link.key || link.href}>
              <SidebarMenuButton
                asChild
                isActive={
                  pathname === link.href ||
                  (link.href !== '/student/dashboard' &&
                    pathname.startsWith(link.href) &&
                    link.href.split('/').length > 2)
                }
                tooltip={link.label}
                className="justify-start data-[active=true]:bg-sidebar-accent/70"
              >
                <Link href={link.href}>
                  <link.icon className="size-5" />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}
