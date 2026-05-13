'use client';

import Link from 'next/link';
import { LockKeyhole, Sparkles } from 'lucide-react';
import { useSession } from '@/components/providers/session-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAiAccessPolicy, type AiFeatureKey } from '@/lib/ai-access';

const tools: Array<{
  title: string;
  description: string;
  href: string;
  feature: AiFeatureKey;
  premiumCapability?: boolean;
}> = [
  { title: 'AI Chat', description: 'Chat experience for study help and support based on your tier.', href: '/student/ai/chat', feature: 'chat' },
  { title: 'AI Tutor', description: 'Ask questions and get guided explanations.', href: '/student/ai/tutor', feature: 'tutor' },
  { title: 'Lesson Companion', description: 'AI summaries and practice by lesson.', href: '/student/ai/lesson-companion', feature: 'lessonCompanion' },
  { title: 'Study Plan', description: 'Personalized weekly learning plan.', href: '/student/study-plan', feature: 'studyPlan', premiumCapability: true },
  { title: 'Flashcards', description: 'Premium adaptive flashcards for rapid recall.', href: '/student/ai/exam-prep', feature: 'flashcards', premiumCapability: true },
  { title: 'Mock Exam', description: 'Premium exam simulation with answer keys.', href: '/student/ai/exam-prep', feature: 'mockExam', premiumCapability: true },
  { title: 'Weak-Area Coach', description: 'Premium support that targets weak topics and next actions.', href: '/student/ai/exam-prep', feature: 'weakAreas', premiumCapability: true },
  { title: 'Career Prep', description: 'Resume and interview coaching.', href: '/student/ai/career', feature: 'career' },
  { title: 'AI Notes', description: 'Auto-generated study notes.', href: '/student/ai/notes', feature: 'notes' },
];

export default function AiHubPage() {
  const { session } = useSession();
  const policy = getAiAccessPolicy(session?.user?.role);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">AI Learning Hub</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {policy.label}
          </Badge>
        </div>
        <p className="text-muted-foreground">{policy.description}</p>
        <div className="grid gap-3 rounded-lg border bg-muted/30 p-4 text-sm md:grid-cols-3">
          <div>
            <p className="font-semibold">Daily prompts</p>
            <p className="text-muted-foreground">{policy.dailyPromptLimit} included</p>
          </div>
          <div>
            <p className="font-semibold">Cashback</p>
            <p className="text-muted-foreground">{policy.features.cashback ? 'Eligible' : 'Not available'}</p>
          </div>
          <div>
            <p className="font-semibold">Grounding</p>
            <p className="text-muted-foreground">
              {policy.features.groundedAnswers ? 'Approved module materials only' : 'Tier guidance applied'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => {
          const enabled = policy.features[tool.feature];
          const card = (
            <Card className={`h-full transition-all ${enabled ? 'hover:border-primary/60 hover:shadow-lg' : 'opacity-70'}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{tool.title}</CardTitle>
                  {enabled ? (
                    tool.premiumCapability ? <Badge>Included</Badge> : null
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <LockKeyhole className="h-3 w-3" />
                      Upgrade
                    </Badge>
                  )}
                </div>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {enabled ? 'Open tool' : `Requires a tier with ${tool.title} access.`}
                </p>
              </CardContent>
            </Card>
          );

          return enabled ? (
            <Link key={tool.title} href={tool.href} className="block">
              {card}
            </Link>
          ) : (
            <div key={tool.title}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
