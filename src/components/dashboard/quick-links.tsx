// src/components/dashboard/quick-links.tsx
'use client';
import { BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const quickLinks = [
  {
    title: 'Study Plan',
    description: 'See what to study next and keep your learning organized.',
    href: '/student/study-plan',
    icon: BookOpen,
  },
  {
    title: 'Nova Mentor',
    description: 'Ask for help with lessons, revision, and quick explanations.',
    href: '/student/ai/chat',
    icon: Sparkles,
  },
  {
    title: 'Suggestions & Reports',
    description: 'Request a feature, report an error, or tell us what feels confusing.',
    href: '/student/suggestions',
    icon: MessageSquare,
  },
];

export function QuickLinks() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {quickLinks.map((tool) => (
              <li key={tool.title}>
                <Link
                  href={tool.href}
                  className="group flex items-start gap-4 rounded-lg p-2 -m-2 hover:bg-muted"
                >
                  <tool.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{tool.title}</p>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
