'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getExamResults } from '@/lib/api';

type ExamResult = {
  courseTitle: string;
  completedAt: string;
  score?: number;
};

type ResultRow = ExamResult & { id: string };

export default function ExamHistoryPage() {
  const [history, setHistory] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const results = (await getExamResults()) as Record<string, ExamResult>;
        const rows = Object.entries(results || {}).map(([id, result]) => ({
          id,
          ...result,
        }));
        rows.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setHistory(rows);
      } catch (error) {
        console.error('Failed to load exam history', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam History</h1>
        <p className="text-muted-foreground">Past exam attempts and scores.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Exams</CardTitle>
          <CardDescription>Results logged in your record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading exam history...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exams completed yet.</p>
          ) : (
            history.map((item) => {
              const score = typeof item.score === 'number' ? item.score : null;
              const status = score === null ? 'Recorded' : score >= 50 ? 'Passed' : 'Needs Review';
              return (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">{item.courseTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.completedAt ? format(new Date(item.completedAt), 'MMM d, yyyy') : 'Recently'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{score !== null ? `${score}%` : 'Pending'}</p>
                    <Badge variant={status === 'Passed' ? 'secondary' : 'outline'}>{status}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
