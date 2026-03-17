'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { escalateException, getExceptionCases, overrideExceptionWithApproval } from '@/lib/api';
import type { ExceptionActionPayload, ExceptionCase, ExceptionDomain } from '@/lib/api/types';

type Props = {
  domain: ExceptionDomain;
  targetId: string | number;
  title?: string;
};

const initialPayload: ExceptionActionPayload = {
  exceptionType: '',
  reasonCode: '',
  evidenceAttachments: [],
  escalationTargetType: 'role',
  escalationTargetId: '',
  approvalChain: [],
  expiryRollbackCondition: '',
};

export function ExceptionActionsCard({ domain, targetId, title = 'Exception Controls' }: Props) {
  const [cases, setCases] = useState<ExceptionCase[]>([]);
  const [payload, setPayload] = useState<ExceptionActionPayload>(initialPayload);
  const [rawEvidence, setRawEvidence] = useState('');
  const [rawApprovals, setRawApprovals] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getExceptionCases(domain, targetId);
      setCases(data);
      setLoading(false);
    };

    load();
  }, [domain, targetId]);

  const hydratedPayload = {
    ...payload,
    evidenceAttachments: rawEvidence.split('\n').map((entry) => entry.trim()).filter(Boolean),
    approvalChain: rawApprovals.split('\n').map((entry) => entry.trim()).filter(Boolean),
  };

  const handleAction = async (action: 'escalate' | 'override') => {
    setSaving(true);
    const created =
      action === 'escalate'
        ? await escalateException(domain, targetId, hydratedPayload)
        : await overrideExceptionWithApproval(domain, targetId, hydratedPayload);

    setCases((prev) => [created, ...prev]);
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Capture exception context, then use Escalate or Override with approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Exception Type</Label>
            <Input value={payload.exceptionType} onChange={(event) => setPayload((prev) => ({ ...prev, exceptionType: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Reason Code</Label>
            <Input value={payload.reasonCode} onChange={(event) => setPayload((prev) => ({ ...prev, reasonCode: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Escalation Target</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={payload.escalationTargetType} onValueChange={(value: 'role' | 'user') => setPayload((prev) => ({ ...prev, escalationTargetType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Role</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="role:finance-admin / user:12"
                value={payload.escalationTargetId}
                onChange={(event) => setPayload((prev) => ({ ...prev, escalationTargetId: event.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expiry / Rollback Condition</Label>
            <Input
              value={payload.expiryRollbackCondition}
              onChange={(event) => setPayload((prev) => ({ ...prev, expiryRollbackCondition: event.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Evidence Attachments (one per line)</Label>
          <Textarea value={rawEvidence} onChange={(event) => setRawEvidence(event.target.value)} className="min-h-20" />
        </div>

        <div className="space-y-2">
          <Label>Approval Chain (one role/user per line)</Label>
          <Textarea value={rawApprovals} onChange={(event) => setRawApprovals(event.target.value)} className="min-h-20" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleAction('escalate')} disabled={saving}>
            Escalate
          </Button>
          <Button variant="secondary" onClick={() => handleAction('override')} disabled={saving}>
            Override with approval
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Exception History</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading exception history...</p>
          ) : cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exceptions logged yet.</p>
          ) : (
            cases.map((item) => (
              <div key={item.id} className="rounded border p-2 text-sm">
                {item.exception_type} · {item.reason_code} · <span className="font-semibold">{item.status}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
