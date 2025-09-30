// src/app/(app)/certificate/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Logo } from '@/components/icons/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface ExamResult {
  courseTitle: string;
  studentName: string;
  completedAt: {
    seconds: number;
  };
}

function CertificateSkeleton() {
    return (
      <div className="flex justify-center items-start pt-12">
        <Card className="w-full max-w-4xl p-8">
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
            <div className="flex justify-between items-end pt-12">
              <div className="text-left w-1/3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
              <div className="flex flex-col items-center">
                <Skeleton className="h-[120px] w-[120px]" />
                <Skeleton className="h-6 w-24 mt-2" />
              </div>
              <div className="text-right w-1/3 flex flex-col items-end">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

export default function CertificatePage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verificationUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${id}` : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;


  useEffect(() => {
    if (!id) return;
    const fetchResult = async () => {
      try {
        const docRef = doc(db, 'examResults', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setResult(docSnap.data() as ExamResult);
        } else {
          setError('Certificate not found.');
        }
      } catch (e) {
        setError('Error fetching certificate data.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return <CertificateSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start pt-12">
        <Card className="w-full max-w-4xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/5 rounded-full"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 rounded-full"></div>

            <CardHeader className="text-center space-y-4 z-10 relative">
                <div className='flex justify-center items-center gap-3'>
                    <Logo className="size-12 text-primary" />
                    <h1 className='text-4xl font-bold'>UnivAI</h1>
                </div>
                <p className="text-2xl font-semibold tracking-wider text-muted-foreground">Certificate of Completion</p>
            </CardHeader>

            <CardContent className="text-center space-y-6 z-10 relative pt-8">
                <p className="text-lg">This is to certify that</p>
                <p className="text-5xl font-bold text-primary tracking-tight">{result?.studentName}</p>
                <p className="text-lg">has successfully completed the program</p>
                <p className="text-3xl font-semibold">{result?.courseTitle}</p>
                <p className="text-muted-foreground">
                    Issued on {result?.completedAt ? format(new Date(result.completedAt.seconds * 1000), 'MMMM d, yyyy') : 'N/A'}
                </p>

                <div className="flex justify-between items-end pt-12">
                    <div className="text-left">
                        <p className="font-semibold">Dr. Evelyn Reed</p>
                        <p className="text-sm text-muted-foreground border-t mt-1 pt-1">Program Director</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Image src={qrCodeUrl} alt="Verification QR Code" width={120} height={120} />
                        <Badge variant="secondary" className="mt-2">Scan to Verify</Badge>
                    </div>
                    <div className="text-right">
                        <p className="font-semibold">Prof. Alan Turing</p>
                        <p className="text-sm text-muted-foreground border-t mt-1 pt-1">Head of School</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
