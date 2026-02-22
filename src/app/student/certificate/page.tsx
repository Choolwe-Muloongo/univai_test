'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Award } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getExamResults } from '@/lib/api';

type ExamResult = {
  courseTitle: string;
  studentName: string;
  completedAt: string;
  score?: number;
};

type CertificateRow = ExamResult & { id: string };

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const results = (await getExamResults()) as Record<string, ExamResult>;
        const rows = Object.entries(results || {}).map(([id, result]) => ({
          id,
          ...result,
        }));
        rows.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        setCertificates(rows);
      } catch (err) {
        console.error(err);
        setError('Unable to load certificates right now.');
      } finally {
        setLoading(false);
      }
    };
    loadCertificates();
  }, []);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading certificates...</div>;
  }

  if (error) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
          <CardDescription>We could not load your certificates.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
        <p className="text-muted-foreground">
          Download and verify certificates issued after exam completion.
        </p>
      </div>

      {certificates.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No certificates yet</CardTitle>
            <CardDescription>
              Complete an exam to unlock a verified certificate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/student/exams">Go to Exams</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{cert.courseTitle}</CardTitle>
                  <CardDescription>
                    Issued {cert.completedAt ? format(new Date(cert.completedAt), 'MMM d, yyyy') : 'Recently'}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  Issued
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Awarded to <span className="font-medium text-foreground">{cert.studentName}</span>
                </div>
                {typeof cert.score === 'number' && (
                  <div className="text-sm text-muted-foreground">
                    Final score <span className="font-semibold text-foreground">{cert.score}%</span>
                  </div>
                )}
                <Button asChild variant="outline">
                  <Link href={`/student/certificate/${cert.id}`}>View Certificate</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
