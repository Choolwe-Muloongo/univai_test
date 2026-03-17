'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export type DecisionReasonCode = {
  value: string;
  label: string;
};

export type DecisionActionOption = {
  value: string;
  label: string;
  consequence: string;
  nextFollowUp: string;
  highImpact?: boolean;
  reasonCodes?: DecisionReasonCode[];
};

export type NotificationRecipientOption = {
  value: string;
  label: string;
};

export type AdminDecisionPayload = {
  action: string;
  decisionReason: string;
  reasonCode?: string;
  recipients: string[];
  escalate: boolean;
  escalationNote?: string;
};

type AdminDecisionPanelProps = {
  title?: string;
  description?: string;
  situationSummary: string;
  evidenceItems: string[];
  actions: DecisionActionOption[];
  requiredRecipients: NotificationRecipientOption[];
  onSubmitDecision: (payload: AdminDecisionPayload) => Promise<void> | void;
  submitLabel?: string;
};

export function AdminDecisionPanel({
  title = 'Decision Panel',
  description = 'Use this structured workflow before taking action.',
  situationSummary,
  evidenceItems,
  actions,
  requiredRecipients,
  onSubmitDecision,
  submitLabel = 'Submit Decision',
}: AdminDecisionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [decisionReason, setDecisionReason] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [escalate, setEscalate] = useState(false);
  const [escalationNote, setEscalationNote] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => actions.find((action) => action.value === selectedAction),
    [actions, selectedAction],
  );

  const handleRecipientToggle = (value: string, checked: boolean) => {
    setRecipients((prev) => {
      if (checked) return [...prev, value];
      return prev.filter((item) => item !== value);
    });
  };

  const handleSubmit = async () => {
    if (!selected) {
      setError('Choose an action before submitting.');
      return;
    }
    if (!decisionReason.trim()) {
      setError('Decision reason is mandatory.');
      return;
    }
    if (selected.highImpact && selected.reasonCodes?.length && !reasonCode) {
      setError('A reason code is required for this high-impact action.');
      return;
    }
    if (recipients.length === 0) {
      setError('Select at least one notification recipient.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await onSubmitDecision({
        action: selected.value,
        decisionReason: decisionReason.trim(),
        reasonCode: reasonCode || undefined,
        recipients,
        escalate,
        escalationNote: escalationNote.trim() || undefined,
      });
      setNextFollowUp(selected.nextFollowUp);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Situation summary</Label>
          <p className="rounded-lg border p-3 text-sm text-muted-foreground">{situationSummary}</p>
        </div>

        <div className="space-y-2">
          <Label>Evidence / documents</Label>
          <ul className="rounded-lg border p-3 text-sm text-muted-foreground space-y-2 list-disc list-inside">
            {evidenceItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="available-action">Available actions</Label>
          <Select value={selectedAction} onValueChange={(value) => {
            setSelectedAction(value);
            setReasonCode('');
          }}>
            <SelectTrigger id="available-action">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {actions.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Consequences of each action</Label>
          <p className="rounded-lg border p-3 text-sm text-muted-foreground">
            {selected ? selected.consequence : 'Select an action to view expected consequences.'}
          </p>
        </div>

        {selected?.highImpact && selected.reasonCodes?.length ? (
          <div className="space-y-2">
            <Label htmlFor="reason-code">High-impact reason code</Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger id="reason-code">
                <SelectValue placeholder="Select reason code" />
              </SelectTrigger>
              <SelectContent>
                {selected.reasonCodes.map((code) => (
                  <SelectItem key={code.value} value={code.value}>
                    {code.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-3">
          <Label>Required notification recipients</Label>
          <div className="rounded-lg border p-3 space-y-3">
            {requiredRecipients.map((recipient) => (
              <div key={recipient.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`recipient-${recipient.value}`}
                  checked={recipients.includes(recipient.value)}
                  onCheckedChange={(checked) => handleRecipientToggle(recipient.value, checked === true)}
                />
                <Label htmlFor={`recipient-${recipient.value}`} className="font-normal">
                  {recipient.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="decision-reason">Decision reason (mandatory)</Label>
          <Textarea
            id="decision-reason"
            className="min-h-24"
            value={decisionReason}
            onChange={(event) => setDecisionReason(event.target.value)}
            placeholder="Capture rationale, policy references, and objective factors."
          />
        </div>

        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="escalate-switch">Escalate option</Label>
              <p className="text-xs text-muted-foreground">Escalate this case for higher-level review.</p>
            </div>
            <Switch id="escalate-switch" checked={escalate} onCheckedChange={setEscalate} />
          </div>
          {escalate ? (
            <Input
              value={escalationNote}
              onChange={(event) => setEscalationNote(event.target.value)}
              placeholder="Escalation details (optional)"
            />
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {nextFollowUp ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <span>
              Next required follow-up action: <strong>{nextFollowUp}</strong>
            </span>
          </div>
        ) : null}

        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Submitting...' : submitLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
