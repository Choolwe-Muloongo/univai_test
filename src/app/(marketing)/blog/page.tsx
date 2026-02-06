import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const posts = [
  {
    slug: 'building-a-hybrid-university',
    title: 'Building a Hybrid University for Global Access',
    date: 'Jan 12, 2026',
    category: 'Strategy',
    excerpt:
      'How UnivAI combines physical touchpoints, online delivery, and academic governance to scale quality education.',
  },
  {
    slug: 'ai-learning-with-human-oversight',
    title: 'AI Learning With Human Oversight',
    date: 'Jan 25, 2026',
    category: 'Academic',
    excerpt:
      'Why human academic councils remain central while AI handles tutoring, practice, and personalized guidance.',
  },
  {
    slug: 'student-outcomes-first',
    title: 'Student Outcomes First: Employability by Design',
    date: 'Jan 30, 2026',
    category: 'Careers',
    excerpt:
      'A practical look at portfolios, career support, and how UnivAI aligns learning with market needs.',
  },
];

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary">UnivAI Blog</Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Insights & Updates</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The thinking behind UnivAI&apos;s academic model, product updates, and student success stories.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.slug} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline">{post.category}</Badge>
                    <span>{post.date}</span>
                  </div>
                  <CardTitle className="mt-3 text-xl">{post.title}</CardTitle>
                  <CardDescription className="mt-2">{post.excerpt}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button variant="outline" asChild>
                    <Link href={`/blog/${post.slug}`}>Read Article</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-12 bg-muted/50">
            <CardHeader>
              <CardTitle>Stay in the loop</CardTitle>
              <CardDescription>Join the UnivAI newsletter for monthly updates.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Input placeholder="Email address" />
              <Button>Subscribe</Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
