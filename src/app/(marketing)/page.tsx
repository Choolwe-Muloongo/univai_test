import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Star,
  Users,
  X,
} from 'lucide-react';

import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Lightbulb,
    title: 'AI-Powered Tutoring',
    description: 'Get instant, 24/7 help with course material and personalized explanations.',
  },
  {
    icon: BookOpen,
    title: 'Personalized Study Plans',
    description: 'AI-generated study plans adapt around your schedule and progress.',
  },
  {
    icon: FlaskConical,
    title: 'Virtual Labs & Code Feedback',
    description: 'Practice in realistic labs with instant feedback and guided fixes.',
  },
  {
    icon: GraduationCap,
    title: 'Verified Certificates',
    description: 'Graduate with verifiable credentials trusted by global employers.',
  },
  {
    icon: Briefcase,
    title: 'Career & Job Hub',
    description: 'Access internships and jobs tailored to your skills and outcomes.',
  },
  {
    icon: Users,
    title: 'Global Community',
    description: 'Collaborate, ask questions, and grow with peers worldwide.',
  },
];

const freemiumFeatures = [
  { text: 'Access to introductory modules', included: true },
  { text: 'Read-only access to community', included: true },
  { text: 'AI Tutor and Study Planner', included: false },
  { text: 'Verified Certificate', included: false },
  { text: 'Full access to Career Hub', included: false },
];

const premiumFeatures = [
  { text: 'Unlimited access to all course content', included: true },
  { text: 'Full access to AI Tutor and Study Planner', included: true },
  { text: 'Verified Certificate upon completion', included: true },
  { text: 'Full community access (posting, messaging)', included: true },
  { text: 'Full access to Career & Job Hub', included: true },
  { text: 'Eligible for AFTACOIN rewards', included: true },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="page-shell flex-1 space-y-12 py-8 sm:space-y-16 sm:py-10 md:space-y-20">
        <section className="section-shell grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-5 text-left">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Premium AI University Platform
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              The Future of Higher Education, <span className="text-primary">Engineered for Excellence.</span>
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              UnivAI blends accredited academics, elite AI assistance, and career pathways into one elegant,
              mobile-first learning experience.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Start for Free <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#features">Explore Platform</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="sm:col-span-2">
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-extrabold text-primary">94%</p>
                <p className="mt-1 text-sm text-muted-foreground">with AI study assistant enabled</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">40+</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <p className="text-sm text-muted-foreground">Mentor Support</p>
                <p className="text-2xl font-bold">24/7</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="features" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">A Smarter Way to Learn</h2>
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground sm:text-lg">
              Fast, clean, and beautifully responsive across mobile, tablet, and desktop.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-6">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose Your Plan</h2>
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground sm:text-lg">
              Start free, then upgrade for premium outcomes and full AI capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Freemium</CardTitle>
                <CardDescription>Great for trying UnivAI with core learning tools.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-4xl font-bold">Free</p>
                <ul className="space-y-3">
                  {freemiumFeatures.map((feature, index) => (
                    <li key={index} className={`flex items-center gap-3 ${!feature.included && 'text-muted-foreground'}`}>
                      {feature.included ? <Check className="h-5 w-5 text-primary" /> : <X className="h-5 w-5" />}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="lg" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-primary/80">
              <CardHeader>
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  <Star className="h-4 w-4" /> Best Value
                </div>
                <CardTitle className="text-2xl">Premium</CardTitle>
                <CardDescription>Complete access for ambitious, career-focused learners.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">$250</span>
                  <span className="text-muted-foreground"> / year</span>
                </div>
                <ul className="space-y-3">
                  {premiumFeatures.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3 text-sm text-primary">
                  <p>
                    <span className="font-semibold">Earn a Reward:</span> 40% of your fee ($100) returns to your
                    wallet as AFTACOIN after successful completion.
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" asChild>
                  <Link href="/register">Upgrade to Premium</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
