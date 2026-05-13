'use client';

import Image from 'next/image';
import { useEffect, useState, type ElementType } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { BadgeCheck, CalendarDays, ShieldCheck } from 'lucide-react';

import { Logo } from '@/components/icons/logo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getExamResults, getLatestExamId } from '@/lib/api';

interface ExamResult {
  courseTitle: string;
  studentName: string;
  completedAt: string;
}

function CertificateSkeleton() {
  return (
    <div className="flex items-start justify-center px-4 pt-12">
      <Card className="w-full max-w-5xl p-6 sm:p-10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Skeleton className="h-16 w-64" />
          </div>
          <Skeleton className="mx-auto h-8 w-72" />
        </CardHeader>
        <CardContent className="space-y-6 pt-8 text-center">
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-12 w-80" />
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-8 w-64" />
          <div className="grid gap-6 pt-12 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="mx-auto h-[120px] w-[120px]" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CertificatePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${id}` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  useEffect(() => {
    if (!id) return;
    const fetchResult = async () => {
      try {
        const stored = (await getExamResults()) as Record<string, ExamResult>;
        const latestId = (await getLatestExamId()) as string | null;
        const resolved = stored[String(id)] || (latestId ? stored[String(latestId)] : null);
        if (resolved) {
          setResult(resolved);
        } else {
          setError('Certificate not found.');
        }
      } catch {
        setError('Unable to load this certificate.');
      } finally {
        setLoading(false);
      }
    };
    void fetchResult();
  }, [id]);

  if (loading) return <CertificateSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>Certificate unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const issuedDate = result?.completedAt ? format(new Date(result.completedAt), 'MMMM d, yyyy') : 'N/A';

  return (
    <div className="px-4 py-10">
      <Card className="relative mx-auto w-full max-w-5xl overflow-hidden border-cyan-200/70 p-5 shadow-[0_30px_80px_-56px_hsl(var(--brand-cyan)/0.8)] sm:p-10">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-blue))] to-[hsl(var(--brand-cyan))]" />
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[hsl(var(--brand-cyan)/0.14)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-28 h-80 w-80 rounded-full bg-[hsl(var(--brand-violet)/0.12)] blur-3xl" />

        <CardHeader className="relative z-10 items-center space-y-5 text-center">
          <div className="flex items-center gap-3">
            <Logo className="size-16 rounded-2xl" />
            <div className="text-left">
              <p className="brand-gradient-text text-3xl font-extrabold">UnivAI</p>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Unlocking Intelligence</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
            <ShieldCheck className="mr-1 size-4" />
            UnivAI Verified Certificate
          </Badge>
          <div>
            <p className="text-sm font-semibold uppercase text-muted-foreground">Certificate of Completion</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Human-reviewed learning achievement</h1>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-8 pt-8 text-center">
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">This certifies that</p>
            <p className="brand-gradient-text text-4xl font-extrabold sm:text-6xl">{result?.studentName}</p>
            <p className="text-lg text-muted-foreground">has successfully completed</p>
            <p className="text-2xl font-semibold sm:text-3xl">{result?.courseTitle}</p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
            <DocumentInfo icon={CalendarDays} label="Issued" value={issuedDate} />
            <DocumentInfo icon={BadgeCheck} label="Certificate No." value={id || 'N/A'} />
            <DocumentInfo icon={ShieldCheck} label="Issuer" value="UnivAI Academic Office" />
          </div>

          <div className="grid items-end gap-8 pt-8 md:grid-cols-3">
            <SignatureBlock name="UnivAI Academic Office" title="Academic Quality & Review" />
            <div className="flex flex-col items-center">
              <div className="rounded-xl border bg-white p-3 shadow-sm">
                <Image src={qrCodeUrl} alt="Verification QR Code" width={120} height={120} />
              </div>
              <Badge variant="secondary" className="mt-3">Scan to Verify</Badge>
            </div>
            <SignatureBlock name="UnivAI Registry" title="Certificates & Records" align="right" />
          </div>

          <p className="mx-auto max-w-3xl border-t pt-6 text-xs text-muted-foreground">
            This certificate is issued by UnivAI for verified completion of the stated learning activity.
            Verification is available through the QR code and certificate number shown above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentInfo({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/35 p-4 text-left">
      <Icon className="size-5 text-primary" />
      <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function SignatureBlock({ name, title, align = 'left' }: { name: string; title: string; align?: 'left' | 'right' }) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <div className="mb-2 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <p className="font-semibold">{name}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
