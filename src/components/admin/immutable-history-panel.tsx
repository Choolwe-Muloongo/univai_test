'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type AdminHistoryEntry = {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  reason?: string;
  timestamp: string;
};

export function ImmutableHistoryPanel({
  title = 'Immutable History',
  entries,
}: {
  title?: string;
  entries: AdminHistoryEntry[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Destructive actions are append-only and cannot be edited.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No destructive actions recorded yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="rounded-lg border p-3 text-sm">
              <p className="font-medium">
                {entry.entity} {entry.entityId}: {entry.action}
              </p>
              {entry.reason && <p className="text-muted-foreground">Reason: {entry.reason}</p>}
              <p className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
