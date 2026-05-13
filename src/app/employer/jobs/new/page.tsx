'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Briefcase, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createJob } from '@/lib/api';

const formatJobType = (value: string) => {
  const map: Record<string, string> = {
    internship: 'Internship',
    'part-time': 'Part-time',
    'full-time': 'Full-time',
    contract: 'Contract',
  };
  return map[value] ?? value;
};

export default function EmployerJobCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [roleType, setRoleType] = useState('internship');
  const [workMode, setWorkMode] = useState('hybrid');
  const [summary, setSummary] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const descriptionParts = [
      summary ? `Summary:\n${summary}` : '',
      requirements ? `Requirements:\n${requirements}` : '',
      workMode ? `Work mode: ${workMode}` : '',
    ].filter(Boolean);

    try {
      await createJob({
        title,
        company,
        location,
        type: formatJobType(roleType),
        description: descriptionParts.join('\n\n'),
      });
      router.push('/employer/jobs');
    } catch (err) {
      setError('Unable to publish this job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || !title.trim() || !company.trim() || !location.trim();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post a New Job</h1>
          <p className="text-muted-foreground">Create a listing to reach UnivAI students and alumni.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/employer/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Describe the role, requirements, and hiring process.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g., Junior Product Designer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="e.g., Afta Labs"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Role Type</Label>
                  <Select value={roleType} onValueChange={setRoleType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select role type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="Lusaka, Zambia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-mode">Work Mode</Label>
                <Select value={workMode} onValueChange={setWorkMode}>
                  <SelectTrigger id="work-mode">
                    <SelectValue placeholder="Select work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Role Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="min-h-28"
                  placeholder="Summarize the role and outcomes."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Key Requirements</Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                  className="min-h-28"
                  placeholder="List must-have skills and experience."
                />
              </div>

              <Button className="w-full" type="submit" disabled={isDisabled}>
                {isSubmitting ? 'Publishing...' : 'Publish Listing'}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Posting Checklist</CardTitle>
            <CardDescription>Make your listing stand out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Briefcase className="mt-0.5 h-4 w-4 text-primary" />
              <span>Define clear responsibilities and outcomes.</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" />
              <span>Specify location, schedule, and work mode.</span>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="mt-0.5 h-4 w-4 text-primary" />
              <span>Share your hiring timeline for transparency.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
