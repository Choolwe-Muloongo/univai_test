import { ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';

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
import { getJobs } from '@/lib/api';

export default async function JobsPage() {
  const jobs = await getJobs();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job & Career Hub</h1>
        <p className="text-muted-foreground">
          Find your next opportunity. Internships and jobs from our network of employers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between">
                <CardTitle>{job.title}</CardTitle>
                <Badge variant={job.type === 'Internship' ? 'secondary' : 'default'}>
                  {job.type}
                </Badge>
              </div>
              <CardDescription>{job.company}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1.5 h-4 w-4" />
                {job.location}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/admin/jobs/${job.id}`}>
                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
