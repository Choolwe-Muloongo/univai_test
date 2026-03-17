'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, BellRing, CheckCircle2, FileText, History, RotateCcw, Siren } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type AdminActionPanelAction = {
  id: string;
  label: string;
  description: string;
  consequenceHint: string;
  requiredNotifications: string[];
  reversible: boolean;
  rollbackPath: string;
  sensitive?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
};

export type AdminActionPanelEvidence = {
  id: string;
  label: string;
  detail: string;
  kind: 'document' | 'log' | 'history';
};

type AdminActionPanelProps = {
  title?: string;
  situationSummary: string;
  evidence: AdminActionPanelEvidence[];
  actions: AdminActionPanelAction[];
  onSubmitAction: (actionId: string, metadata: { decisionReason?: string }) => Promise<void> | void;
};

export function AdminActionPanel({
  title = 'Admin Action Panel',
  situationSummary,
  evidence,
  actions,
  onSubmitAction,
}: AdminActionPanelProps) {
  const [decisionReasonByAction, setDecisionReasonByAction] = useState<Record<string, string>>({});
  const [notificationsConfirmed, setNotificationsConfirmed] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const evidenceIcon = useMemo(
    () => ({
      document: FileText,
      log: AlertTriangle,
      history: History,
    }),
    []
  );

  const handleAction = async (action: AdminActionPanelAction) => {
    const decisionReason = decisionReasonByAction[action.id]?.trim();
    const hasNotifications = action.requiredNotifications.length > 0;

    if (action.sensitive && !decisionReason) {
      setErrors((prev) => ({
        ...prev,
        [action.id]: 'Decision reason is required for this sensitive action.',
      }));
      return;
    }

    if (hasNotifications && !notificationsConfirmed[action.id]) {
      setErrors((prev) => ({
        ...prev,
        [action.id]: 'Confirm required notifications before submitting this action.',
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, [action.id]: '' }));
    setActiveAction(action.id);
    try {
      await onSubmitAction(action.id, {
        decisionReason,
      });
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Standardized moderation workflow for high-impact decisions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-semibold">Situation summary</p>
          <p className="text-sm text-muted-foreground">{situationSummary}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Evidence</p>
          <div className="space-y-2">
            {evidence.map((item) => {
              const Icon = evidenceIcon[item.kind];
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <Icon className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Available actions</p>
          <div className="grid gap-4">
            {actions.map((action) => (
              <div key={action.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  {action.sensitive ? <Badge variant="destructive">Sensitive</Badge> : <Badge variant="secondary">Standard</Badge>}
                </div>

                <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
                  <div className="rounded-md border border-dashed p-2">
                    <p className="font-medium text-foreground">Consequence hint</p>
                    <p>{action.consequenceHint}</p>
                  </div>
                  <div className="rounded-md border border-dashed p-2">
                    <p className="font-medium text-foreground">Reversible</p>
                    <p className="flex items-center gap-1">
                      {action.reversible ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Siren className="h-3.5 w-3.5" />}
                      {action.reversible ? 'Yes' : 'No'}
                    </p>
                    <p className="mt-1 flex items-center gap-1">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Rollback path: {action.rollbackPath}
                    </p>
                  </div>
                </div>

                {action.requiredNotifications.length > 0 && (
                  <div className="rounded-md border border-dashed p-3">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      <BellRing className="h-3.5 w-3.5" />
                      Required notifications
                    </p>
                    <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                      {action.requiredNotifications.map((target) => (
                        <li key={target}>{target}</li>
                      ))}
                    </ul>
                    <label className="mt-2 flex items-center gap-2 text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={Boolean(notificationsConfirmed[action.id])}
                        onChange={(event) =>
                          setNotificationsConfirmed((prev) => ({
                            ...prev,
                            [action.id]: event.target.checked,
                          }))
                        }
                        className="h-4 w-4"
                      />
                      I confirm these notifications are configured and will be sent.
                    </label>
                  </div>
                )}

                {action.sensitive && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Decision reason <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      className="min-h-20"
                      value={decisionReasonByAction[action.id] ?? ''}
                      onChange={(event) =>
                        setDecisionReasonByAction((prev) => ({
                          ...prev,
                          [action.id]: event.target.value,
                        }))
                      }
                      placeholder="Describe why this sensitive action is justified."
                    />
                  </div>
                )}

                {errors[action.id] && <p className="text-xs text-destructive">{errors[action.id]}</p>}

                <Button
                  variant={action.variant ?? 'default'}
                  onClick={() => handleAction(action)}
                  disabled={activeAction === action.id}
                >
                  {activeAction === action.id ? 'Submitting...' : action.label}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
