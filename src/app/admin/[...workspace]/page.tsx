import Link from 'next/link';
import { ArrowRight, ClipboardCheck, Construction, Database, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const workspaces: Record<string, { title: string; section: string; description: string; backend?: string[]; actions: string[]; related?: { label: string; href: string }[] }> = {
  'today': {
    title: "Today's Tasks",
    section: 'Dashboard',
    description: 'Daily command center for pending admissions, documents, finance exceptions, content review and system alerts.',
    backend: ['/admin/dashboard', '/admin/admissions', '/admin/beta-reports', '/admin/system-health'],
    actions: ['Review pending applications', 'Verify uploaded documents', 'Check unpaid invoices', 'Inspect error reports', 'Open system health checks'],
    related: [{ label: 'Admissions', href: '/admin/admissions' }, { label: 'System Health', href: '/admin/system-health' }],
  },
  'admissions/documents': {
    title: 'Applicant Documents',
    section: 'Admissions',
    description: 'Verify applicant documents, proofs and certificates before offer/admission decisions.',
    backend: ['/admin/admissions/{id}/documents', '/admin/admissions/{id}/documents/{document}'],
    actions: ['Filter documents by status', 'Open applicant document sets', 'Mark documents verified or rejected', 'Record reviewer notes'],
    related: [{ label: 'Applications', href: '/admin/admissions' }],
  },
  'admissions/offers': {
    title: 'Offers',
    section: 'Admissions',
    description: 'Manage offer generation, acceptance tracking and revoked/expired offers.',
    backend: ['/admin/admissions/{id}', '/admin/admissions/{id} PATCH'],
    actions: ['Show offer-ready applications', 'Send or resend offers', 'Attach offer message', 'Track accepted offers'],
    related: [{ label: 'Applications', href: '/admin/admissions' }],
  },
  'admissions/letters': {
    title: 'Admission Letters',
    section: 'Admissions',
    description: 'Generate, preview and download official admission letters using document branding.',
    backend: ['/admissions/admission-letter', '/admin/document-branding'],
    actions: ['Preview letter branding', 'Generate admission letter', 'Download PDF', 'Reissue corrected letter'],
    related: [{ label: 'Document Branding', href: '/admin/document-branding' }],
  },
  'admissions/settings': {
    title: 'Admission Settings',
    section: 'Admissions',
    description: 'Open or close applications and lecturer applications, then control public status messages.',
    backend: ['/admissions/settings', '/admin/admissions/settings PATCH'],
    actions: ['Open/close student admissions', 'Open/close lecturer applications', 'Set application notices', 'Publish deadline message'],
    related: [{ label: 'Applications', href: '/admin/admissions' }, { label: 'Lecturer Applications', href: '/admin/lecturer-applications' }],
  },
  'departments': {
    title: 'Departments',
    section: 'Formal Programmes',
    description: 'Create departments under schools and connect them to programme courses.',
    backend: ['/admin/academic-structure', '/admin/departments POST'],
    actions: ['Create department', 'Assign to school', 'Review programme coverage', 'Prepare department heads'],
    related: [{ label: 'Academic Structure', href: '/admin/academic-structure' }, { label: 'Schools / Faculties', href: '/admin/schools' }],
  },
  'academic-years': {
    title: 'Academic Years',
    section: 'Formal Programmes',
    description: 'Create academic years used by semesters, intakes and curriculum planning.',
    backend: ['/admin/academic-structure', '/admin/academic-years POST'],
    actions: ['Create academic year', 'Set start/end dates', 'Mark status draft/active', 'Connect semesters'],
    related: [{ label: 'Academic Structure', href: '/admin/academic-structure' }],
  },
  'semesters': {
    title: 'Semesters',
    section: 'Formal Programmes',
    description: 'Create semesters under academic years and connect course offerings.',
    backend: ['/admin/academic-structure', '/admin/semesters POST'],
    actions: ['Create semester', 'Assign academic year', 'Set number and status', 'Connect courses/intakes'],
    related: [{ label: 'Academic Structure', href: '/admin/academic-structure' }],
  },
  'programme-courses': {
    title: 'Programme Courses',
    section: 'Formal Programmes',
    description: 'Attach courses/modules to programmes, departments, years and semesters.',
    backend: ['/admin/academic-structure', '/admin/programme-courses POST'],
    actions: ['Create programme course', 'Attach department', 'Set credits', 'Select delivery mode'],
    related: [{ label: 'Academic Structure', href: '/admin/academic-structure' }],
  },
  'curriculum-blueprint': {
    title: 'Curriculum Blueprint',
    section: 'Formal Programmes',
    description: 'Visual planning board for programme structure, modules, semesters and prerequisites.',
    backend: ['/admin/curriculum/versions', '/admin/curriculum/versions/{version}/modules'],
    actions: ['Review curriculum versions', 'Map modules to semesters', 'Check gaps', 'Plan prerequisites'],
    related: [{ label: 'Curriculum', href: '/admin/curriculum' }],
  },
  'grading-policies': {
    title: 'Grading Policies',
    section: 'Formal Programmes',
    description: 'Create CA/exam grading rules and pass/progression criteria.',
    backend: ['/admin/grading-policies POST'],
    actions: ['Create grading policy', 'Set CA weight', 'Set exam weight', 'Attach to programme/course'],
    related: [{ label: 'Academic Policies', href: '/admin/policies' }],
  },
  'mode-delivery': {
    title: 'Learning Mode Rules',
    section: 'Mode & Delivery',
    description: 'Control online, physical, hybrid and software-only learning rules.',
    backend: ['/admin/learning-mode-rules POST', '/admin/platform-expansion'],
    actions: ['Create mode rule', 'Attach to programme/course', 'Define attendance rules', 'Set venue/live-link rules'],
    related: [{ label: 'Academic Structure', href: '/admin/academic-structure' }],
  },
  'venues': {
    title: 'Labs / Venues',
    section: 'Mode & Delivery',
    description: 'Create labs, lecture rooms and physical learning venues.',
    backend: ['/admin/venues POST', '/admin/academic-structure'],
    actions: ['Create venue', 'Set capacity', 'Set location', 'Attach to practical sessions'],
    related: [{ label: 'Academic Structure', href: '/admin/academic-structure' }],
  },
  'partner-institutions': {
    title: 'Partner Institutions',
    section: 'Mode & Delivery',
    description: 'Manage partner centres and institutions used by hybrid/physical delivery.',
    backend: ['/admin/partner-institutions POST', '/admin/academic-structure'],
    actions: ['Create partner', 'Set contact person', 'Set location', 'Attach practical work'],
    related: [{ label: 'Academic Structure', href: '/admin/academic-structure' }],
  },
  'practical-sessions': {
    title: 'Practical Sessions',
    section: 'Mode & Delivery',
    description: 'Schedule labs, practical blocks and supervised sessions.',
    backend: ['/admin/practical-sessions POST', '/admin/academic-structure'],
    actions: ['Create practical session', 'Set venue', 'Set capacity', 'Assign supervisor'],
    related: [{ label: 'Academic Structure', href: '/admin/academic-structure' }],
  },
  'announcements': {
    title: 'Announcements',
    section: 'Communication',
    description: 'Send administrative announcements to students, lecturers and platform users.',
    backend: ['/admin/announcements POST'],
    actions: ['Create announcement', 'Choose audience', 'Schedule/publish', 'Track delivery'],
  },
  'message-templates': {
    title: 'Message Templates',
    section: 'Communication',
    description: 'Manage reusable email/SMS/in-app templates.',
    backend: ['/admin/message-templates POST'],
    actions: ['Create template', 'Preview message', 'Assign trigger', 'Track versions'],
  },
  'email-test': {
    title: 'Email Test',
    section: 'Communication',
    description: 'Send SMTP test emails and verify provider configuration.',
    backend: ['/admin/system/email/test POST'],
    actions: ['Send test email', 'Check SMTP response', 'Verify sender name', 'Troubleshoot failures'],
    related: [{ label: 'System Health', href: '/admin/system-health' }],
  },
  'roles-permissions': {
    title: 'Roles & Permissions',
    section: 'System',
    description: 'Review role capabilities and permission matrix for every user type.',
    backend: ['/admin/access-matrix', '/auth/capabilities'],
    actions: ['Review role matrix', 'Audit user access', 'Assign roles from Users page', 'Check entitlement gaps'],
    related: [{ label: 'All Users', href: '/admin/users' }],
  },
};

function titleFromPath(path: string) {
  return path
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/-/g, ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
}

export default async function AdminWorkspaceFallbackPage({ params }: { params: Promise<{ workspace?: string[] }> }) {
  const resolvedParams = await params;
  const slug = (resolvedParams.workspace ?? []).join('/');
  const config = workspaces[slug] ?? {
    title: titleFromPath(slug) || 'Admin Workspace',
    section: 'Admin',
    description: 'This admin workspace route is available from the sidebar and is ready for a dedicated workflow implementation.',
    actions: ['Define workflow', 'Connect backend endpoint', 'Add forms and tables', 'Add reports and exports'],
    backend: [],
    related: [{ label: 'Admin Dashboard', href: '/admin/dashboard' }],
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{config.section}</p>
        <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{config.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Construction className="h-5 w-5 text-primary" /> Workflow</CardTitle>
            <CardDescription>What this admin area should help you do.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {config.actions.map((action) => (
              <div key={action} className="flex items-center gap-2 rounded-lg border p-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                <span>{action}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Backend</CardTitle>
            <CardDescription>Connected or planned API endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {config.backend?.length ? config.backend.map((endpoint) => (
              <code key={endpoint} className="block rounded-lg border bg-muted px-2 py-1 text-xs">{endpoint}</code>
            )) : <p className="text-muted-foreground">Dedicated backend connection still needs to be created for this route.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Related tools</CardTitle>
            <CardDescription>Open connected admin pages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(config.related ?? [{ label: 'Admin Dashboard', href: '/admin/dashboard' }]).map((item) => (
              <Button key={item.href} variant="outline" className="w-full justify-between" asChild>
                <Link href={item.href}>{item.label}<ArrowRight className="h-4 w-4" /></Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
