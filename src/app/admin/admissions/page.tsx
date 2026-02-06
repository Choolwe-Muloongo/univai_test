'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApplications } from '@/lib/api';
import type { ApplicationSummary, ApplicationStatus } from '@/lib/api/types';
import { ClipboardCheck, Filter, Search } from 'lucide-react';

const statusLabels: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  fee_paid: 'Fee Paid',
  under_review: 'Under Review',
  needs_info: 'Needs Info',
  approved: 'Approved',
  rejected: 'Rejected',
  admitted: 'Admitted',
};

const statusBadgeVariant: Record<ApplicationStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline',
  submitted: 'secondary',
  fee_paid: 'secondary',
  under_review: 'default',
  needs_info: 'outline',
  approved: 'default',
  rejected: 'destructive',
  admitted: 'default',
};

export default function AdmissionsDashboardPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true);
      const data = await getApplications();
      setApplications(data);
      setLoading(false);
    };
    loadApplications();
  }, []);

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesQuery =
        app.fullName.toLowerCase().includes(query.toLowerCase()) ||
        app.email.toLowerCase().includes(query.toLowerCase()) ||
        app.programId.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || app.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [applications, query, status]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      submitted: applications.filter((app) => app.status === 'submitted').length,
      feePaid: applications.filter((app) => app.status === 'fee_paid').length,
      review: applications.filter((app) => app.status === 'under_review').length,
    };
  }, [applications]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admissions & Enrollment</h1>
          <p className="text-muted-foreground">
            Review applications, verify requirements, and move qualified students to enrollment.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/reports">View Admission Reports</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.submitted}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Fee Paid</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.feePaid}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.review}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Application Queue
            </CardTitle>
            <CardDescription>Filter, review, and take action on new applicants.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search applicant or program"
                className="pl-8"
              />
            </div>
            <Select value={status} onValueChange={(value) => setStatus(value as ApplicationStatus | 'all')}>
              <SelectTrigger className="w-44">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.keys(statusLabels).map((key) => (
                  <SelectItem key={key} value={key}>
                    {statusLabels[key as ApplicationStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading applications...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications match this filter.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((app) => (
                <div key={app.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">{app.fullName}</p>
                    <p className="text-sm text-muted-foreground">{app.email}</p>
                    <p className="text-xs text-muted-foreground">Program: {app.programId.toUpperCase()}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Subjects: {app.subjectCount}</div>
                      <div>Total Points: {app.totalPoints}</div>
                    </div>
                    <Badge variant={statusBadgeVariant[app.status]}>{statusLabels[app.status]}</Badge>
                    <Button asChild>
                      <Link href={`/admin/admissions/${app.id}`}>Review</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
