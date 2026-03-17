import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BellRing, Clock3, ListChecks, ShieldAlert, UserCircle2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSlaCountdown, getAdminOperationsQueue, getOpsItemById } from '@/lib/admin-operations';

export default async function OpsItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await getAdminOperationsQueue();
  const item = getOpsItemById(items, id);

  if (!item) {
    notFound();
  }

  const slaLabel = formatSlaCountdown(item.slaDueAt);

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/admin/operations">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to operations queues
        </Link>
      </Button>

      <div>
        <p className="text-sm text-muted-foreground">{item.lane}</p>
        <h1 className="text-3xl font-bold tracking-tight">{item.title}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Case details</CardTitle>
            <CardDescription>{item.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                Pending queue: {item.pendingQueue}
              </p>
              <p className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                SLA breach risk: {item.slaBreachRisk}%
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                SLA timer: {slaLabel}
              </p>
              <p className="flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                Assigned owner: {item.assignedOwner}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="mb-2 font-medium">Escalation path</p>
              <ol className="ml-4 list-decimal space-y-2 text-muted-foreground">
                {item.escalationPath.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action panel</CardTitle>
            <CardDescription>Recommended decision and escalation actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Priority</span>
              <Badge>{item.severity}</Badge>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Next-best action</p>
              <p className="text-muted-foreground">{item.nextBestAction}</p>
            </div>

            <Button className="w-full">Execute next-best action</Button>
            <Button variant="outline" className="w-full">
              Add internal note
            </Button>
            <Button variant="destructive" className="w-full">
              <BellRing className="mr-2 h-4 w-4" /> Escalate now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
