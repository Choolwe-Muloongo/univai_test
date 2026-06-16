import Link from 'next/link';
import { Bot, BookOpen, ClipboardList, FileJson, Layers, PenTool, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const builderGroups = [
  {
    title: 'Manual course builder',
    description: 'Build structured lessons, cards, quizzes, videos, documents, and practical activities manually.',
    href: '/admin/short-courses/manual',
    icon: PenTool,
  },
  {
    title: 'JSON builder studio',
    description: 'Import or edit full JSON course structures for fast review and publishing.',
    href: '/admin/short-courses/json-builder',
    icon: FileJson,
  },
  {
    title: 'Manual JSON builder',
    description: 'Use the guided manual JSON builder when you need exact control over every card and lesson block.',
    href: '/admin/short-courses/json-builder/manual',
    icon: Layers,
  },
  {
    title: 'AI builder',
    description: 'Generate course outlines, lessons, cards, quizzes, and learning material drafts using AI.',
    href: '/admin/short-courses/builder',
    icon: Bot,
  },
  {
    title: 'Instructor course builder',
    description: 'Lecturer-facing builder area for creating and improving course content.',
    href: '/instructor/course-builder',
    icon: Wand2,
  },
  {
    title: 'Create instructor course',
    description: 'Start a new instructor-managed course or content draft.',
    href: '/instructor/courses/create',
    icon: BookOpen,
  },
];

export default function LecturerBuildersPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Formal teaching workbench</p>
        <h1 className="text-3xl font-bold tracking-tight">Lecturer Builders</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          All course-building tools are available from one place. Lecturers can build, convert, review, and improve formal learning content without hunting through admin pages.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {builderGroups.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="flex h-full flex-col">
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full">
                  <Link href={item.href}>Open builder</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Recommended lecturer workflow</CardTitle>
          <CardDescription>Use this order when preparing formal programme content.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4 text-sm">
          <div className="rounded-lg border p-3"><p className="font-semibold">1. Plan</p><p className="text-muted-foreground">Prepare module outcomes and semester structure.</p></div>
          <div className="rounded-lg border p-3"><p className="font-semibold">2. Build</p><p className="text-muted-foreground">Create lessons, cards, documents, videos, quizzes, and assignments.</p></div>
          <div className="rounded-lg border p-3"><p className="font-semibold">3. Review</p><p className="text-muted-foreground">Check quality, delivery mode, and release timing.</p></div>
          <div className="rounded-lg border p-3"><p className="font-semibold">4. Publish</p><p className="text-muted-foreground">Release content according to the academic calendar.</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
