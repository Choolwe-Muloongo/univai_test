'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Lightbulb, MessageCircle, Sparkles, ScrollText, Star, CheckCircle2 } from 'lucide-react';

type LessonStep = {
  id: string;
  title: string;
  type: 'read' | 'scenario' | 'check' | 'practice';
  content: string;
  options?: string[];
  answer?: string;
};

const buildSteps = (lessonTitle: string): LessonStep[] => [
  {
    id: 'read-1',
    title: 'Core Idea',
    type: 'read',
    content: `In this section you will learn the core concept behind "${lessonTitle}".`,
  },
  {
    id: 'read-2',
    title: 'Key Terms',
    type: 'read',
    content:
      'Identify the essential terms and definitions. You will see them again in the check section.',
  },
  {
    id: 'scenario-1',
    title: 'Real-World Scenario',
    type: 'scenario',
    content:
      'Imagine you are advising a university committee on this topic. What decision would you make and why?',
  },
  {
    id: 'check-1',
    title: 'Quick Check',
    type: 'check',
    content: 'Which statement best describes the main idea?',
    options: [
      'It applies only in advanced cases.',
      'It guides decisions in everyday scenarios.',
      'It is only theoretical with no practical use.',
      'It replaces human judgement entirely.',
    ],
    answer: 'It guides decisions in everyday scenarios.',
  },
  {
    id: 'practice-1',
    title: 'Apply It',
    type: 'practice',
    content:
      'Write a short summary (2-3 sentences) applying this concept to your program area.',
  },
  {
    id: 'read-3',
    title: 'Common Mistake',
    type: 'read',
    content:
      'Most learners confuse the concept with a similar term. Spot the difference and avoid the trap.',
  },
];

export function LessonFocusClient({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const steps = useMemo(() => buildSteps(lessonTitle), [lessonTitle]);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showFlashAnswer, setShowFlashAnswer] = useState(false);

  const step = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const handleCheck = () => {
    if (!step.options || !step.answer) return;
    if (selectedOption === step.answer) {
      setFeedback('Correct! You can move forward.');
    } else {
      setFeedback('Not quite. Review the concept and try again.');
    }
  };

  const canNext = step.type !== 'check' || feedback?.startsWith('Correct');

  return (
    <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{lessonTitle}</CardTitle>
                <CardDescription>Focused lesson mode · Step {stepIndex + 1} of {steps.length}</CardDescription>
              </div>
              <Badge variant="secondary">{progress}% Complete</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div>
              <p className="text-lg font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-2">{step.content}</p>
            </div>

            {step.type === 'check' && step.options && (
              <div className="space-y-3">
                <RadioGroup value={selectedOption ?? ''} onValueChange={setSelectedOption}>
                  {step.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2 rounded-lg border p-3">
                      <RadioGroupItem value={option} id={option} />
                      <Label htmlFor={option}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {feedback && (
                  <p className={`text-sm ${feedback.startsWith('Correct') ? 'text-primary' : 'text-destructive'}`}>
                    {feedback}
                  </p>
                )}
                <Button variant="outline" onClick={handleCheck} disabled={!selectedOption}>
                  Check Answer
                </Button>
              </div>
            )}

            {step.type === 'practice' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Use your own words to summarize. This will be reviewed by AI in the next release.
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/student/ai/lesson-companion/${lessonId}`}>Ask AI to Review</Link>
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              variant="outline"
              onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
              disabled={stepIndex === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => {
                setFeedback(null);
                setSelectedOption(null);
                setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
              }}
              disabled={!canNext || stepIndex === steps.length - 1}
            >
              Next
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flashcard Review</CardTitle>
            <CardDescription>Tap to reveal a simple explanation.</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => setShowFlashAnswer((prev) => !prev)}
              className="w-full rounded-lg border p-6 text-left transition hover:border-primary/60"
            >
              <p className="text-sm text-muted-foreground">Key term</p>
              <p className="text-lg font-semibold">Why this concept matters</p>
              {showFlashAnswer && (
                <p className="mt-3 text-sm text-muted-foreground">
                  It shapes decisions by turning theory into a clear action pathway students can follow.
                </p>
              )}
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Wrap-Up</CardTitle>
            <CardDescription>Quick takeaways and next step.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">You can explain the core idea in one sentence.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-1 h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">You can apply it to a real-world scenario.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/student/assignments">Go to Related Assignment</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Lesson Map</CardTitle>
            <CardDescription>Track each step.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className={index === stepIndex ? 'font-semibold' : 'text-muted-foreground'}>
                  {index + 1}. {item.title}
                </span>
                {index < stepIndex && <Badge variant="secondary">Done</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mini Scenario</CardTitle>
            <CardDescription>Apply what you learned.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-lg border p-4">
              A student proposes skipping foundational modules. What would you advise and why?
            </div>
            <Button variant="outline" className="w-full">Submit Response</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Community Notes</CardTitle>
            <CardDescription>Tips from learners in this lesson.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              “I rewrote the definition in my own words before the quiz.” — Mia
            </div>
            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              “Try explaining it to a friend; that helped me remember.” — Kofi
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Add Comment</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Help</CardTitle>
            <CardDescription>Get instant guidance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/student/ai/lesson-companion/${lessonId}`}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI Companion
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/student/ai/tutor">
                <Lightbulb className="mr-2 h-4 w-4" />
                Ask AI Tutor
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/student/community">
                <MessageCircle className="mr-2 h-4 w-4" />
                Community Help
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Extra reading and downloads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>Lesson handout</span>
              <Badge variant="outline">PDF</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>Summary notes</span>
              <Badge variant="outline">Doc</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
