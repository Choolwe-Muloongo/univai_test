'use client';

import { useActionState, useFormStatus } from 'react';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { aiTutorAction } from '@/app/(app)/actions';
import { Loader2, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Thinking...
        </>
      ) : (
        'Ask AI Tutor'
      )}
    </Button>
  );
}

export default function TutorPage() {
  const initialState = { message: null, answer: null, errors: null };
  const [state, dispatch] = useActionState(aiTutorAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message === 'Success') {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">AI Tutor</CardTitle>
          <CardDescription>
            Stuck on a concept? Paste the relevant course material and ask your question.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.answer && (
            <div className="mb-6 flex items-start gap-4 rounded-lg border bg-muted/50 p-4">
               <Avatar>
                <AvatarFallback className='bg-primary text-primary-foreground'><Sparkles className="h-5 w-5"/></AvatarFallback>
               </Avatar>
              <div className="prose prose-invert max-w-none">
                <p className="text-foreground">{state.answer}</p>
              </div>
            </div>
          )}
          <form ref={formRef} action={dispatch} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="courseMaterial">Course Material</Label>
              <Textarea
                id="courseMaterial"
                name="courseMaterial"
                placeholder="Paste relevant text from your course here..."
                className="min-h-32"
                required
              />
              {state.errors?.courseMaterial && (
                <p className="text-sm text-destructive">{state.errors.courseMaterial}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Your Question</Label>
              <Textarea
                id="question"
                name="question"
                placeholder="e.g., Can you explain this concept in simpler terms?"
                className="min-h-24"
                required
              />
              {state.errors?.question && (
                <p className="text-sm text-destructive">{state.errors.question}</p>
              )}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
