'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type ElementType } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Check,
  CreditCard,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';

import { WordmarkLogo } from '@/components/icons/logo';
import { SiteFooter } from '@/components/marketing/site-footer';
import { SiteHeader } from '@/components/marketing/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageError, PageLoading } from '@/components/ui/page-feedback';
import { getCourses, getPrograms, getSchools } from '@/lib/api';
import type { Course, Program, School } from '@/lib/api/types';

const features = [
  {
    icon: Lightbulb,
    title: 'Lecturer-Supervised AI Support',
    description: 'AI-powered learning assistance works alongside approved module materials and human-reviewed academic content.',
  },
  {
    icon: BookOpen,
    title: 'Class View & Lesson View',
    description: 'Protected course spaces combine official lessons, progress, quizzes, notes and AI tutor support.',
  },
  {
    icon: FlaskConical,
    title: 'Online, Hybrid & Physical Delivery',
    description: 'The academic standard stays the same while practicals, labs and venues adapt to each delivery mode.',
  },
  {
    icon: GraduationCap,
    title: 'Formal Programmes',
    description: 'Programme requirements, academic years, semesters, assessments and certificates are managed by UnivAI.',
  },
  {
    icon: Briefcase,
    title: 'Instructor Marketplace',
    description: 'Approved external instructors can sell short courses and use paid AI Course Builder packages.',
  },
  {
    icon: Shield,
    title: 'Protected Official Content',
    description: 'Students can view official content while download controls, watermarks and AI access rules protect materials.',
  },
];

type HomeData = {
  schools: School[];
  programs: Program[];
  courses: Course[];
};

export default function HomePage() {
  const [data, setData] = useState<HomeData>({ schools: [], programs: [], courses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getSchools(), getPrograms(), getCourses()])
      .then(([schools, programs, courses]) => {
        if (mounted) setData({ schools, programs, courses });
      })
      .catch((cause) => {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load the UnivAI catalogue.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const featuredPrograms = useMemo(() => data.programs.slice(0, 6), [data.programs]);
  const featuredCourses = useMemo(() => data.courses.slice(0, 6), [data.courses]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="page-shell flex-1 space-y-12 py-8 sm:space-y-16 sm:py-10 md:space-y-20">
        <section className="brand-hero overflow-hidden rounded-2xl border border-cyan-300/20 p-4 text-white shadow-[0_30px_80px_-50px_hsl(var(--brand-cyan)/0.75)] sm:p-6 lg:p-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-5 text-left">
            <WordmarkLogo className="h-16 w-56 brand-logo-glow sm:h-20 sm:w-72" />
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
              <Sparkles className="size-4" />
              AI-first university and short-course platform
            </span>
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl">
              <span className="text-cyan-200">Unlocking intelligence</span> for formal programmes, short courses and AI study support.
            </h1>
            <p className="max-w-2xl text-base text-cyan-50/80 sm:text-lg">
              Learn through protected Class View, approved module materials, Cram Mode, AI Study Vault,
              lecturer-supervised academic content and instructor-led marketplace courses.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link href="#programmes">
                  Explore Programmes <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/25 bg-white/5 text-white hover:bg-white/10" asChild>
                <Link href="#short-courses">Browse Short Courses</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMetric icon={GraduationCap} label="Formal programmes" value={data.programs.length} />
            <HeroMetric icon={BookOpen} label="Short courses" value={data.courses.length} />
            <HeroMetric icon={Users} label="Schools / faculties" value={data.schools.length} />
            <HeroMetric icon={Sparkles} label="AI workflows" value={6} />
          </div>
          </div>
        </section>

        {loading ? <PageLoading message="Loading programmes and short courses..." /> : null}
        {error ? <PageError message={error} /> : null}

        <section id="features" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">A Complete AI-Powered Learning Platform</h2>
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground sm:text-lg">
              Built for formal university study, practical delivery, short courses, certificates and instructor-led learning.
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

        <section id="programmes" className="space-y-8">
          <SectionHeading
            title="Formal University Programmes"
            description="Admission requirements are programme-specific and managed by admin, so applicants see what each programme actually needs before applying."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {!loading && featuredPrograms.length ? featuredPrograms.map((program) => (
              <Card key={program.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{program.title}</CardTitle>
                  <CardDescription>{program.schoolName || program.departmentName || 'UnivAI academic programme'}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{program.description}</p>
                  <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                    <p className="font-semibold">Admission requirements</p>
                    <p className="mt-1 text-muted-foreground">
                      {program.admissionRequirements || 'Requirements pending admin update.'}
                    </p>
                  </div>
                  <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="flex-1">
                      <Link href={`/programmes/${program.id}`}>View Details</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href={`/register?programId=${encodeURIComponent(program.id)}`}>Apply</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : !loading ? <EmptyState message="Programmes will appear here after admin publishes them." /> : null}
          </div>
        </section>

        <section id="short-courses" className="space-y-8">
          <SectionHeading
            title="Short Courses"
            description="Browse short courses, pay entry fees through the existing checkout flow, complete lessons and become certificate-eligible."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {!loading && featuredCourses.length ? featuredCourses.map((course) => (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription>{course.level || 'Short course'} - {course.durationHours || 0} hours</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{course.description}</p>
                  <div className="grid gap-2 text-sm">
                    <PriceRow label="Entry fee" value={course.pricingType === 'free' ? 'Free' : `${course.currency || 'ZMW'} ${course.price ?? 0}`} />
                    <PriceRow label="Certificate fee" value={`${course.certificateCurrency || 'ZMW'} ${course.certificateFee ?? 0}`} />
                  </div>
                  <Button asChild className="mt-auto">
                    <Link href={`/courses/${course.id}`}>
                      View Course <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )) : !loading ? <EmptyState message="Short courses will appear here after admin publishes them." /> : null}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>AI Study Vault and Cram Mode</CardTitle>
              <CardDescription>
                Students can combine approved official materials with their own notes for summaries, flashcards,
                likely questions, practice quizzes and focused revision plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {['Official materials stay protected', 'Student uploads are private', 'AI cannot reproduce protected notes', 'Practice outputs support learning'].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border p-3 text-sm text-muted-foreground">
                  <Check className="size-4 text-primary" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Teach on UnivAI</CardTitle>
              <CardDescription>
                Approved instructors can build short courses manually or buy AI packages for source-grounded course generation.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <div className="grid w-full gap-2">
                <Button asChild>
                  <Link href="/apply/instructor">Apply as Instructor</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/register/employer">Register as Employer</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>

        <section id="pricing" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Choose Your Learning Path</h2>
            <p className="mx-auto mt-3 max-w-3xl text-muted-foreground sm:text-lg">
              Visitors can register, applicants can apply for specific programmes, and short-course learners can pay per course.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <PlanCard
              title="Visitor"
              description="Browse programmes, check requirements and explore short courses."
              price="Free"
              href="/register"
              cta="Register"
              items={['Public catalogue', 'Programme requirements', 'Short-course discovery']}
            />
            <PlanCard
              title="Programme Applicant"
              description="Apply to a formal programme using programme-specific requirements."
              price="Application flow"
              href="/register"
              cta="Start application"
              items={['Admissions', 'Documents', 'Offers and intakes']}
              highlighted
            />
            <PlanCard
              title="Short Course Learner"
              description="Pay entry fee, learn immediately and become certificate eligible."
              price="Per course"
              href="#short-courses"
              cta="Browse courses"
              items={['Entry fee', 'Certificate fee', 'AI-powered study support']}
            />
            <PlanCard
              title="Employer / Instructor"
              description="Register an employer account or apply as an external instructor."
              price="Reviewed access"
              href="/register/employer"
              cta="Register employer"
              items={['Jobs and research', 'Instructor marketplace', 'Admin review']}
            />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function HeroMetric({ icon: Icon, label, value }: { icon: ElementType; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="bg-white/5 p-5 text-white sm:p-6">
        <Icon className="size-5 text-cyan-200" />
        <p className="mt-4 text-3xl font-extrabold text-cyan-100">{value}</p>
        <p className="text-sm text-cyan-50/75">{label}</p>
      </CardContent>
    </Card>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-3xl text-muted-foreground sm:text-lg">{description}</p>
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <CreditCard className="size-4" />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function PlanCard({
  title,
  description,
  price,
  href,
  cta,
  items,
  highlighted,
}: {
  title: string;
  description: string;
  price: string;
  href: string;
  cta: string;
  items: string[];
  highlighted?: boolean;
}) {
  return (
    <Card className={highlighted ? 'border-primary/80' : undefined}>
      <CardHeader>
        {highlighted ? (
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            <Star className="h-4 w-4" /> Recommended
          </div>
        ) : null}
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-3xl font-bold">{price}</p>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <Check className="h-5 w-5 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={highlighted ? 'default' : 'outline'} size="lg" asChild>
          <Link href={href}>{cta}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  );
}
