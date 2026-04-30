'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

import { AdminActionPanel } from '@/components/admin/admin-action-panel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getConsultantApplicationById } from '@/lib/api';
import type { ConsultantApplication } from '@/lib/api/types';

export default function ConsultantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();

  const [application, setApplication] = useState<ConsultantApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplication = async () => {
      const data = await getConsultantApplicationById(id);
      setApplication(data);
      setLoading(false);
    };
    loadApplication();
  }, [id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading consultant application...</p>;
  }

  if (!application) {
    notFound();
  }

  const queueAction = (action: string) => {
    toast({
      title: `Action queued: ${action}`,
      description: 'Decision captured for consultant review follow-up.',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={application.avatar} alt={application.name} />
            <AvatarFallback>{application.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{application.name}</h1>
            <p className="text-muted-foreground">{application.department}</p>
          </div>
        </div>
        <Badge variant={application.status === 'Approved' ? 'default' : application.status === 'Rejected' ? 'destructive' : 'secondary'}>
          {application.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Application Summary</CardTitle>
            <CardDescription>Review documents and verify credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              This applicant has submitted documentation for consultant verification. Review the evidence before making a decision.
            </p>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Curriculum Vitae</p>
                    <p className="text-xs text-muted-foreground">PDF uploaded</p>
                  </div>
                </div>
                <Button variant="outline">Preview</Button>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Identification Document</p>
                    <p className="text-xs text-muted-foreground">PDF uploaded</p>
                  </div>
                </div>
                <Button variant="outline">Preview</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>Return to consultant reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/consultants">Back to Applications</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <AdminActionPanel
        title="Consultant Review Guidance"
        description="Use this guidance to structure consultant approval and escalation decisions."
        scenarios={['low_lecturer_coverage']}
      />

      <Card>
        <CardHeader>
          <CardTitle>Consultant Review Actions</CardTitle>
          <CardDescription>Queue a decision after checking identity and qualifications.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => queueAction('approve consultant')}>Approve Consultant</Button>
          <Button variant="outline" onClick={() => queueAction('request more information')}>Request More Info</Button>
          <Button variant="secondary" onClick={() => queueAction('escalate to compliance')}>Escalate</Button>
          <Button variant="destructive" onClick={() => queueAction('reject application')}>Reject Application</Button>
        </CardContent>
      </Card>
    </div>
  );
}
