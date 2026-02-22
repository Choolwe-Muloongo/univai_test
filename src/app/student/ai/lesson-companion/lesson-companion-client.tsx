'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/api/client';
import { Loader2, Sparkles } from 'lucide-react';
import { useAiContext } from '@/lib/ai-context';

type LessonCompanionClientProps = {
  lessonId: string;
  lessonTitle: string;
  lessonContent?: string | null;
  courseId?: string | null;
  supplementalText?: string | null;
};

async function requestAi(prompt: string, mode: string, context: string) {
  if (!API_BASE_URL) {
    return 'AI is not connected yet. Configure NEXT_PUBLIC_API_BASE_URL to enable live responses.';
  }

  const response = await fetch(`${API_BASE_URL}/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, mode, context }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || 'AI request failed');
  }

  const data = await response.json();
  return data.text as string;
}

export function LessonCompanionClient({
  lessonId,
  lessonTitle,
  lessonContent,
  courseId,
  supplementalText,
}: LessonCompanionClientProps) {
  const baseContext = useAiContext();
  const [summary, setSummary] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [practice, setPractice] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [loadingPractice, setLoadingPractice] = useState(false);

  const lessonContext = useMemo(() => {
    const parts = [
      `Lesson ID: ${lessonId}`,
      `Lesson title: ${lessonTitle}`,
      courseId ? `Course: ${courseId}` : null,
      lessonContent ? `Lesson content: ${lessonContent}` : null,
      supplementalText ? `Lecturer materials: ${supplementalText}` : null,
    ];
    return parts.filter(Boolean).join('. ');
  }, [lessonId, lessonTitle, lessonContent, courseId, supplementalText]);

  const context = useMemo(() => {
    return [baseContext, lessonContext].filter(Boolean).join('. ');
  }, [baseContext, lessonContext]);

  const handleSummary = async () => {
    setLoadingSummary(true);
    try {
      const prompt = `Summarize the lesson "${lessonTitle}" for a university student. Highlight objectives, key concepts, and 3 short takeaways.`;
      const text = await requestAi(prompt, 'summary', context);
      setSummary(text.trim() || 'No summary returned.');
    } catch (error) {
      console.error(error);
      setSummary('Unable to generate a summary right now.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleQuestion = async () => {
    if (!question.trim()) return;
    setLoadingAnswer(true);
    try {
      const prompt = `Answer this question based on the lesson content: "${question}". Provide a concise, student-friendly explanation.`;
      const text = await requestAi(prompt, 'tutor', context);
      setAnswer(text.trim() || 'No answer returned.');
    } catch (error) {
      console.error(error);
      setAnswer('Unable to answer right now.');
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handlePractice = async () => {
    setLoadingPractice(true);
    try {
      const prompt = `Create 5 practice questions with answer keys for the lesson "${lessonTitle}".`;
      const text = await requestAi(prompt, 'quiz', context);
      setPractice(text.trim() || 'No practice questions returned.');
    } catch (error) {
      console.error(error);
      setPractice('Unable to generate practice questions right now.');
    } finally {
      setLoadingPractice(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lesson Companion</h1>
        <p className="text-muted-foreground">
          AI support for lesson {lessonId}. Use the tools below to study smarter.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Summary
          </CardTitle>
          <CardDescription>Key concepts distilled for quick revision.</CardDescription>
        </CardHeader>
        <CardContent>
          {summary ? (
            <Textarea value={summary} readOnly className="min-h-40" />
          ) : (
            <p className="text-sm text-muted-foreground">Generate a summary to get started.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSummary} disabled={loadingSummary}>
            {loadingSummary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Summary
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ask the AI</CardTitle>
          <CardDescription>Ask a question about this lesson.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Ask about concepts, examples, or practice questions..."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          {answer && <Textarea value={answer} readOnly className="min-h-32" />}
        </CardContent>
        <CardFooter>
          <Button onClick={handleQuestion} disabled={loadingAnswer || !question.trim()}>
            {loadingAnswer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Question
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice Questions</CardTitle>
          <CardDescription>Generate quick checks for understanding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {practice ? (
            <Textarea value={practice} readOnly className="min-h-40" />
          ) : (
            <p className="text-sm text-muted-foreground">Create a short quiz to reinforce learning.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handlePractice} disabled={loadingPractice}>
            {loadingPractice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate Practice Set
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

