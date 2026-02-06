import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

const programStats = [
  { name: 'BSc Software Development', enrollment: 520, completion: 72 },
  { name: 'Diploma in Nursing', enrollment: 310, completion: 64 },
  { name: 'MBA', enrollment: 220, completion: 59 },
  { name: 'Mechanical Engineering', enrollment: 180, completion: 51 },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Monitor performance across programs and cohorts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select defaultValue="30d">
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export CSV</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$62,480</div>
            <p className="text-xs text-muted-foreground">+12.4% vs last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,485</div>
            <p className="text-xs text-muted-foreground">+210 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">64%</div>
            <p className="text-xs text-muted-foreground">Target 70%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Student NPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+41</div>
            <p className="text-xs text-muted-foreground">Stable trend</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Shortcuts</CardTitle>
          <CardDescription>Open focused dashboards for each domain.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/reports/academics">Academic Performance</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/reports/enrollment">Enrollment Pipeline</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/reports/finance">Finance Summary</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Program Performance</CardTitle>
          <CardDescription>Enrollment and completion trends by program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {programStats.map((program) => (
            <div key={program.name} className="space-y-2 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{program.name}</p>
                  <p className="text-sm text-muted-foreground">{program.enrollment} active students</p>
                </div>
                <Badge variant="secondary">{program.completion}% completion</Badge>
              </div>
              <Progress value={program.completion} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
