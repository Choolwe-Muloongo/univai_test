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
  MailCheck,
  Bug,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Logo } from '@/components/icons/logo';
import { useSession } from '@/components/providers/session-provider';
import {
  STUDENT_ENTITLEMENT,
  hasStudentEntitlement,
  isStudentRole,
  roleToStudentAccessTier,
} from '@/lib/auth/roles';

/* rest of sidebar intentionally preserved by app shell runtime */

type NavLink = {
  href: string;
  label: string;
  icon: React.ElementType;
  key?: string;
};

type NavGroup = {
  label?: string;
  links: NavLink[];
};

const NOVA_CHAT_HREF = '/student/ai/chat';
const STUDENT_FEEDBACK_LINK: NavLink = { href: '/student/suggestions', label: 'Ideas & Feedback', icon: Lightbulb };

const formalStudentLinks: NavLink[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: Home },
  { href: '/student/formal-dashboard', label: 'Formal Dashboard', icon: GraduationCap },
  { href: '/student/academic-command', label: 'Academic Command', icon: Workflow },
  { href: '/student/program', label: 'My Program', icon: GraduationCap },
  { href: '/student/timetable', label: 'Timetable', icon: CalendarDays },
  { href: '/student/assignments', label: 'Assignments', icon: ClipboardCheck },
  { href: '/student/grades', label: 'Results', icon: BadgeCheck },
  { href: '/student/enroll', label: 'Enrollment', icon: ClipboardCheck },
  { href: '/student/wallet', label: 'Financial Clearance', icon: Wallet },
  { href: NOVA_CHAT_HREF, label: 'Nova Mentor', icon: Sparkles },
  STUDENT_FEEDBACK_LINK,
  { href: '/student/profile', label: 'Profile', icon: User },
  { href: '/student/settings', label: 'Settings', icon: Settings },
];

const studentCoreLinks: NavLink[] = [
  { href: '/student/dashboard', label: 'Mission Home', icon: Home },
  { href: '/student/courses', label: 'My Journeys', icon: BookOpen },
  { href: '/student/training-arena', label: 'Training Arena', icon: ClipboardCheck, key: 'student-core-training-arena' },
  { href: '/student/affiliate', label: 'Affiliate Dashboard', icon: Link2 },
  { href: NOVA_CHAT_HREF, label: 'Nova Mentor', icon: Sparkles },
  STUDENT_FEEDBACK_LINK,
  { href: '/student/rewards', label: 'Rewards', icon: Trophy },
  { href: '/student/leaderboard', label: 'Activity League', icon: Trophy },
  { href: '/student/mistakes', label: 'Mistake Bank', icon: ClipboardCheck },
  { href: '/student/certificates', label: 'Skill Proofs', icon: BadgeCheck },
  { href: '/student/profile', label: 'Profile', icon: User },
  { href: '/student/settings', label: 'Settings', icon: Settings },
  { href: '/student/program', label: 'My Program', icon: GraduationCap },
  { href: '/student/study-plan', label: 'Study Plan', icon: BookOpen },
  { href: '/student/virtual-lab', label: 'Virtual Lab', icon: FlaskConical },
  { href: '/student/wallet', label: 'My Wallet', icon: Wallet },
  { href: '/student/community', label: 'Community', icon: Users },
  { href: '/student/jobs', label: 'Job Board', icon: Briefcase },
  { href: '/student/research', label: 'Research Hub', icon: FlaskConical },
  { href: '/student/payments', label: 'Billing', icon: Landmark },
];

const shortCourseOnlyStudentLinks: NavLink[] = [
  { href: '/student/dashboard', label: 'Mission Home', icon: Home },
  { href: '/student/courses', label: 'My Journeys', icon: BookOpen },
  { href: '/student/training-arena', label: 'Training Arena', icon: ClipboardCheck, key: 'student-short-training-arena' },
  { href: '/student/affiliate', label: 'Affiliate Dashboard', icon: Link2 },
  { href: NOVA_CHAT_HREF, label: 'Nova Mentor', icon: Sparkles },
  STUDENT_FEEDBACK_LINK,
  { href: '/student/rewards', label: 'Rewards', icon: Trophy },
  { href: '/student/leaderboard', label: 'Activity League', icon: Trophy },
  { href: '/student/mistakes', label: 'Mistake Bank', icon: ClipboardCheck },
  { href: '/student/certificates', label: 'Skill Proofs', icon: BadgeCheck },
  { href: '/student/profile', label: 'Profile', icon: User },
  { href: '/student/settings', label: 'Settings', icon: Settings },
  { href: '/short-courses', label: 'Browse Short Courses', icon: BookMarked },
  { href: '/admissions/portal', label: 'Apply for Formal Programme', icon: GraduationCap },
  { href: '/student/payments', label: 'Billing', icon: Landmark },
];

const groupedLinks: Record<string, NavGroup[]> = {
  'short-course-student': [{ links: shortCourseOnlyStudentLinks }],
  'formal-student': [{ links: formalStudentLinks }],
  'premium-student': [{ links: studentCoreLinks }],
  student: [{ links: studentCoreLinks }],
  'freemium-student': [{ links: studentCoreLinks.slice(0, 10) }],
  admin: [
    {
      label: 'Overview',
      links: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/programme-hub', label: 'Programme Hub', icon: GraduationCap },
        { href: '/admin/academic-command', label: 'Academic Command', icon: Workflow },
        { href: '/admin/today', label: "Today's Tasks", icon: ClipboardCheck },
      ],
    },
    {
      label: 'Admissions',
      links: [
        { href: '/admin/admissions', label: 'Applications', icon: ClipboardCheck },
        { href: '/admin/intakes', label: 'Intakes', icon: CalendarDays },
        { href: '/admin/route-requests', label: 'Route Changes', icon: ArrowLeftRight },
        { href: '/admin/programme-requirements', label: 'Programme Requirements', icon: ClipboardCheck },
      ],
    },
    {
      label: 'Academic Structure',
      links: [
        { href: '/admin/formal-programs', label: 'Programme Setup', icon: GraduationCap },
        { href: '/admin/academic-structure', label: 'Schools / Faculties', icon: Building },
        { href: '/admin/departments', label: 'Departments', icon: Building },
        { href: '/admin/academic-years', label: 'Academic Years', icon: CalendarDays },
        { href: '/admin/semesters', label: 'Semesters', icon: CalendarDays },
      ],
    },
    {
      label: 'Academics',
      links: [
        { href: '/admin/management', label: 'Programmes', icon: GraduationCap },
        { href: '/admin/programme-courses', label: 'Programme Courses', icon: BookOpen },
        { href: '/admin/course-offerings', label: 'Course Offerings', icon: CalendarDays },
        { href: '/admin/curriculum', label: 'Curriculum', icon: BookMarked },
        { href: '/admin/policies', label: 'Academic Policies', icon: SlidersHorizontal },
        { href: '/admin/assessments', label: 'Assessments', icon: ClipboardCheck },
        { href: '/admin/assignments', label: 'Lecturer Assignments', icon: Link2 },
        { href: '/admin/exam-questions', label: 'Question Bank', icon: BookMarked },
      ],
    },
    {
      label: 'People & Finance',
      links: [
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/lecturer-applications', label: 'Lecturer Applications', icon: UserCheck },
        { href: '/admin/payments', label: 'Payments', icon: CreditCard },
        { href: '/admin/invoices', label: 'Invoices', icon: Landmark },
        { href: '/admin/finance/reports', label: 'Finance Reports', icon: BookMarked },
      ],
    },
    {
      label: 'System',
      links: [
        { href: '/admin/system', label: 'Settings', icon: Settings },
        { href: '/admin/beta-reports', label: 'Error Reports', icon: Bug },
        { href: '/admin/document-branding', label: 'Document Branding', icon: BadgeCheck },
        { href: '/admin/system-health', label: 'System Health', icon: Shield, key: 'admin-system-health' },
      ],
    },
  ],
  lecturer: [
    {
      links: [
        { href: '/lecturer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/lecturer/formal-dashboard', label: 'Formal Dashboard', icon: GraduationCap },
        { href: '/lecturer/academic-command', label: 'Academic Command', icon: Workflow },
        { href: '/lecturer/builders', label: 'Builders', icon: Sparkles },
        { href: '/lecturer/courses', label: 'Courses', icon: BookOpen },
        { href: '/lecturer/exams', label: 'Exam Bank', icon: ClipboardCheck },
        { href: '/lecturer/progress', label: 'Student Progress', icon: UserCheck },
        { href: '/lecturer/profile', label: 'Profile', icon: User },
      ],
    },
  ],
  instructor: [
    {
      links: [
        { href: '/instructor/portal', label: 'Instructor Portal', icon: LayoutDashboard },
        { href: '/instructor/courses', label: 'My Courses', icon: BookOpen },
        { href: '/instructor/ai', label: 'AI Generator', icon: Sparkles },
        { href: '/instructor/earnings', label: 'Earnings', icon: Wallet },
        { href: '/instructor/settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
  employer: [
    {
      links: [
        { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/employer/jobs', label: 'Jobs', icon: Briefcase },
        { href: '/employer/talent', label: 'Talent', icon: Users },
        { href: '/employer/research', label: 'Research Hub', icon: FlaskConical },
      ],
    },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const { session, loading } = useSession();
  const [resolvedRole, setResolvedRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setResolvedRole(session?.user?.role ?? null);
    }
  }, [loading, session?.user?.role]);

  const role = resolvedRole ?? session?.user?.role ?? 'student';
  const accessTier = roleToStudentAccessTier(role);
  const entitlements = session?.user?.entitlements ?? [];
  const navRole = isStudentRole(role)
    ? hasStudentEntitlement(STUDENT_ENTITLEMENT.PROGRAMME, entitlements, accessTier)
      ? 'formal-student'
      : accessTier === 'short-course'
        ? 'short-course-student'
        : role
    : role;

  const groups = groupedLinks[navRole] ?? groupedLinks.student;

  return (
    <>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-9 w-9" />
          <div>
            <p className="text-sm font-semibold">UnivAI</p>
            <p className="text-xs text-muted-foreground">Hybrid University</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, index) => (
          <SidebarGroup key={`${group.label ?? 'main'}-${index}`}>
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <SidebarMenuItem key={link.key ?? link.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={link.href}>
                          <Icon className="h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </>
  );
}
