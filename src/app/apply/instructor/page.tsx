'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';

import { WhatsAppChannelRequirement } from '@/components/auth/whatsapp-channel-requirement';
import { Logo } from '@/components/icons/logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { registerAccount, submitInstructorApplication } from '@/lib/api';

export default function InstructorApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joinedChannel, setJoinedChannel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      if (!joinedChannel) {
        setError('Join the UnivAI WhatsApp channel before creating an account.');
        return;
      }
      await registerAccount({
        name: fullName,
        email,
        password,
        role: 'instructor-applicant',
        acceptedWhatsappChannel: joinedChannel,
      } as any);
      await submitInstructorApplication({
        fullName,
        email,
        phone: String(formData.get('phone') || ''),
        expertise: String(formData.get('expertise') || ''),
        bio: String(formData.get('bio') || ''),
        yearsExperience: Number(formData.get('yearsExperience') || 0),
        highestQualification: String(formData.get('highestQualification') || ''),
        portfolioUrl: String(formData.get('portfolioUrl') || ''),
      });
      setSuccess(true);
      router.push('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit instructor application.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 py-8">
      <Link href="/" className="absolute left-4 top-4 flex items-center gap-2 text-lg font-semibold text-primary md:left-8 md:top-8">
        <Logo className="size-8" />
        <span>UnivAI</span>
      </Link>

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Instructor Marketplace Application
          </CardTitle>
          <CardDescription>
            Create an applicant account and submit your instructor profile for admin review before accessing the instructor portal.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Application failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert>
                <AlertTitle>Application submitted</AlertTitle>
                <AlertDescription>Your instructor profile is waiting for admin review.</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" minLength={6} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expertise">Expertise</Label>
                <Input id="expertise" name="expertise" placeholder="Data, nursing, leadership, design..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="highestQualification">Highest qualification</Label>
                <Input id="highestQualification" name="highestQualification" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExperience">Years experience</Label>
                <Input id="yearsExperience" name="yearsExperience" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                <Input id="portfolioUrl" name="portfolioUrl" placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Teaching bio</Label>
              <Textarea id="bio" name="bio" rows={6} required />
            </div>
            <WhatsAppChannelRequirement checked={joinedChannel} onCheckedChange={setJoinedChannel} />
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" disabled={loading || !joinedChannel}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit instructor application
            </Button>
            <p className="text-sm text-muted-foreground">
              Already approved? <Link href="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
