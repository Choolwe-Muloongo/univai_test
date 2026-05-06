'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { decideAlumniDiscountApplication, getAlumniDiscountApplications, getAlumniDiscountCampaigns } from '@/lib/api';
import type { AlumniDiscountApplication, AlumniDiscountCampaign } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

export function AlumniDiscountsPanel() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<AlumniDiscountCampaign[]>([]);
  const [applications, setApplications] = useState<AlumniDiscountApplication[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    const [campaignData, applicationData] = await Promise.all([
      getAlumniDiscountCampaigns(),
      getAlumniDiscountApplications(),
    ]);
    setCampaigns(campaignData);
    setApplications(applicationData);
  };

  useEffect(() => {
    load().catch((error) => {
      console.error('Failed to load alumni discount queues', error);
    });
  }, []);

  const decide = async (id: number, decision: 'approved' | 'declined') => {
    setBusyId(id);
    try {
      await decideAlumniDiscountApplication(id, { decision, notes: decision === 'approved' ? 'Finance-admin approval granted.' : 'Finance-admin approval declined.' });
      toast({ title: `Discount ${decision}` });
      await load();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Decision failed', description: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      <Card>
        <CardHeader>
          <CardTitle>Alumni discount campaigns</CardTitle>
          <CardDescription>Campaign eligibility checks completion, account standing, payment clearance, programme levels, dates, and suspension status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {campaigns.length > 0 ? campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{campaign.name}</p>
                <Badge variant={campaign.isActive ? 'secondary' : 'outline'}>{campaign.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{campaign.code} • {campaign.discountValue}{campaign.discountType === 'percentage' ? '%' : '$'} • {campaign.startsAt} to {campaign.endsAt}</p>
              <p className="mt-1 text-xs text-muted-foreground">{campaign.automatic ? 'Automatic evaluation' : 'Manual only'}{campaign.requiresAdminApproval ? ' + finance approval' : ' + auto-apply'}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No campaigns configured.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Finance-admin approval queue</CardTitle>
          <CardDescription>Approve eligible alumni applications or decline with notification back to the learner.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Levels</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length > 0 ? applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{application.studentName ?? `#${application.studentId}`}</TableCell>
                  <TableCell>{application.campaignName}</TableCell>
                  <TableCell>{application.previousProgrammeLevel ?? 'n/a'} → {application.newProgrammeLevel ?? 'n/a'}</TableCell>
                  <TableCell>${application.requestedDiscountAmount}</TableCell>
                  <TableCell><Badge variant={application.status === 'pending' ? 'outline' : 'secondary'}>{application.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {application.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={busyId === application.id} onClick={() => decide(application.id, 'approved')}><CheckCircle2 className="mr-1 h-4 w-4" /> Approve</Button>
                        <Button size="sm" variant="outline" disabled={busyId === application.id} onClick={() => decide(application.id, 'declined')}><XCircle className="mr-1 h-4 w-4" /> Decline</Button>
                      </div>
                    ) : <span className="text-sm text-muted-foreground">Reviewed</span>}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">No alumni discount applications yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
