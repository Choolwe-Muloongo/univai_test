'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { updateJobApplication } from '@/lib/api';

const actions = [
  { status: 'shortlisted', label: 'Shortlist' },
  { status: 'accepted', label: 'Accept' },
  { status: 'rejected', label: 'Reject' },
];

export function JobApplicantActions({
  jobId,
  applicationId,
  currentStatus,
}: {
  jobId: string;
  applicationId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setPendingStatus(status);
    setError(null);
    try {
      await updateJobApplication(jobId, applicationId, status);
      router.refresh();
    } catch (err) {
      setError('Only verified employers can update applicants. Please verify your employer profile.');
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.status}
            size="sm"
            variant={currentStatus === action.status ? 'default' : 'outline'}
            disabled={pendingStatus !== null || currentStatus === action.status}
            onClick={() => updateStatus(action.status)}
          >
            {pendingStatus === action.status ? 'Updating...' : action.label}
          </Button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
