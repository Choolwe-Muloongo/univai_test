// src/components/dashboard/quick-links.tsx
'use client';
import { BookOpen, Lightbulb } from 'lucide-react';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const aiTools = [
  {
    title: 'Personalized Study Plan',
    description: 'Let AI build a plan just for you.',
    href: '/study-plan',
    icon: BookOpen,
  },
  {
    title: 'AI Tutor',
    description: 'Get instant answers to your questions.',
    href: '/tutor',
    icon: Lightbulb,
  },
];

export function QuickLinks() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {aiTools.map((tool) => (
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
