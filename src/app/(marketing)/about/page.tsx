import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, GraduationCap, Lightbulb, Users } from 'lucide-react';
import Link from 'next/link';

const pillars = [
  {
    icon: GraduationCap,
    title: 'Real Academic Structure',
    description: 'Programs, faculties, credits, assessments, and graduation standards that mirror a traditional university.',
  },
  {
    icon: BookOpen,
    title: 'Hybrid Delivery',
    description: 'Physical campus touchpoints combined with flexible online learning for global accessibility.',
  },
  {
    icon: Lightbulb,
    title: 'AI-Enhanced Learning',
    description: 'Adaptive support, faster feedback, and personalized study plans while humans retain final authority.',
  },
  {
    icon: Users,
    title: 'Student-Centered Outcomes',
    description: 'Career readiness, portfolio evidence, and a clear path to real-world impact.',
  },
];

const leadership = [
  { name: 'Dr. Evelyn Reed', role: 'Academic Director', avatar: 'https://i.pravatar.cc/120?u=evelyn' },
  { name: 'Prof. Alan Turing', role: 'Head of School, ICT', avatar: 'https://i.pravatar.cc/120?u=alan' },
  { name: 'Amina Hassan', role: 'Student Success', avatar: 'https://i.pravatar.cc/120?u=amina' },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <Badge variant="secondary">About UnivAI</Badge>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                A university model built for modern learners.
              </h1>
              <p className="text-lg text-muted-foreground">
                UnivAI blends real academic structure with AI-assisted learning and flexible delivery. We combine
                the credibility of a traditional institution with the reach of a global digital campus.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/register">Apply Now</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/#features">Explore Features</Link>
                </Button>
              </div>
            </div>
            <Card className="border-primary/20 bg-muted/40">
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
                <CardDescription>
                  Deliver credible, accessible education that reduces barriers and increases outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  We believe education should be structured, verifiable, and adaptive to the learner. UnivAI is
                  built to scale real degrees and credentials while keeping human oversight at the center.
                </p>
                <p>
                  By integrating AI into learning workflows, students receive tailored support and faster feedback
                  without compromising academic rigor.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-muted/40 py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">The Four Pillars</h2>
              <p className="mt-4 text-muted-foreground">
                Every part of the UnivAI system is designed around these core principles.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar) => (
                <Card key={pillar.title} className="h-full">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <pillar.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="mt-4 text-xl">{pillar.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {pillar.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Governance & Quality</h3>
              <p className="text-muted-foreground">
                UnivAI preserves the academic governance expected of higher education institutions.
                Assessments, graduation requirements, and appeals remain under human oversight.
              </p>
              <div className="grid gap-3">
                {[
                  'Academic councils and human examiners',
                  'Transparent assessment criteria and rubrics',
                  'Formal appeals and disciplinary processes',
                  'Institutional reporting and audit readiness',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border bg-background p-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/10 via-background to-background">
              <CardHeader>
                <CardTitle>Learning Experience</CardTitle>
                <CardDescription>Two learning tracks, one standard of excellence.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-lg border bg-background p-4">
                  <p className="font-medium text-foreground">Traditional Track</p>
                  <p>Fixed pace with AI supporting tutoring, revision, and feedback.</p>
                </div>
                <div className="rounded-lg border bg-background p-4">
                  <p className="font-medium text-foreground">Personalized Track</p>
                  <p>Mastery-based progression with adaptive support and flexible pacing.</p>
                </div>
                <p>Regardless of track, assessments and graduation standards are the same.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-muted/40 py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-semibold">Leadership</h3>
                <p className="text-muted-foreground">Meet the people guiding UnivAI&apos;s academic vision.</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {leadership.map((leader) => (
                <Card key={leader.name}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={leader.avatar} alt={leader.name} />
                      <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{leader.name}</CardTitle>
                      <CardDescription>{leader.role}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Focused on academic quality, student outcomes, and scalable delivery.
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
