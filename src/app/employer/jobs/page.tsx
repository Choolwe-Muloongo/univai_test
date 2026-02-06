import Link from 'next/link';
import { Briefcase, MapPin, PlusCircle } from 'lucide-react';
import { getJobs } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function EmployerJobsPage() {
  const jobs = await getJobs();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
          <p className="text-muted-foreground">
            Manage your posted roles, track applicants, and publish new opportunities.
          </p>
        </div>
        <Button asChild>
          <Link href="/employer/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Post New Job
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>
                  {job.type}
                </Badge>
              </div>
              <CardDescription>{job.company}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1.5 h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                Applications in review
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href={`/employer/jobs/${job.id}`}>Manage Listing</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={`/employer/jobs/${job.id}/applicants`}>View Applicants</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
