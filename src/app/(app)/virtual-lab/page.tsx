// src/app/(app)/virtual-lab/page.tsx
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { analyzeCodeAction } from '@/app/(app)/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';

const exampleCode = `# Welcome to the Virtual Lab!
# Paste your code here and get instant AI feedback.

def factorial(n):
    if n == 0:
        return 1
    else:
        # This has a bug!
        return n * factorial(n)
`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
        <Wand2 className="mr-2 h-4 w-4" />
        Analyze Code
        </>
      )}
    </Button>
  );
}

export default function VirtualLabPage() {
  const initialState = { message: null, errors: null, feedback: null, correctedCode: null };
  const [state, dispatch] = useActionState(analyzeCodeAction, initialState);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Virtual Coding Lab</CardTitle>
          <CardDescription>
            Write or paste your code below, select the language, and get instant AI-powered feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={dispatch} className="space-y-6">
            <input type="hidden" name="language" value="python" />
            <div className="space-y-2">
              <Label htmlFor="code">Code Editor</Label>
              <Textarea
                id="code"
                name="code"
                placeholder="Enter your code here"
                className="min-h-96 font-mono text-sm"
                defaultValue={exampleCode}
                required
              />
              {state.errors?.code && (
                <p className="text-sm text-destructive">{state.errors.code}</p>
              )}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'><Sparkles className='text-primary'/> AI Feedback</CardTitle>
          <CardDescription>
            The analysis of your code will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {state.feedback ? (
            <div className="space-y-6">
                <div>
                    <h3 className='font-semibold mb-2'>Feedback:</h3>
                    <div className="prose prose-sm max-w-none rounded-lg border bg-muted/50 p-4 whitespace-pre-wrap">
                       {state.feedback}
                    </div>
                </div>
                {state.correctedCode && (
                     <div>
                        <h3 className='font-semibold mb-2'>Suggested Correction:</h3>
                        <div className="prose prose-sm max-w-none rounded-lg border bg-muted/50 p-4">
                            <pre className='whitespace-pre-wrap bg-transparent p-0 m-0 font-mono text-sm'><code>{state.correctedCode}</code></pre>
                        </div>
                    </div>
                )}
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-lg border border-dashed text-center">
              <p className="text-muted-foreground">Waiting for code submission...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
