import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Server, ShieldCheck, Activity, Database } from 'lucide-react';

const services = [
  { name: 'Authentication', status: 'Operational', uptime: 99.98 },
  { name: 'Primary Database (MySQL)', status: 'Operational', uptime: 99.94 },
  { name: 'Storage', status: 'Degraded', uptime: 98.2 },
  { name: 'AI Services', status: 'Operational', uptime: 99.7 },
];

const resources = [
  { label: 'API Throughput', value: 78 },
  { label: 'Database Load', value: 62 },
  { label: 'Queue Latency', value: 45 },
];

export default function SystemHealthPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Live status across UnivAI infrastructure.</p>
        </div>
        <Button variant="outline">Run Diagnostics</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime (30d)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.92%</div>
            <p className="text-xs text-muted-foreground">Across core services</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Storage latency issue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.4M</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Throughput</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">540 ops/s</div>
            <p className="text-xs text-muted-foreground">Peak usage</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Latest status checks from core providers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-muted-foreground">Uptime: {service.uptime}%</p>
                </div>
                <Badge variant={service.status === 'Operational' ? 'default' : 'destructive'}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
            <CardDescription>Current usage against thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resources.map((resource) => (
              <div key={resource.label} className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{resource.label}</span>
                  <span>{resource.value}%</span>
                </div>
                <Progress value={resource.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
