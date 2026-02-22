'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Server, ShieldCheck, Activity, Database } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSystemHealth, runSystemDiagnostics } from '@/lib/api';

export default function SystemHealthPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const loadHealth = async () => {
    setLoading(true);
    const health = await getSystemHealth();
    setData(health);
    setLoading(false);
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Live status across UnivAI infrastructure.</p>
        </div>
        <Button
          variant="outline"
          disabled={running}
          onClick={async () => {
            setRunning(true);
            await runSystemDiagnostics();
            await loadHealth();
            setRunning(false);
          }}
        >
          Run Diagnostics
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime (30d)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.uptime ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Telemetry snapshot</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.incidents ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Monitoring feed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.apiRequests ?? '--'}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DB Throughput</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.dbThroughput ?? '--'}</div>
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
            {loading ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Loading diagnostics...
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.services ?? []).map((service: any) => (
                  <div key={service.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{service.name}</span>
                    <span className="text-xs text-muted-foreground">{service.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
            <CardDescription>Current usage against thresholds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>API Throughput</span>
                <span>{data?.utilization?.apiThroughput ?? 0}%</span>
              </div>
              <Progress value={data?.utilization?.apiThroughput ?? 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Database Load</span>
                <span>{data?.utilization?.dbLoad ?? 0}%</span>
              </div>
              <Progress value={data?.utilization?.dbLoad ?? 0} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Queue Latency</span>
                <span>{data?.utilization?.queueLatency ?? 0}%</span>
              </div>
              <Progress value={data?.utilization?.queueLatency ?? 0} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

