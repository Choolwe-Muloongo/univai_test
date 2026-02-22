import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Users, BookOpen, Briefcase, DollarSign, Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAdminDashboard } from '@/lib/api';

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              {metric.key === 'revenue' && <DollarSign className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'students' && <Users className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'courses' && <BookOpen className="h-4 w-4 text-muted-foreground" />}
              {metric.key === 'activity' && <Activity className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Platform Management</CardTitle>
                <CardDescription>Add, edit, or approve platform content and users.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Add/remove schools and programs.</p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" asChild>
                           <Link href="/admin/management">Go to Content <ArrowRight className="ml-2 h-4 w-4" /></Link>
                       </Button>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Approve Lecturers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Review lecturer applications and issue credentials.</p>
                    </CardContent>
                    <CardFooter>
                       <Button variant="outline" asChild>
                            <Link href="/admin/lecturer-applications">View Applications <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reporting & Analytics</CardTitle>
            <CardDescription>AI-driven insights on platform performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground'>Detailed reports on student engagement, course popularity, and revenue trends.</p>
          </CardContent>
           <CardFooter>
                <Button className="w-full" asChild>
                    <Link href="/admin/reports">View Reports</Link>
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
