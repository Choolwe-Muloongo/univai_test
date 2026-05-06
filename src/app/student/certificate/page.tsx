'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Award, FileCheck2, History, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getStudentCredentials } from '@/lib/api';
import {
  getCredentialStatusLabel,
  getCredentialTypeLabel,
  type CredentialRecord,
  type CredentialStatus,
} from '@/lib/credentials';

const credentialFamilies = [
  'Short-course certificates',
  'Professional certificates',
  'Diplomas and degrees',
  'Transcripts and statements of results',
  'Future postgraduate credentials',
];

function statusVariant(status: CredentialStatus) {
  if (status === 'revoked') return 'destructive';
  if (status === 'issued') return 'default';
  return 'secondary';
}

export default function CertificatesPage() {
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const rows = await getStudentCredentials();
        rows.sort((a, b) => new Date(b.issuedAt ?? 0).getTime() - new Date(a.issuedAt ?? 0).getTime());
        setCredentials(rows);
      } catch (err) {
        console.error(err);
        setError('Unable to load credentials right now.');
      } finally {
        setLoading(false);
      }
    };
    loadCredentials();
  }, []);

  const issuedCount = useMemo(
    () => credentials.filter((credential) => credential.status === 'issued').length,
    [credentials],
  );

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading credentials...</div>;
  }

  if (error) {
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>We could not load your credentials.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credential Wallet</h1>
          <p className="text-muted-foreground">
            Download and verify every UnivAI credential from short courses through postgraduate awards.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {credentialFamilies.map((family) => (
            <Badge key={family} variant="outline">
              {family}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued credentials</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issuedCount}</div>
            <p className="text-xs text-muted-foreground">Active in the verification registry</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public IDs</CardTitle>
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credentials.length}</div>
            <p className="text-xs text-muted-foreground">Each credential has a stable public verification URL</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit coverage</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">Issue, verification, update, and revocation events retained</p>
          </CardContent>
        </Card>
      </div>

      {credentials.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No credentials yet</CardTitle>
            <CardDescription>
              Complete an eligible course, program, or assessment to unlock a verified credential.
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
          {credentials.map((credential) => (
            <Card key={credential.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{credential.title}</CardTitle>
                  <CardDescription>
                    {getCredentialTypeLabel(credential.type)} · Public ID {credential.publicId}
                  </CardDescription>
                </div>
                <Badge variant={statusVariant(credential.status)} className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {getCredentialStatusLabel(credential.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Awarded to <span className="font-medium text-foreground">{credential.recipientName}</span>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    Issued{' '}
                    <span className="font-semibold text-foreground">
                      {credential.issuedAt ? format(new Date(credential.issuedAt), 'MMM d, yyyy') : 'Pending'}
                    </span>
                  </div>
                  <div>
                    Audit events{' '}
                    <span className="font-semibold text-foreground">{credential.auditHistory.length}</span>
                  </div>
                </div>
                {credential.revokedReason && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
                    Revoked: {credential.revokedReason}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link href={`/student/certificate/${credential.publicId}`}>View Credential</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={credential.verificationPath}>Public verification</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
