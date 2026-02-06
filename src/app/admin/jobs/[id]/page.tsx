import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJobById } from '@/lib/api';
import { MapPin, Briefcase } from 'lucide-react';

const jobDetails: Record<string, { overview: string; responsibilities: string[]; requirements: string[] }> = {
  j1: {
    overview: 'Work alongside our engineering team to build scalable student-facing experiences.',
    responsibilities: ['Support feature delivery in React/Next.js', 'Collaborate with designers and mentors', 'Ship weekly improvements'],
    requirements: ['Currently enrolled in a CS-related program', 'Basic JavaScript and API knowledge', 'Strong collaboration skills'],
  },
  j2: {
    overview: 'Join a clinical team and contribute to patient care with a focus on empathy and safety.',
    responsibilities: ['Support patient assessments', 'Assist with care plans', 'Maintain clinical documentation'],
    requirements: ['Valid nursing credentials', '1+ year clinical experience', 'Strong communication skills'],
  },
  j3: {
    overview: 'Partner with business teams to analyze performance and create strategic recommendations.',
    responsibilities: ['Build reporting dashboards', 'Analyze KPIs and trends', 'Present insights to stakeholders'],
    requirements: ['Experience with spreadsheets or BI tools', 'Analytical mindset', 'Clear presentation skills'],
  },
  j4: {
    overview: 'Build engaging user interfaces and refine the frontend architecture.',
    responsibilities: ['Develop UI components', 'Improve performance and accessibility', 'Collaborate with product managers'],
    requirements: ['React or Flutter experience', 'Strong UI sensibility', 'Portfolio of recent work'],
  },
};

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    notFound();
  }

  const detail = jobDetails[job.id];

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" asChild>
          <Link href="/admin/jobs">Back to Jobs</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl">{job.title}</CardTitle>
              <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>
                {job.type}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm">
                <Briefcase className="h-4 w-4" /> {job.company}
              </span>
              <span className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4" /> {job.location}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Role Overview</h3>
              <p>{detail?.overview}</p>
            </section>
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Key Responsibilities</h3>
              <ul className="list-disc space-y-1 pl-5">
                {detail?.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Requirements</h3>
              <ul className="list-disc space-y-1 pl-5">
                {detail?.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Ready to Apply?</CardTitle>
            <CardDescription>Submit your profile and portfolio for review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link href={`/admin/jobs/${job.id}/apply`}>Apply Now</Link>
            </Button>
            <Button variant="outline" className="w-full">Save for Later</Button>
            <p className="text-xs text-muted-foreground">
              Hiring teams respond within 5-7 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
