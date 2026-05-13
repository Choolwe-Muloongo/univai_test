'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getLecturerApplication, updateLecturerApplication } from '@/lib/api';
import type { LecturerApplication } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

export default function LecturerApplicationDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [application, setApplication] = useState<LecturerApplication | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getLecturerApplication(id as string);
      setApplication(data);
      setNotes(data.notes ?? '');
      setLoading(false);
    };
    load();
  }, [id]);

  const handleUpdate = async (status: string) => {
    if (!application) return;
    const updated = await updateLecturerApplication(application.id, { status, notes });
    setApplication(updated);
    if (updated.login?.temporaryPassword) {
      toast({
        title: 'Lecturer approved',
        description: `Login: ${updated.login.email} / ${updated.login.temporaryPassword}`,
      });
    } else {
      toast({
        title: 'Application updated',
        description: `Status set to ${status}.`,
      });
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading application...</p>;
  }

  if (!application) {
    return <p className="text-sm text-muted-foreground">Application not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lecturer Application</h1>
          <p className="text-muted-foreground">Review lecturer background and approve credentials.</p>
        </div>
        <Badge variant="secondary">{application.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applicant Details</CardTitle>
          <CardDescription>Core bio and academic background.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Full Name</p>
            <p className="font-semibold">{application.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="font-semibold">{application.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="font-semibold">{application.department ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Specialization</p>
            <p className="font-semibold">{application.specialization ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Qualification</p>
            <p className="font-semibold">{application.highestQualification ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Experience</p>
            <p className="font-semibold">{application.yearsExperience ?? 0} years</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground">Program Interest</p>
            <p className="font-semibold">{application.programInterest ?? '—'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Links submitted by the applicant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {application.documents && Object.keys(application.documents).length > 0 ? (
            Object.entries(application.documents).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                {value ? (
                  <a className="text-primary underline" href={value} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : (
                  <span className="text-muted-foreground">Not provided</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No documents provided.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reviewer Notes</CardTitle>
          <CardDescription>Capture notes or conditions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-32" />
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={() => handleUpdate('approved')}>Approve</Button>
          <Button variant="outline" onClick={() => handleUpdate('under_review')}>Under Review</Button>
          <Button variant="destructive" onClick={() => handleUpdate('rejected')}>Reject</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
