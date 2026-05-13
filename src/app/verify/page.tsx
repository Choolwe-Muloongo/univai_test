'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VerifyLandingPage() {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateId.trim()) return;
    router.push(`/verify/${certificateId.trim()}`);
  };

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Verify a Credential</CardTitle>
          <CardDescription>
            Enter a certificate ID to validate a student&apos;s credential.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificateId">Certificate ID</Label>
              <Input
                id="certificateId"
                placeholder="e.g., abcd1234"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
              />
            </div>
            <Button className="w-full" type="submit">
              Verify Credential
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
