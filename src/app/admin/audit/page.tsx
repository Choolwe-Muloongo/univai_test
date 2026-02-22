'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuditLogs } from '@/lib/api';
import type { AuditLogEntry } from '@/lib/api/types';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAuditLogs();
        setLogs(data);
      } catch (error) {
        console.error('Failed to load audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading audit logs...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Review governance actions across admissions, assignments, and content.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 200 actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold">{log.action}</p>
                  <p className="text-muted-foreground">
                    {log.targetType ? `${log.targetType} ${log.targetId ?? ''}` : 'System'}
                  </p>
                </div>
                <div className="text-muted-foreground">
                  {log.createdAt}
                </div>
              </div>
              <div className="mt-2 text-muted-foreground">
                Actor: {log.actorRole ?? 'system'} {log.actorId ? `#${log.actorId}` : ''}
              </div>
              {log.payload && (
                <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">
{JSON.stringify(log.payload, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground">No audit activity yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
