'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createResearch } from '@/lib/api';

export default function EmployerResearchCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [field, setField] = useState('Artificial Intelligence');
  const [duration, setDuration] = useState('');
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
      requirements ? `Preferred background:\n${requirements}` : '',
      duration ? `Duration: ${duration}` : '',
    ].filter(Boolean);

    try {
      await createResearch({
        title,
        company,
        field,
        description: descriptionParts.join('\n\n'),
      });
      router.push('/employer/research');
    } catch (err) {
      setError('Unable to publish this opportunity. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || !title.trim() || !company.trim();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post a Research Opportunity</h1>
          <p className="text-muted-foreground">Invite UnivAI students and lecturers to collaborate.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/employer/research">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Research
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Opportunity Details</CardTitle>
            <CardDescription>Define scope, timeline, and expected outcomes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Research Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g., Adaptive Diagnostics in Rural Clinics"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Organization</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="e.g., UnivAI Health Lab"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field">Field</Label>
                  <Select value={field} onValueChange={setField}>
                    <SelectTrigger id="field">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
                      <SelectItem value="Health Sciences">Health Sciences</SelectItem>
                      <SelectItem value="Fintech">Fintech</SelectItem>
                      <SelectItem value="Design & UX">Design & UX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  placeholder="e.g., 12 weeks"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="min-h-28"
                  placeholder="Describe the opportunity and expected outputs."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements">Preferred Background</Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(event) => setRequirements(event.target.value)}
                  className="min-h-28"
                  placeholder="List skills, prerequisites, or tools."
                />
              </div>

              <Button className="w-full" type="submit" disabled={isDisabled}>
                {isSubmitting ? 'Publishing...' : 'Publish Opportunity'}
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Research Checklist</CardTitle>
            <CardDescription>Help applicants align quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <FlaskConical className="mt-0.5 h-4 w-4 text-primary" />
              <span>Set clear outcomes and deliverables.</span>
            </div>
            <div className="flex items-start gap-2">
              <FlaskConical className="mt-0.5 h-4 w-4 text-primary" />
              <span>Describe the time commitment and support.</span>
            </div>
            <div className="flex items-start gap-2">
              <FlaskConical className="mt-0.5 h-4 w-4 text-primary" />
              <span>Specify tools, datasets, or resources provided.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
