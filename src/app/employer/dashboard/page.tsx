import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, Users, PlusCircle, ArrowRight, FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { getEmployerDashboard } from '@/lib/api';

export default async function EmployerDashboardPage() {
  const dashboard = await getEmployerDashboard();
  return (
    <div className="space-y-8">
      <div className='flex justify-between items-center'>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
            <p className="text-muted-foreground">Manage your job postings and applicants.</p>
        </div>
        <div className='flex gap-2'>
            <Button variant="outline" asChild>
                <Link href="/employer/research/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post New Research
                </Link>
            </Button>
            <Button asChild>
                <Link href="/employer/jobs/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Post New Job
                </Link>
            </Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Job Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.activeJobs.value}</div>
            <p className="text-xs text-muted-foreground">{dashboard.stats.activeJobs.note}</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Research</CardTitle>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{dashboard.stats.activeResearch.value}</div>
                <p className="text-xs text-muted-foreground">{dashboard.stats.activeResearch.note}</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.stats.totalApplicants.value}</div>
            <p className="text-xs text-muted-foreground">{dashboard.stats.totalApplicants.note}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
            <CardHeader>
                <CardTitle>Your Job Postings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                {dashboard.postedJobs.map(job => (
                    <Card key={job.id}>
                        <CardHeader>
                            <CardTitle className='text-xl'>{job.title}</CardTitle>
                            <CardDescription>Status: {job.status}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className='font-semibold'>{job.applicants} Applicants</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant='outline' asChild>
                                <Link href={`/employer/jobs/${job.id}/applicants`}>View Applicants <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Your Research Postings</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                {dashboard.research.map(opp => (
                    <Card key={opp.id}>
                        <CardHeader>
                            <CardTitle className='text-xl'>{opp.title}</CardTitle>
                            <CardDescription>Field: {opp.field}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className='text-sm text-muted-foreground line-clamp-2'>{opp.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant='outline' asChild>
                                <Link href={`/employer/research/${opp.id}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

    
