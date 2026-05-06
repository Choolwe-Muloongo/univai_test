'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Ban, CheckCircle2, Clock, ExternalLink, History } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { getStudentCredential } from '@/lib/api';
import {
  buildCredentialQrCodeUrl,
  buildCredentialVerificationUrl,
  getCredentialStatusLabel,
  getCredentialTypeLabel,
  type CredentialRecord,
  type CredentialStatus,
} from '@/lib/credentials';

function statusIcon(status: CredentialStatus) {
  if (status === 'revoked') return <Ban className="h-4 w-4 text-destructive" />;
  if (status === 'issued') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

function CertificateSkeleton() {
  return (
    <div className="flex justify-center items-start pt-12">
      <Card className="w-full max-w-5xl p-8">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-12 w-48" />
          </div>
          <Skeleton className="h-8 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-8">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-12 w-80 mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CertificatePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [credential, setCredential] = useState<CredentialRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchCredential = async () => {
      try {
        const resolved = await getStudentCredential(id);
        if (resolved) {
          setCredential(resolved);
        } else {
          setError('Credential not found.');
        }
      } catch (e) {
        setError('Error fetching credential data.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCredential();
  }, [id]);

  const verificationUrl = useMemo(
    () => (credential ? buildCredentialVerificationUrl(credential.publicId, origin) : ''),
    [credential, origin],
  );
  const qrCodeUrl = verificationUrl ? buildCredentialQrCodeUrl(verificationUrl, 180) : '';

  if (loading) {
    return <CertificateSkeleton />;
  }

  if (error || !credential) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error ?? 'Credential not found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-8">
      <Card className="mx-auto w-full max-w-5xl p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 rounded-full" />

        <CardHeader className="text-center space-y-4 z-10 relative">
          <div className="flex justify-center items-center gap-3">
            <Logo className="size-12 text-primary" />
            <h1 className="text-4xl font-bold">UnivAI</h1>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-semibold tracking-wider text-muted-foreground">
              {getCredentialTypeLabel(credential.type)}
            </p>
            <Badge variant={credential.status === 'revoked' ? 'destructive' : 'secondary'} className="gap-1">
              {statusIcon(credential.status)}
              {getCredentialStatusLabel(credential.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="text-center space-y-6 z-10 relative pt-8">
          <p className="text-lg">This credential is awarded to</p>
          <p className="text-5xl font-bold text-primary tracking-tight">{credential.recipientName}</p>
          <p className="text-lg">for successfully completing</p>
          <p className="text-3xl font-semibold">{credential.title}</p>
          {credential.programName && <p className="text-muted-foreground">Program: {credential.programName}</p>}
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <div>
              Public ID <span className="font-semibold text-foreground">{credential.publicId}</span>
            </div>
            <div>
              Issued{' '}
              <span className="font-semibold text-foreground">
                {credential.issuedAt ? format(new Date(credential.issuedAt), 'MMMM d, yyyy') : 'Pending'}
              </span>
            </div>
            <div>
              Status <span className="font-semibold text-foreground">{getCredentialStatusLabel(credential.status)}</span>
            </div>
          </div>

          {credential.revokedReason && (
            <p className="mx-auto max-w-2xl rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Revocation: {credential.revokedReason}
            </p>
          )}

          <div className="flex flex-col items-center gap-3 pt-6">
            {qrCodeUrl && <Image src={qrCodeUrl} alt="Verification QR Code" width={160} height={160} />}
            <Badge variant="secondary">Scan to verify</Badge>
            <Link href={credential.verificationPath} className="break-all text-sm text-primary hover:underline">
              {verificationUrl || credential.verificationPath}
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit history
            </CardTitle>
            <CardDescription>Immutable credential lifecycle events for issue, verification, updates, and revocation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {credential.auditHistory.map((event) => (
              <div key={event.id} className="border-l-2 border-primary/30 pl-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium capitalize">{event.action}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <p className="text-sm text-muted-foreground">{event.actor}</p>
                {event.note && <p className="text-sm">{event.note}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registry actions</CardTitle>
            <CardDescription>Verification and revocation are part of the credential record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href={credential.verificationPath}>
                Open public verify <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full" disabled>
              Request revocation review
            </Button>
            <p className="text-xs text-muted-foreground">
              Revocation is supported by the registry API and appears immediately on public verification once approved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
