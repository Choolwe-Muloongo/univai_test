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
              This applicant has submitted required documentation for lecturer verification. Use the actions to review
              documents, request additional information, or finalize approval.
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
        title="Consultant Review Decision Panel"
        situationSummary={`${application.name}'s consultant application is currently ${application.status}. Validate identity and teaching evidence before deciding.`}
        evidence={[
          {
            id: 'consultant-cv',
            label: 'Curriculum vitae',
            detail: 'CV file uploaded and ready for review.',
            kind: 'document',
          },
          {
            id: 'consultant-id',
            label: 'Identification document',
            detail: 'Identity file uploaded for KYC checks.',
            kind: 'document',
          },
          {
            id: 'consultant-history',
            label: 'Application status history',
            detail: `Current status: ${application.status}.`,
            kind: 'history',
          },
        ]}
        actions={[
          {
            id: 'approve',
            label: 'Approve Consultant',
            description: 'Approve the applicant for consultant onboarding.',
            consequenceHint: 'Consultant profile can be activated for assignments.',
            requiredNotifications: ['Applicant email', 'HR operations', 'Department lead'],
            reversible: true,
            rollbackPath: 'Suspend profile and open compliance review case.',
            sensitive: true,
          },
          {
            id: 'request_info',
            label: 'Request More Info',
            description: 'Ask for missing certifications or clarifications.',
            consequenceHint: 'Application remains pending until applicant responds.',
            requiredNotifications: ['Applicant email', 'Reviewer queue'],
            reversible: true,
            rollbackPath: 'Return to pending review after documents are received.',
            variant: 'outline',
          },
          {
            id: 'reject',
            label: 'Reject Application',
            description: 'Decline this consultant application.',
            consequenceHint: 'Applicant cannot onboard without reapplication or appeal.',
            requiredNotifications: ['Applicant email', 'Compliance mailbox'],
            reversible: true,
            rollbackPath: 'Reopen application with manager override.',
            sensitive: true,
            variant: 'destructive',
          },
          {
            id: 'escalate',
            label: 'Escalate to Compliance',
            description: 'Escalate concerns to senior compliance reviewers.',
            consequenceHint: 'Final decision is paused pending compliance adjudication.',
            requiredNotifications: ['Compliance team', 'Department lead'],
            reversible: true,
            rollbackPath: 'Close escalation and return application to local queue.',
            variant: 'secondary',
          },
        ]}
        onSubmitAction={(actionId, metadata) => {
          toast({
            title: `Action queued: ${actionId.replace('_', ' ')}`,
            description: metadata.decisionReason
              ? `Decision reason captured: ${metadata.decisionReason}`
              : 'Decision has been captured in the moderation log.',
          });
        }}
      />
    </div>
  );
}
