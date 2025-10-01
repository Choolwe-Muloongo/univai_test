'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateStudyPlanAction } from '@/app/(app)/actions';
import { Loader2 } from 'lucide-react';

interface BaseGeneratorState {
  // message can be a string (error/success) or null initially
  message: string | null; 
  // errors can be an object map (for validation) or null
  errors: { [key: string]: string[] | undefined } | null;
}

// Specific state for Quiz/Exercise Generators
interface StudyPlanState extends BaseGeneratorState {
  studyPlan: string | null;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate Study Plan'
      )}
    </Button>
  );
}

export default function StudyPlanPage() {
  const initialState = { message: null, studyPlan: null, errors: null };
  const [state, dispatch] = useActionState<StudyPlanState, FormData>(generateStudyPlanAction, initialState);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Generate Your Personalized Study Plan</CardTitle>
          <CardDescription>
            Provide your learning history, goals, and available time, and our AI
            will create a tailored study plan for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="learningHistory">Learning History</Label>
              <Textarea
                id="learningHistory"
                name="learningHistory"
                placeholder="e.g., Completed CS101 with a B, strong in Python but weak in Java."
                className="min-h-24"
                required
              />
              {state.errors?.learningHistory && (
                <p className="text-sm text-destructive">{state.errors.learningHistory}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals">Learning Goals</Label>
              <Textarea
                id="goals"
                name="goals"
                placeholder="e.g., Want to become a full-stack developer, focusing on React and Node.js."
                className="min-h-24"
                required
              />
              {state.errors?.goals && (
                <p className="text-sm text-destructive">{state.errors.goals}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableTime">Available Time per Week</Label>
              <Input
                id="availableTime"
                name="availableTime"
                placeholder="e.g., 10 hours per week"
                required
              />
               {state.errors?.availableTime && (
                <p className="text-sm text-destructive">{state.errors.availableTime}</p>
              )}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your AI-Generated Plan</CardTitle>
          <CardDescription>
            Your plan will appear here once generated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.studyPlan ? (
            <div className="prose prose-invert max-w-none rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap bg-transparent p-0 font-sans text-sm text-foreground">
                {state.studyPlan}
              </pre>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-muted-foreground">Waiting for input...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
