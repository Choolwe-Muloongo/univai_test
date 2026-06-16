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
  Bug,
  MailCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ElementType } from 'react';

import { Logo } from '@/components/icons/logo';
import { useSession } from '@/components/providers/session-provider';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  STUDENT_ENTITLEMENT,
  hasStudentEntitlement,
  isStudentRole,
  roleToStudentAccessTier,
} from '@/lib/auth/roles';

type NavLink = {
  href: string;
  label: string;
  icon: ElementType;
  key?: string;
  exact?: boolean;
};

type NavGroup = {
  label?: string;
  links: NavLink[];
};

const NOVA_CHAT_HREF = '/student/ai/chat';
const STUDENT_FEEDBACK_LINK: NavLink = { href: '/student/suggestions', label: 'Ideas & Feedback', icon: Lightbulb };

function safeEntitlements(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return [];
}

const formalStudentLinks: NavLink[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: Home, exact: true },
  { href: '/student/formal-dashboard', label: 'Formal Dashboard', icon: GraduationCap, exact: true },
  { href: '/student/academic-command', label: 'Academic Command', icon: Workflow, exact: true },
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
  { href: '/student/dashboard', label: 'Mission Home', icon: Home, exact: true },
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
  { href: '/student/dashboard', label: 'Mission Home', icon: Home, exact: true },
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
      label: 'Dashboard',
      links: [
        { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
        { href: '/admin/today', label: "Today's Tasks", icon: ClipboardCheck, exact: true },
        { href: '/admin/programme-hub', label: 'Programme Hub', icon: GraduationCap, exact: true },
        { href: '/admin/academic-command', label: 'Academic Command', icon: Workflow, exact: true },
      ],
    },
    {
      label: 'Admissions',
      links: [
        { href: '/admin/admissions', label: 'Applications', icon: ClipboardCheck, exact: true },
        { href: '/admin/admissions/documents', label: 'Applicant Documents', icon: BookMarked, exact: true },
        { href: '/admin/admissions/offers', label: 'Offers', icon: BadgeCheck, exact: true },
        { href: '/admin/admissions/letters', label: 'Admission Letters', icon: BookMarked, exact: true },
        { href: '/admin/admissions/settings', label: 'Admission Settings', icon: SlidersHorizontal, exact: true },
        { href: '/admin/intakes', label: 'Intakes', icon: CalendarDays, exact: true },
        { href: '/admin/route-requests', label: 'Route Changes', icon: ArrowLeftRight, exact: true },
        { href: '/admin/programme-requirements', label: 'Programme Requirements', icon: ClipboardCheck, exact: true },
      ],
    },
    {
      label: 'Formal Programmes',
      links: [
        { href: '/admin/formal-programs', label: 'Programme Setup', icon: GraduationCap, exact: true },
        { href: '/admin/schools', label: 'Schools / Faculties', icon: Building, exact: true },
        { href: '/admin/departments', label: 'Departments', icon: Building, exact: true },
        { href: '/admin/academic-years', label: 'Academic Years', icon: CalendarDays, exact: true },
        { href: '/admin/semesters', label: 'Semesters', icon: CalendarDays, exact: true },
        { href: '/admin/programme-courses', label: 'Programme Courses', icon: BookOpen, exact: true },
        { href: '/admin/course-offerings', label: 'Course Offerings', icon: CalendarDays, exact: true },
        { href: '/admin/curriculum', label: 'Curriculum', icon: BookMarked, exact: true },
        { href: '/admin/curriculum-blueprint', label: 'Curriculum Blueprint', icon: BookMarked, exact: true },
        { href: '/admin/policies', label: 'Academic Policies', icon: SlidersHorizontal, exact: true },
        { href: '/admin/grading-policies', label: 'Grading Policies', icon: SlidersHorizontal, exact: true },
        { href: '/admin/assessments', label: 'Assessments', icon: ClipboardCheck, exact: true },
        { href: '/admin/assignments', label: 'Lecturer Assignments', icon: Link2, exact: true },
        { href: '/admin/exam-clinic', label: 'Exam Clinic', icon: ClipboardCheck, exact: true },
        { href: '/admin/exam-questions', label: 'Formal Question Bank', icon: BookMarked, exact: true },
        { href: '/admin/results', label: 'Results / Grades', icon: BadgeCheck, exact: true },
        { href: '/admin/financial-clearance', label: 'Financial Clearance', icon: Wallet, exact: true },
        { href: '/admin/progression', label: 'Progression', icon: ArrowLeftRight, exact: true },
      ],
    },
    {
      label: 'Short Courses',
      links: [
        { href: '/admin/short-courses', label: 'Short Course Dashboard', icon: LayoutDashboard, exact: true },
        { href: '/admin/short-courses/catalogue', label: 'Course Catalogue', icon: BookOpen, exact: true },
        { href: '/admin/short-courses/manual', label: 'Manual Builder', icon: BookMarked, exact: true },
        { href: '/admin/short-courses/builder', label: 'AI Course Builder', icon: Sparkles, exact: true },
        { href: '/admin/short-courses/json-builder', label: 'JSON Builder', icon: Workflow, exact: true },
        { href: '/admin/short-courses/review', label: 'Review & Publish', icon: BadgeCheck, exact: true },
        { href: '/admin/short-courses/question-bank', label: 'Short Course Question Bank', icon: ClipboardCheck, exact: true },
        { href: '/admin/short-courses/pricing', label: 'Pricing', icon: CreditCard, exact: true },
        { href: '/admin/short-courses/learners', label: 'Learners', icon: Users, exact: true },
        { href: '/admin/short-courses/enrolments', label: 'Enrolments', icon: UserCheck, exact: true },
        { href: '/admin/short-courses/card-images', label: 'Card Images', icon: BookMarked, exact: true },
        { href: '/admin/short-courses/certificates', label: 'Certificates', icon: BadgeCheck, exact: true },
      ],
    },
    {
      label: 'People',
      links: [
        { href: '/admin/users', label: 'All Users', icon: Users, exact: true },
        { href: '/admin/learners', label: 'All Learners', icon: Users, exact: true },
        { href: '/admin/programme-students', label: 'Programme Students', icon: GraduationCap, exact: true },
        { href: '/admin/short-courses/learners', label: 'Short Course Learners', icon: BookOpen, exact: true },
        { href: '/admin/lecturers', label: 'Lecturers', icon: UserCheck, exact: true },
        { href: '/admin/lecturer-applications', label: 'Lecturer Applications', icon: UserCheck, exact: true },
        { href: '/admin/instructors', label: 'External Instructors', icon: User, exact: true },
        { href: '/admin/instructor-applications', label: 'Instructor Applications', icon: ClipboardCheck, exact: true },
        { href: '/admin/instructor-courses', label: 'Instructor Courses', icon: BookOpen, exact: true },
        { href: '/admin/employers', label: 'Employers', icon: Briefcase, exact: true },
        { href: '/admin/consultants', label: 'Consultants', icon: UserCheck, exact: true },
      ],
    },
    {
      label: 'Mode & Delivery',
      links: [
        { href: '/admin/mode-delivery', label: 'Learning Mode Rules', icon: SlidersHorizontal, exact: true },
        { href: '/admin/delivery-groups', label: 'Delivery Groups', icon: Users, exact: true },
        { href: '/admin/practical-sessions', label: 'Practical Sessions', icon: FlaskConical, exact: true },
        { href: '/admin/venues', label: 'Labs / Venues', icon: Building, exact: true },
        { href: '/admin/partner-institutions', label: 'Partner Institutions', icon: Link2, exact: true },
        { href: '/admin/timetables', label: 'Timetables', icon: CalendarDays, exact: true },
        { href: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck, exact: true },
        { href: '/admin/live-classes', label: 'Live Class Links', icon: Workflow, exact: true },
      ],
    },
    {
      label: 'Content & AI',
      links: [
        { href: '/admin/content-studio', label: 'Content Studio', icon: BookOpen, exact: true },
        { href: '/admin/content/lessons', label: 'Lessons', icon: BookOpen, exact: true },
        { href: '/admin/content/documents', label: 'Documents', icon: BookMarked, exact: true },
        { href: '/admin/content/quizzes', label: 'Quizzes', icon: ClipboardCheck, exact: true },
        { href: '/admin/content/assignments', label: 'Assignments', icon: ClipboardCheck, exact: true },
        { href: '/admin/official-content', label: 'Official Content', icon: Shield, exact: true },
        { href: '/admin/content-review', label: 'Review Queue', icon: BadgeCheck, exact: true },
        { href: '/admin/content/class-view-builder', label: 'Class View Builder', icon: Workflow, exact: true },
      ],
    },
    {
      label: 'AI Studio',
      links: [
        { href: '/admin/ai', label: 'AI Studio Dashboard', icon: Sparkles, exact: true },
        { href: '/admin/ai/lesson', label: 'Generate Lesson', icon: Lightbulb, exact: true },
        { href: '/admin/ai/quiz', label: 'Generate Quiz', icon: ClipboardCheck, exact: true },
        { href: '/admin/ai/assignment', label: 'Generate Assignment', icon: ClipboardCheck, exact: true },
        { href: '/admin/ai/exam', label: 'Generate Exam', icon: BookMarked, exact: true },
        { href: '/admin/ai/json-course-builder', label: 'JSON Course Builder', icon: Workflow, exact: true },
        { href: '/admin/ai-usage', label: 'AI Usage Logs', icon: BookMarked, exact: true },
        { href: '/admin/reports/ai-content', label: 'AI Content Reports', icon: Sparkles, exact: true },
      ],
    },
    {
      label: 'Finance',
      links: [
        { href: '/admin/payments', label: 'Payments', icon: CreditCard, exact: true },
        { href: '/admin/invoices', label: 'Invoices', icon: Landmark, exact: true },
        { href: '/admin/programme-fees', label: 'Programme Fees', icon: GraduationCap, exact: true },
        { href: '/admin/short-course-fees', label: 'Short Course Fees', icon: BookOpen, exact: true },
        { href: '/admin/certificate-fees', label: 'Certificate Fees', icon: BadgeCheck, exact: true },
        { href: '/admin/ai-package-sales', label: 'AI Package Sales', icon: Sparkles, exact: true },
        { href: '/admin/instructor-earnings', label: 'Instructor Earnings', icon: Wallet, exact: true },
        { href: '/admin/affiliates', label: 'Affiliate Program', icon: Landmark, exact: true },
        { href: '/admin/payouts', label: 'Payouts', icon: Landmark, exact: true },
        { href: '/admin/finance/reports', label: 'Finance Reports', icon: BookMarked, exact: true },
      ],
    },
    {
      label: 'Communication',
      links: [
        { href: '/admin/announcements', label: 'Announcements', icon: Users, exact: true },
        { href: '/admin/notifications', label: 'Notifications', icon: BadgeCheck, exact: true },
        { href: '/admin/email-test', label: 'Email Test', icon: MailCheck, exact: true },
        { href: '/admin/feedback', label: 'Feedback Board', icon: Lightbulb, exact: true },
        { href: '/admin/message-templates', label: 'Message Templates', icon: BookMarked, exact: true },
        { href: '/admin/delivery-logs', label: 'Delivery Logs', icon: ClipboardCheck, exact: true },
      ],
    },
    {
      label: 'Reports',
      links: [
        { href: '/admin/reports/admissions', label: 'Admissions Reports', icon: BookMarked, exact: true },
        { href: '/admin/reports/learners', label: 'Learner Reports', icon: Users, exact: true },
        { href: '/admin/reports/academic', label: 'Academic Reports', icon: GraduationCap, exact: true },
        { href: '/admin/reports/short-courses', label: 'Short Course Reports', icon: BookOpen, exact: true },
        { href: '/admin/finance/reports', label: 'Finance Reports', icon: Landmark, exact: true },
        { href: '/admin/reports/ai-content', label: 'AI Content Reports', icon: Sparkles, exact: true },
        { href: '/admin/reports/system', label: 'System Reports', icon: Shield, exact: true },
      ],
    },
    {
      label: 'System',
      links: [
        { href: '/admin/system', label: 'Settings', icon: Settings, exact: true },
        { href: '/admin/beta-reports', label: 'Error Reports', icon: Bug, exact: true },
        { href: '/admin/document-branding', label: 'Document Branding', icon: BadgeCheck, exact: true },
        { href: '/admin/integrations', label: 'Integrations', icon: Link2, exact: true },
        { href: '/admin/roles-permissions', label: 'Roles & Permissions', icon: Shield, exact: true },
        { href: '/admin/audit', label: 'Audit Logs', icon: BadgeCheck, exact: true },
        { href: '/admin/system-health', label: 'System Health', icon: Shield, exact: true },
      ],
    },
    {
      label: 'Community & Careers',
      links: [
        { href: '/admin/community', label: 'Community', icon: Users, exact: true },
        { href: '/admin/jobs', label: 'Jobs', icon: Briefcase, exact: true },
        { href: '/admin/consultants', label: 'Consultants', icon: UserCheck, exact: true },
        { href: '/admin/research', label: 'Research Hub', icon: FlaskConical, exact: true },
      ],
    },
  ],
  lecturer: [
    {
      links: [
        { href: '/lecturer/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { href: '/lecturer/formal-dashboard', label: 'Formal Dashboard', icon: GraduationCap, exact: true },
        { href: '/lecturer/academic-command', label: 'Academic Command', icon: Workflow, exact: true },
        { href: '/lecturer/builders', label: 'Builders', icon: Sparkles, exact: true },
        { href: '/lecturer/courses', label: 'Courses', icon: BookOpen },
        { href: '/lecturer/exams', label: 'Exam Bank', icon: ClipboardCheck },
        { href: '/lecturer/progress', label: 'Student Progress', icon: UserCheck },
        { href: '/lecturer/community', label: 'Community', icon: Users, exact: true },
        { href: '/lecturer/research', label: 'Research Hub', icon: FlaskConical },
        { href: '/lecturer/profile', label: 'Profile', icon: User, exact: true },
      ],
    },
  ],
  instructor: [
    {
      links: [
        { href: '/instructor/portal', label: 'Instructor Portal', icon: LayoutDashboard, exact: true },
        { href: '/instructor/courses', label: 'My Courses', icon: BookOpen },
        { href: '/instructor/ai', label: 'AI Generator', icon: Sparkles },
        { href: '/instructor/earnings', label: 'Earnings', icon: Wallet },
        { href: '/instructor/settings', label: 'Settings', icon: Settings, exact: true },
      ],
    },
  ],
  employer: [
    {
      links: [
        { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { href: '/employer/jobs', label: 'Jobs', icon: Briefcase },
        { href: '/employer/talent', label: 'Talent', icon: Users },
        { href: '/employer/research', label: 'Research Hub', icon: FlaskConical },
      ],
    },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const { session, loading } = useSession();
  const [resolvedRole, setResolvedRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setResolvedRole(session?.user?.role ?? null);
    }
  }, [loading, session?.user?.role]);

  const role = resolvedRole ?? session?.user?.role ?? 'student';
  const accessTier = roleToStudentAccessTier(role);
  const entitlements = safeEntitlements(session?.user?.entitlements);
  const navRole = isStudentRole(role)
    ? hasStudentEntitlement(STUDENT_ENTITLEMENT.PROGRAMME, entitlements, accessTier)
      ? 'formal-student'
      : accessTier === 'free-learning'
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
                  const active = link.exact
                    ? currentPath === link.href
                    : currentPath === link.href || currentPath.startsWith(`${link.href}/`);
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
