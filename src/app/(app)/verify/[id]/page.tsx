// src/app/(app)/verify/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface ExamResult {
  courseTitle: string;
  studentName: string;
  score: number;
  completedAt: {
    seconds: number;
  };
}

export default function VerificationPage() {
  const params = useParams();
  const id = params.id as string;
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!id) return;
    const verifyResult = async () => {
      try {
        const docRef = doc(db, 'examResults', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setResult(docSnap.data() as ExamResult);
          setIsValid(true);
        } else {
          setIsValid(false);
        }
      } catch (e) {
        setIsValid(false);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    verifyResult();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full max-w-md">
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
    <div className="flex justify-center items-center h-screen bg-muted/40">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isValid ? (
              <>
                <CheckCircle className="text-green-500" />
                Credential Verified
              </>
            ) : (
              <>
                <XCircle className="text-destructive" />
                Verification Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isValid ? 'This credential is authentic and has been verified.' : 'This credential could not be found or is invalid.'}
          </CardDescription>
        </CardHeader>
        {isValid && result && (
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Student Name</p>
              <p className="text-lg font-semibold">{result.studentName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Course Title</p>
              <p className="text-lg font-semibold">{result.courseTitle}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completion Date</p>
              <p className="text-lg font-semibold">
                {format(new Date(result.completedAt.seconds * 1000), 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <Badge>Authentic</Badge>
              <p className="text-xs text-muted-foreground">Verified by UnivAI Blockchain</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
