'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const supportedCredentials = [
  'Short-course certificates',
  'Professional certificates',
  'Diplomas',
  'Degrees',
  'Transcripts',
  'Statements of results',
  'Postgraduate credentials',
];

export default function VerifyLandingPage() {
  const router = useRouter();
  const [credentialId, setCredentialId] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialId.trim()) return;
    router.push(`/verify/${encodeURIComponent(credentialId.trim())}`);
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Verify a UnivAI Credential</CardTitle>
          <CardDescription>
            Enter the public ID from a QR code, certificate, diploma, degree, transcript, or statement of results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credentialId">Public credential ID</Label>
              <Input
                id="credentialId"
                placeholder="e.g., UAI-SCC-ABCD1234"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
              />
            </div>
            <Button className="w-full" type="submit">
              Verify Credential
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="flex flex-wrap justify-center gap-2">
        {supportedCredentials.map((credential) => (
          <Badge key={credential} variant="outline">
            {credential}
          </Badge>
        ))}
      </div>
    </div>
  );
}
