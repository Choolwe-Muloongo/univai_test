'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/student/page-header';
import { StatCard } from '@/components/student/stat-card';
import { EmptyState } from '@/components/student/empty-state';
import { getStudentAssignmentById, submitStudentAssignment } from '@/lib/api';
import type { StudentAssignmentDetail } from '@/lib/api/types';

export default function AssignmentDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const [assignment, setAssignment] = useState<StudentAssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getStudentAssignmentById(assignmentId);
        setAssignment(data);
        setContent(data.submission?.content ?? '');
        setAttachmentUrl(data.submission?.attachmentUrl ?? '');
      } finally {
        setLoading(false);
      }
    };
    if (assignmentId) {
      void load();
    }
  }, [assignmentId]);

  const dueLabel = useMemo(() => {
    if (!assignment?.dueDate) return 'No due date';
    return new Date(assignment.dueDate).toLocaleString();
  }, [assignment?.dueDate]);

  const handleSubmit = async () => {
    if (!assignment) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await submitStudentAssignment(assignment.id, {
        content: content.trim() || undefined,
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      const refreshed = await getStudentAssignmentById(assignment.id);
      setAssignment(refreshed);
      setSaveMessage('Submission saved successfully.');
    } catch (error) {
      console.error(error);
      setSaveMessage('Failed to submit assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading assignment...</div>;
  }

  if (!assignment) {
    return (
      <EmptyState
        title="Assignment not found"
        description="Return to the assignments list to select another item."
        action={
          <Button asChild>
            <Link href="/student/assignments">Back to assignments</Link>
          </Button>
        }
      />
    );
  }

  const submissionStatus = assignment.submission?.status ?? assignment.submissionStatus ?? 'not_submitted';

  return (
    <div className="space-y-8">
      <PageHeader
        title={assignment.title}
        description={assignment.description}
        actions={
          <Button variant="outline" asChild>
            <Link href="/student/assignments">Back to assignments</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Due Date" value={dueLabel} helper={assignment.moduleTitle ?? 'Module'} />
        <StatCard title="Max Points" value={`${assignment.maxPoints}`} helper={assignment.assignmentType} />
        <StatCard title="Status" value={submissionStatus.replace('_', ' ')} helper={assignment.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>Read carefully before submitting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{assignment.instructions || 'No extra instructions provided.'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
            <CardDescription>Latest submission details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant={submissionStatus === 'graded' ? 'default' : 'secondary'}>
                {submissionStatus.replace('_', ' ')}
              </Badge>
              {assignment.submission?.submittedAt && (
                <span>Submitted {new Date(assignment.submission.submittedAt).toLocaleString()}</span>
              )}
            </div>
            {assignment.submission?.grade !== null && assignment.submission?.grade !== undefined && (
              <p>Grade: {assignment.submission.grade}</p>
            )}
            {assignment.submission?.feedback && (
              <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Feedback</p>
                <p>{assignment.submission.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit your work</CardTitle>
          <CardDescription>Add notes, upload links, and confirm your submission.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {saveMessage && (
            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              {saveMessage}
            </div>
          )}
          <div className="space-y-2">
            <Label>Submission Notes</Label>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Summarize what you submitted or add a short note for the lecturer."
              className="min-h-28"
            />
          </div>
          <div className="space-y-2">
            <Label>Attachment Link</Label>
            <Input
              value={attachmentUrl}
              onChange={(event) => setAttachmentUrl(event.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/assignments/submissions">View submissions</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={saving || (!content.trim() && !attachmentUrl.trim())}>
            {saving ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
