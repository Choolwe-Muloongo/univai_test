import Link from 'next/link';
import { Bell, BookOpen, CheckCircle2, CreditCard, GraduationCap, LifeBuoy, Link2, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

import { PageHeader } from '@/components/student/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const quickStart = [
  'Open Mission Home to see your next learning action.',
  'Go to My Journeys to continue short courses or formal programme learning.',
  'Use Training Arena for practice before exams and final trials.',
  'Check Notifications for system messages, payment updates, and onboarding guidance.',
];

const features = [
  {
    title: 'My Journeys',
    description: 'Your course path, lessons, side missions, progress, and certificates live here.',
    href: '/student/courses',
    icon: BookOpen,
  },
  {
    title: 'Nova Mentor',
    description: 'Ask for explanations, summaries, study help, and learning support when you get stuck.',
    href: '/student/ai/chat',
    icon: Sparkles,
  },
  {
    title: 'Training Arena',
    description: 'Practice questions, fix weak areas, and prepare before assessments.',
    href: '/student/training-arena',
    icon: Trophy,
  },
  {
    title: 'Affiliate Program',
    description: 'Request affiliate access, share your referral link, track earnings, and withdraw when approved.',
    href: '/student/affiliate',
    icon: Link2,
  },
  {
    title: 'Billing',
    description: 'View invoices, make payments, verify payments, and track access status.',
    href: '/student/payments',
    icon: CreditCard,
  },
  {
    title: 'Support',
    description: 'Open a ticket when something is broken, unclear, missing, or blocking your learning.',
    href: '/student/support',
    icon: LifeBuoy,
  },
];

const faqs = [
  {
    question: 'Where do I start after logging in?',
    answer: 'Start from Mission Home, then continue the highlighted Journey or lesson. UnivAI is built to guide you step by step instead of leaving you to hunt around.',
  },
  {
    question: 'Why can some pages be locked?',
    answer: 'Some tools depend on your account type, payment status, programme access, or admin approval. Locked pages should explain what is needed next.',
  },
  {
    question: 'How do affiliate requests work?',
    answer: 'Open Affiliate Dashboard, submit your payout details and promotion reason, then wait for admin approval. Once approved, your link and earnings dashboard unlock.',
  },
  {
    question: 'Where do I report a bug?',
    answer: 'Use Ideas & Feedback for public feature or bug feedback, and Support when you need private help with your account, payment, or access.',
  },
];

export default function StudentHelpPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Help Center"
        title="How to use UnivAI"
        description="A clean guide for learning, payments, notifications, affiliate access, and support. Start here when the platform feels confusing."
        actions={
          <>
            <Button asChild><Link href="/student/dashboard">Go to Mission Home</Link></Button>
            <Button asChild variant="outline"><Link href="/student/support">Open Support</Link></Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-3xl">
          <CardContent className="flex items-start gap-3 p-5">
            <GraduationCap className="mt-1 h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Learn by mission</p>
              <p className="mt-1 text-sm text-muted-foreground">Lessons are grouped into Journeys so you always know the next move.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="flex items-start gap-3 p-5">
            <Bell className="mt-1 h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Read notifications</p>
              <p className="mt-1 text-sm text-muted-foreground">Important messages, payments, reminders, and onboarding tips stay in one place.</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl">
          <CardContent className="flex items-start gap-3 p-5">
            <ShieldCheck className="mt-1 h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Protect your account</p>
              <p className="mt-1 text-sm text-muted-foreground">Keep your profile updated and use Support when access, payment, or account details look wrong.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
          <CardDescription>Four simple moves after signing in.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {quickStart.map((item, index) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border p-4 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
              <p className="text-muted-foreground">{item}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /> {feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full"><Link href={feature.href}>Open {feature.title}</Link></Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Common questions</CardTitle>
          <CardDescription>Fast answers before opening a ticket.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {faqs.map((item) => (
            <details key={item.question} className="rounded-2xl border p-4">
              <summary className="cursor-pointer font-semibold">{item.question}</summary>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Still stuck?</p>
              <p className="text-sm text-muted-foreground">Open a support ticket with clear details. The more precise the report, the faster it gets fixed.</p>
            </div>
          </div>
          <Button asChild><Link href="/student/support">Contact Support</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
