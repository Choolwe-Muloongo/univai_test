'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Ban, CheckCircle, History, ShieldAlert, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { verifyPublicCredential } from '@/lib/api';
import {
  buildCredentialQrCodeUrl,
  buildCredentialVerificationUrl,
  getCredentialStatusLabel,
  getCredentialTypeLabel,
  type CredentialVerificationResult,
} from '@/lib/credentials';

export default function VerificationPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [result, setResult] = useState<CredentialVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!id) return;
    const verifyResult = async () => {
      try {
        setResult(await verifyPublicCredential(id));
      } catch (e) {
        setResult({
          isValid: false,
          credential: null,
          checkedAt: new Date().toISOString(),
          message: 'This credential could not be found or is invalid.',
        });
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    verifyResult();
  }, [id]);

  const credential = result?.credential ?? null;
  const verificationUrl = useMemo(
    () => (credential ? buildCredentialVerificationUrl(credential.publicId, origin) : ''),
    [credential, origin],
  );
  const qrCodeUrl = verificationUrl ? buildCredentialQrCodeUrl(verificationUrl, 140) : '';
  const isRevoked = credential?.status === 'revoked';
  const isValid = Boolean(result?.isValid && credential && !isRevoked);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-muted/40 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isValid ? (
              <>
                <CheckCircle className="text-green-500" />
                Credential Verified
              </>
            ) : isRevoked ? (
              <>
                <Ban className="text-destructive" />
                Credential Revoked
              </>
            ) : (
              <>
                <XCircle className="text-destructive" />
                Verification Failed
              </>
            )}
          </CardTitle>
          <CardDescription>{result?.message}</CardDescription>
        </CardHeader>
        {credential ? (
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[1fr_140px]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recipient</p>
                  <p className="text-lg font-semibold">{credential.recipientName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Credential</p>
                  <p className="text-lg font-semibold">{credential.title}</p>
                  <p className="text-sm text-muted-foreground">{getCredentialTypeLabel(credential.type)}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Public ID</p>
                    <p className="font-semibold">{credential.publicId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Issue status</p>
                    <Badge variant={isRevoked ? 'destructive' : 'default'}>{getCredentialStatusLabel(credential.status)}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Issued</p>
                  <p className="font-semibold">
                    {credential.issuedAt ? format(new Date(credential.issuedAt), 'MMMM d, yyyy') : 'Pending'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                {qrCodeUrl && <Image src={qrCodeUrl} alt="Credential QR code" width={140} height={140} />}
                <p className="text-center text-xs text-muted-foreground">QR points to this public registry URL.</p>
              </div>
            </div>

            {isRevoked && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  Revocation notice
                </div>
                <p>{credential.revokedReason ?? 'This credential has been revoked by UnivAI.'}</p>
                {credential.revokedAt && <p>Revoked {format(new Date(credential.revokedAt), 'MMMM d, yyyy')}</p>}
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4" />
                Public audit summary
              </div>
              <div className="space-y-3">
                {credential.auditHistory.slice(0, 4).map((event) => (
                  <div key={event.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <span className="font-medium capitalize">{event.action}</span>
                      <span className="text-muted-foreground">{format(new Date(event.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                    {event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Badge variant={isValid ? 'default' : 'destructive'}>{isValid ? 'Authentic' : 'Not valid'}</Badge>
              <p className="text-xs text-muted-foreground">
                Checked {result?.checkedAt ? format(new Date(result.checkedAt), 'MMM d, yyyy h:mm a') : 'now'} in UnivAI Registry
              </p>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Confirm the public ID exactly as printed on the certificate, diploma, degree, transcript, or statement of results.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
