'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';
import { createScholarshipApplication, getScholarshipApplications } from '@/lib/api';
import type { ScholarshipApplication } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';

export default function StudentFinancialAidPage() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [statement, setStatement] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadApplications = async () => {
    const data = await getScholarshipApplications();
    setApplications(data);
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleSubmit = async () => {
    if (!statement.trim()) return;
    setSubmitting(true);
    try {
      const created = await createScholarshipApplication({ statement: statement.trim() });
      setApplications((prev) => [created, ...prev]);
      setStatement('');
      toast({ title: 'Application submitted', description: 'Our team will review your request.' });
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scholarships & Aid</h1>
          <p className="text-muted-foreground">Track financial aid awards and scholarship applications.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/student/payments">Back to Billing</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Awards</CardTitle>
          <CardDescription>These awards reduce your tuition balance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No awards available yet. Approved scholarships will appear here.
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="rounded-lg border p-4 text-sm">
                <p className="font-semibold">Scholarship Request</p>
                <p className="text-xs text-muted-foreground">Status: {app.status}</p>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{app.statement}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Apply for New Aid</CardTitle>
          <CardDescription>Share your story and submit supporting documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              placeholder="Explain why you need support and any financial constraints."
              className="min-h-[120px]"
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
            />
            <Button className="w-full" onClick={handleSubmit} disabled={submitting || !statement.trim()}>
              Start Application
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

