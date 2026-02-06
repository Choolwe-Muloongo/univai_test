import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const applications = [
  { id: 'app-1', role: 'Software Engineer Intern', company: 'TechCorp', status: 'Interview' },
  { id: 'app-2', role: 'Frontend Developer', company: 'Innovate Solutions', status: 'Submitted' },
  { id: 'app-3', role: 'Business Analyst', company: 'FinancePro', status: 'Rejected' },
];

export default function JobApplicationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground">Track job applications and interviews.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>Latest updates from employers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{app.role}</p>
                <p className="text-sm text-muted-foreground">{app.company}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={app.status === 'Rejected' ? 'destructive' : 'secondary'}>
                  {app.status}
                </Badge>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/student/jobs">View</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
