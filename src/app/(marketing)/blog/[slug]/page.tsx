import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const posts: Record<string, { title: string; date: string; category: string; sections: { heading: string; body: string }[] }> = {
  'building-a-hybrid-university': {
    title: 'Building a Hybrid University for Global Access',
    date: 'Jan 12, 2026',
    category: 'Strategy',
    sections: [
      {
        heading: 'Why Hybrid Matters',
        body:
          'Hybrid delivery removes geographic barriers while preserving the credibility of in-person touchpoints. Students gain flexibility without losing institutional accountability.',
      },
      {
        heading: 'Physical Touchpoints',
        body:
          'Orientation, examinations, and capstone events remain structured and supervised. These moments validate learning outcomes and build community.',
      },
      {
        heading: 'Online Scale',
        body:
          'Online learning provides access, pace control, and personalized support. The goal is not to replace campus life, but to extend it to new learners.',
      },
    ],
  },
  'ai-learning-with-human-oversight': {
    title: 'AI Learning With Human Oversight',
    date: 'Jan 25, 2026',
    category: 'Academic',
    sections: [
      {
        heading: 'AI as a Learning Assistant',
        body:
          'AI supports tutoring, practice generation, and adaptive pacing. It helps students stay on track and get faster feedback.',
      },
      {
        heading: 'Humans Make the Decisions',
        body:
          'Academic councils and examiners maintain final authority over grading, progression, and graduation. AI never decides outcomes on its own.',
      },
      {
        heading: 'Trust by Design',
        body:
          'This model keeps the learning experience modern without compromising institutional governance or quality standards.',
      },
    ],
  },
  'student-outcomes-first': {
    title: 'Student Outcomes First: Employability by Design',
    date: 'Jan 30, 2026',
    category: 'Careers',
    sections: [
      {
        heading: 'Portfolio-Driven Learning',
        body:
          'Students graduate with real projects, documented skills, and a portfolio that employers can evaluate.',
      },
      {
        heading: 'Career Services Embedded',
        body:
          'Mentorship, job matching, and interview preparation are integrated into the student journey.',
      },
      {
        heading: 'Measured by Results',
        body:
          'We evaluate success by career placement, progression, and long-term student outcomes - not just course completion.',
      },
    ],
  },
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl space-y-4">
            <Badge variant="secondary">{post.category}</Badge>
            <h1 className="text-4xl font-extrabold tracking-tight">{post.title}</h1>
            <p className="text-sm text-muted-foreground">Published {post.date}</p>
            <Separator />
            <div className="space-y-6 text-muted-foreground">
              {post.sections.map((section) => (
                <div key={section.heading} className="space-y-2">
                  <h2 className="text-2xl font-semibold text-foreground">{section.heading}</h2>
                  <p className="leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/blog">Back to Blog</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Apply to UnivAI</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
