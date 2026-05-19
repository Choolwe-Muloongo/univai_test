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
import { useEffect, useState } from 'react';

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
  icon: React.ElementType;
  key?: string;
};

type NavGroup = {
  label?: string;
  links: NavLink[];
};

const studentCoreLinks: NavLink[] = [
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
];

const shortCourseOnlyStudentLinks: NavLink[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: Home },
  { href: '/student/courses', label: 'My Short Courses', icon: BookOpen },
  { href: '/short-courses', label: 'Browse Short Courses', icon: BookMarked },
  { href: '/student/courses', label: 'Practice', icon: ClipboardCheck, key: 'student-short-practice' },
  { href: '/student/certificates', label: 'Certificates', icon: BadgeCheck },
  { href: '/student/ai', label: 'AI Tutor', icon: Lightbulb },
  { href: '/admissions/portal', label: 'Apply for Formal Programme', icon: GraduationCap },
  { href: '/student/payments', label: 'Billing', icon: Landmark },
];

const formalStudentLinks: NavLink[] = [
  { href: '/student/dashboard', label: 'Dashboard', icon: Home },
  { href: '/student/program', label: 'My Program', icon: GraduationCap },
  { href: '/student/study-plan', label: 'Study Plan', icon: BookOpen },
  { href: '/student/courses', label: 'Short Courses', icon: BookMarked },
  { href: '/student/courses', label: 'Practice', icon: ClipboardCheck, key: 'student-formal-practice' },
  { href: '/student/certificates', label: 'Certificates', icon: BadgeCheck },
  { href: '/student/ai', label: 'AI Tutor', icon: Lightbulb },
  { href: '/student/payments', label: 'Billing', icon: Landmark },
];

const groupedLinks: Record<string, NavGroup[]> = {
  'premium-student': [{ links: studentCoreLinks }],
  student: [{ links: studentCoreLinks }],
  'freemium-student': [
    {
      links: [
        { href: '/student/dashboard', label: 'Dashboard', icon: Home },
        { href: '/student/program', label: 'My Program', icon: GraduationCap },
        { href: '/student/community', label: 'Community', icon: Users },
        { href: '/student/payments', label: 'Upgrade', icon: CreditCard },
      ],
    },
  ],
  admin: [
    {
      label: 'Overview',
      links: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/today', label: "Today's Tasks", icon: ClipboardCheck },
      ],
    },
    {
      label: 'Admissions',
      links: [
        { href: '/admin/admissions', label: 'Applications', icon: ClipboardCheck },
        { href: '/admin/admissions', label: 'Applicant Documents', icon: BookMarked, key: 'admin-applicant-documents' },
        { href: '/admin/admissions', label: 'Offers', icon: BadgeCheck, key: 'admin-offers' },
        { href: '/admin/intakes', label: 'Intakes', icon: CalendarDays },
        { href: '/admin/route-requests', label: 'Route Changes', icon: ArrowLeftRight },
        { href: '/admin/programme-requirements', label: 'Programme Requirements', icon: ClipboardCheck },
        { href: '/admin/admissions', label: 'Admission Settings', icon: SlidersHorizontal, key: 'admin-admission-settings' },
      ],
    },
    {
      label: 'People',
      links: [
        { href: '/admin/users', label: 'All Learners', icon: Users },
        { href: '/admin/reports/enrollment', label: 'Programme Students', icon: GraduationCap },
        { href: '/admin/short-courses/learners', label: 'Short Course Learners', icon: BookOpen },
        { href: '/admin/reports/enrollment', label: 'Progress', icon: Trophy, key: 'admin-learner-progress' },
        { href: '/admin/certificates', label: 'Certificates', icon: BadgeCheck },
      ],
    },
    {
      label: 'Academic Structure',
      links: [
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
        { href: '/admin/curriculum-blueprint', label: 'Curriculum / Blueprint', icon: BookMarked },
        { href: '/admin/policies', label: 'Academic Policies', icon: SlidersHorizontal },
        { href: '/admin/grading-policies', label: 'Grading Policies', icon: SlidersHorizontal },
        { href: '/admin/assessments', label: 'Assessments', icon: ClipboardCheck },
        { href: '/admin/assignments', label: 'Lecturer Assignments', icon: Link2 },
        { href: '/admin/exam-clinic', label: 'Exam Clinic', icon: ClipboardCheck },
        { href: '/admin/exam-questions', label: 'Question Bank', icon: BookMarked },
      ],
    },
    {
      label: 'Short Courses',
      links: [
        { href: '/admin/short-courses', label: 'Overview', icon: LayoutDashboard },
        { href: '/admin/short-courses/catalogue', label: 'Course Catalogue', icon: BookOpen },
        { href: '/admin/short-courses/builder', label: 'AI Course Builder', icon: Sparkles },
        { href: '/admin/short-courses/manual', label: 'Manual Builder', icon: BookMarked },
        { href: '/admin/short-courses/review', label: 'Review & Publish', icon: BadgeCheck },
        { href: '/admin/short-courses/enrolments', label: 'Enrolments', icon: Users },
        { href: '/admin/short-courses/pricing', label: 'Pricing', icon: CreditCard },
        { href: '/admin/certificates', label: 'Certificates', icon: BadgeCheck, key: 'admin-short-certificates' },
      ],
    },
    {
      label: 'Mode & Delivery',
      links: [
        { href: '/admin/mode-delivery', label: 'Learning Mode Rules', icon: SlidersHorizontal },
        { href: '/admin/delivery-groups', label: 'Delivery Groups', icon: Users },
        { href: '/admin/practical-sessions', label: 'Practical Sessions', icon: FlaskConical },
        { href: '/admin/venues', label: 'Labs / Venues', icon: Building },
        { href: '/admin/partner-institutions', label: 'Partner Institutions', icon: Link2 },
      ],
    },
    {
      label: 'AI & Content',
      links: [
        { href: '/admin/content-studio', label: 'Lessons', icon: BookOpen },
        { href: '/admin/content-studio', label: 'Documents', icon: BookMarked, key: 'admin-content-documents' },
        { href: '/admin/content-studio', label: 'Quizzes', icon: ClipboardCheck, key: 'admin-content-quizzes' },
        { href: '/admin/content-studio', label: 'Assignments', icon: ClipboardCheck, key: 'admin-content-assignments' },
        { href: '/admin/official-content', label: 'Official Content', icon: Shield },
        { href: '/admin/content-review', label: 'Review Queue', icon: BadgeCheck },
        { href: '/admin/content-studio', label: 'Class View Builder', icon: Workflow, key: 'admin-class-view-builder' },
      ],
    },
    {
      label: 'AI Studio',
      links: [
        { href: '/admin/ai', label: 'AI Studio', icon: Sparkles },
        { href: '/admin/ai', label: 'Generate Lesson', icon: Lightbulb, key: 'admin-ai-lesson' },
        { href: '/admin/ai', label: 'Generate Quiz', icon: ClipboardCheck, key: 'admin-ai-quiz' },
        { href: '/admin/ai-usage', label: 'AI Usage Logs', icon: BookMarked },
        { href: '/admin/content-review', label: 'AI Content Reports', icon: BookMarked, key: 'admin-ai-reports' },
      ],
    },
    {
      label: 'Teachers & Instructors',
      links: [
        { href: '/admin/users', label: 'Lecturers', icon: UserCheck, key: 'admin-lecturers' },
        { href: '/admin/lecturer-applications', label: 'Lecturer Applications', icon: UserCheck },
        { href: '/admin/instructors', label: 'External Instructors', icon: User },
        { href: '/admin/instructors', label: 'Instructor Applications', icon: ClipboardCheck, key: 'admin-instructor-applications' },
        { href: '/admin/instructors', label: 'Instructor Courses', icon: BookOpen, key: 'admin-instructor-courses' },
      ],
    },
    {
      label: 'Finance',
      links: [
        { href: '/admin/payments', label: 'Payments', icon: CreditCard },
        { href: '/admin/invoices', label: 'Invoices', icon: Landmark },
        { href: '/admin/programme-fees', label: 'Programme Fees', icon: GraduationCap },
        { href: '/admin/short-course-fees', label: 'Short Course Fees', icon: BookOpen },
        { href: '/admin/certificate-fees', label: 'Certificate Fees', icon: BadgeCheck },
        { href: '/admin/ai-package-sales', label: 'AI Package Sales', icon: Sparkles },
        { href: '/admin/instructor-earnings', label: 'Instructor Earnings', icon: Wallet },
        { href: '/admin/affiliates', label: 'Affiliate Program', icon: Landmark, key: 'admin-affiliates' },
        { href: '/admin/payouts', label: 'Payouts', icon: Landmark, key: 'admin-payouts' },
        { href: '/admin/finance/reports', label: 'Finance Reports', icon: BookMarked },
      ],
    },
    {
      label: 'Communication',
      links: [
        { href: '/admin/announcements', label: 'Announcements', icon: Users },
        { href: '/admin/notifications', label: 'Notifications', icon: BadgeCheck },
        { href: '/admin/message-templates', label: 'Message Templates', icon: BookMarked },
        { href: '/admin/delivery-logs', label: 'Delivery Logs', icon: ClipboardCheck },
      ],
    },
    {
      label: 'Reports',
      links: [
        { href: '/admin/reports/admissions', label: 'Admissions Reports', icon: BookMarked },
        { href: '/admin/reports/learners', label: 'Learner Reports', icon: Users },
        { href: '/admin/reports/academic', label: 'Academic Reports', icon: GraduationCap },
        { href: '/admin/reports/short-courses', label: 'Short Course Reports', icon: BookOpen },
        { href: '/admin/finance/reports', label: 'Finance Reports', icon: Landmark },
        { href: '/admin/reports/ai-content', label: 'AI Content Reports', icon: Sparkles },
      ],
    },
    {
      label: 'System',
      links: [
        { href: '/admin/system', label: 'Settings', icon: Settings },
        { href: '/admin/document-branding', label: 'Document Branding', icon: BadgeCheck },
        { href: '/admin/system', label: 'Integrations', icon: Link2, key: 'admin-integrations' },
        { href: '/admin/users', label: 'Roles & Permissions', icon: Shield },
        { href: '/admin/audit', label: 'Audit Logs', icon: BadgeCheck },
        { href: '/admin/system-health', label: 'System Health', icon: Shield, key: 'admin-system-health' },
      ],
    },
    {
      label: 'Community & Careers',
      links: [
        { href: '/admin/community', label: 'Community', icon: Users },
        { href: '/admin/jobs', label: 'Jobs', icon: Briefcase },
        { href: '/admin/consultants', label: 'Consultants', icon: UserCheck },
      ],
    },
  ],
  lecturer: [
    {
      links: [
        { href: '/lecturer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/lecturer/courses', label: 'Courses', icon: BookOpen },
        { href: '/lecturer/exams', label: 'Exam Bank', icon: ClipboardCheck },
        { href: '/lecturer/profile', label: 'Profile', icon: User },
        { href: '/lecturer/progress', label: 'Student Progress', icon: UserCheck },
        { href: '/lecturer/community', label: 'Community', icon: Users },
        { href: '/lecturer/research', label: 'Research Hub', icon: FlaskConical },
      ],
    },
  ],
  instructor: [
    {
      links: [
        { href: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/instructor/courses', label: 'My Courses', icon: BookOpen },
        { href: '/instructor/courses/create', label: 'Create Course', icon: Settings },
        { href: '/instructor/course-builder', label: 'Course Materials', icon: BookMarked },
        { href: '/instructor/ai-builder', label: 'AI Course Builder', icon: Sparkles },
        { href: '/instructor/ai-builder/generations', label: 'AI Drafts', icon: BookMarked, key: 'instructor-ai-drafts' },
        { href: '/instructor/ai-builder/packages', label: 'AI Packages', icon: CreditCard },
        { href: '/instructor/ai-builder/sources', label: 'AI Sources', icon: BookMarked },
        { href: '/instructor/courses/review', label: 'Review Submission', icon: ClipboardCheck },
        { href: '/instructor/learners', label: 'Learners', icon: Users },
        { href: '/instructor/reviews', label: 'Reviews', icon: BadgeCheck },
        { href: '/instructor/earnings', label: 'Earnings', icon: Wallet },
        { href: '/instructor/payouts', label: 'Payouts', icon: Landmark },
        { href: '/instructor/profile', label: 'Profile & Verification', icon: User },
        { href: '/instructor/support', label: 'Support', icon: Lightbulb },
      ],
    },
  ],
  employer: [
    {
      links: [
        { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/employer/jobs', label: 'Job Listings', icon: Briefcase },
        { href: '/employer/research', label: 'Research', icon: FlaskConical },
        { href: '/employer/profile', label: 'Company Profile', icon: Building },
        { href: '/verify', label: 'Verify Credential', icon: BadgeCheck },
      ],
    },
  ],
};

function normalizeRole(role?: string) {
  if (role === 'enrolled') return 'premium-student';
  if (role === 'exam-officer') return 'admin';
  return role || 'premium-student';
}

function isLinkActive(pathname: string, href: string, activeHref: string | null) {
  return activeHref === href;
}

export function AppSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const { session } = useSession();
  const [groups, setGroups] = useState<NavGroup[]>([]);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  useEffect(() => {
    const normalizedRole = normalizeRole(session?.user?.role ?? role);
    const tier = roleToStudentAccessTier(normalizedRole);
    const hasProgrammeAccess = hasStudentEntitlement(
      STUDENT_ENTITLEMENT.PROGRAMME,
      session?.user?.entitlements,
      tier,
    );
    const nextGroups = isStudentRole(normalizedRole)
      ? [{ links: hasProgrammeAccess ? formalStudentLinks : shortCourseOnlyStudentLinks }]
      : groupedLinks[normalizedRole] || groupedLinks['premium-student'];
    setGroups(nextGroups);

    const links = nextGroups.flatMap((group) => group.links);
    const ranked = links
      .map((link) => ({ href: link.href, score: pathname === link.href ? 10_000 : pathname.startsWith(`${link.href}/`) ? link.href.length : -1 }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score);

    setActiveHref(ranked[0]?.href ?? null);
  }, [pathname, role, session]);

  return (
    <>
      <SidebarHeader className="glass-nav rounded-t-xl border-b border-sidebar-border/60">
        <div className="flex items-center gap-2">
          <Logo className="size-9 rounded-xl brand-logo-glow" />
          <span className="brand-gradient-text text-lg font-semibold">UnivAI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="glass-surface rounded-b-xl border border-sidebar-border/50 p-1">
        {groups.map((group, index) => (
          <SidebarGroup key={group.label || `nav-group-${index}`} className="px-1 py-1">
            {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.links.map((link) => (
                  <SidebarMenuItem key={link.key || link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isLinkActive(pathname, link.href, activeHref)}
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
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </>
  );
}
