'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/api/client';
import { Loader2 } from 'lucide-react';
import { useAiContext } from '@/lib/ai-context';

export default function AiCareerPage() {
  const context = useAiContext();
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState('');
  const [resumeDraft, setResumeDraft] = useState('');
  const [loadingResume, setLoadingResume] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [loadingInterview, setLoadingInterview] = useState(false);

  const generateResume = async () => {
    if (!targetRole.trim() || !experience.trim()) return;
    setLoadingResume(true);
    try {
      if (!API_BASE_URL) {
        setResumeDraft('AI is not connected yet. Configure NEXT_PUBLIC_API_BASE_URL to enable live responses.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create a resume draft for the role ${targetRole}. Use this experience: ${experience}. Provide bullet points and strong action verbs.`,
          mode: 'summary',
          context,
        }),
      });
      const data = await response.json();
      setResumeDraft(data.text || 'No resume draft returned.');
    } catch (error) {
      console.error(error);
      setResumeDraft('Unable to generate resume draft.');
    } finally {
      setLoadingResume(false);
    }
  };

  const startPracticeInterview = async () => {
    if (!targetRole.trim()) return;
    setLoadingInterview(true);
    try {
      if (!API_BASE_URL) {
        setInterviewNotes('AI is not connected yet. Configure NEXT_PUBLIC_API_BASE_URL to enable live responses.');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create 5 interview questions for a ${targetRole} candidate and include short guidance on how to answer.`,
          mode: 'tutor',
          context,
        }),
      });
      const data = await response.json();
      setInterviewNotes(data.text || 'No questions returned.');
    } catch (error) {
      console.error(error);
      setInterviewNotes('Unable to generate interview questions.');
    } finally {
      setLoadingInterview(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Career Prep</h1>
        <p className="text-muted-foreground">Build your resume and prep for interviews with AI.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Builder</CardTitle>
          <CardDescription>Paste your experience and let AI improve it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Role</Label>
            <Input
              placeholder="e.g., Frontend Developer"
              value={targetRole}
              onChange={(event) => setTargetRole(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Your Experience</Label>
            <Textarea
              placeholder="List your projects, internships, and skills..."
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
            />
          </div>
          {resumeDraft && <Textarea value={resumeDraft} readOnly className="min-h-40" />}
        </CardContent>
        <CardFooter>
          <Button onClick={generateResume} disabled={loadingResume}>
            {loadingResume ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Resume Draft
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview Practice</CardTitle>
          <CardDescription>Get AI-generated questions and feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={startPracticeInterview} disabled={loadingInterview}>
            {loadingInterview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Start Practice Interview
          </Button>
          {interviewNotes && <Textarea value={interviewNotes} readOnly className="min-h-32" />}
        </CardContent>
      </Card>
    </div>
  );
}

