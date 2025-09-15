import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Briefcase, Users, PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const postedJobs = [
    {id: 'j1', title: 'Software Engineer Intern', applicants: 15, status: 'Open'},
    {id: 'j4', title: 'Frontend Developer', applicants: 8, status: 'Open'}
]

export default function EmployerDashboardPage() {
  return (
    <div className="space-y-8">
      <div className='flex justify-between items-center'>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Employer Dashboard</h1>
            <p className="text-muted-foreground">Manage your job postings and applicants.</p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Post New Job
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Your jobs are visible to students.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+5 new applicants today</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Your Job Postings</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
            {postedJobs.map(job => (
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
                            <Link href="#">View Applicants <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
