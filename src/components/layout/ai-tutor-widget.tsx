// src/components/layout/ai-tutor-widget.tsx
'use client';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { BotIcon } from '@/components/icons/bot';
import { BookOpen, Lightbulb, Code, X } from 'lucide-react';
import Link from 'next/link';

const aiTools = [
  {
    title: 'AI Tutor',
    description: 'Get instant answers to your questions.',
    href: '/tutor',
    icon: Lightbulb,
  },
  {
    title: 'Personalized Study Plan',
    description: 'Let AI build a plan just for you.',
    href: '/study-plan',
    icon: BookOpen,
  },
  {
    title: 'Code Feedback',
    description: 'Instant feedback on coding tasks.',
    href: '#',
    icon: Code,
  },
];

export function AiTutorWidget() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
          size="icon"
        >
          <BotIcon className="h-8 w-8" />
          <span className="sr-only">Open AI Tools</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4 mb-2" side="top" align="end">
        <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium leading-none">AI Learning Assistant</h4>
             <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className='h-6 w-6'>
                    <X className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
        </div>
        <Separator />
        <div className="grid gap-4 mt-4">
            <ul className="space-y-2">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
