import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const links = [
  ['Programme setup', '/admin/formal-programs'],
  ['Admissions', '/admin/admissions'],
  ['Academic structure', '/admin/academic-structure'],
  ['Curriculum', '/admin/curriculum'],
  ['Intakes', '/admin/intakes'],
  ['Lecturer assignments', '/admin/assignments'],
];

export function ProgrammeDashboardLinks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programme Operations</CardTitle>
        <CardDescription>Setup, admissions, curriculum, calendars, lecturers, and delivery tools.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 md:grid-cols-3">
        {links.map(([label, href]) => (
          <Button key={href} variant="outline" asChild>
            <Link href={href}>{label}</Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
