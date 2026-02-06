import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getJobById } from '@/lib/api';

const applicants = [
  { name: 'Maria Silva', score: 92, status: 'Interview', skill: 'Frontend' },
  { name: 'Kevin Park', score: 86, status: 'Screening', skill: 'Backend' },
  { name: 'Joy Chen', score: 78, status: 'New', skill: 'Product' },
];

export default async function EmployerJobApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applicants</h1>
          <p className="text-muted-foreground">{job.title}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/employer/jobs/${job.id}`}>Back to Listing</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
          <CardDescription>Review and move applicants through each stage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applicants.map((applicant) => (
            <div key={applicant.name} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`https://i.pravatar.cc/80?u=${applicant.name}`} alt={applicant.name} />
                  <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{applicant.name}</p>
                  <p className="text-sm text-muted-foreground">{applicant.skill} Track</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Score: {applicant.score}</Badge>
                <Badge variant={applicant.status === 'Interview' ? 'default' : 'outline'}>
                  {applicant.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">View Profile</Button>
                <Button size="sm">Schedule Interview</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
