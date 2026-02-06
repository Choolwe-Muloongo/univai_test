import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default async function LessonCompanionPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lesson Companion</h1>
        <p className="text-muted-foreground">AI assistance for lesson {lessonId}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Summary</CardTitle>
          <CardDescription>Key concepts distilled for quick revision.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This summary highlights the most important concepts, definitions, and examples from the lesson.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ask the AI</CardTitle>
          <CardDescription>Ask a question about the lesson.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="Ask about concepts, examples, or practice questions..." />
        </CardContent>
        <CardFooter>
          <Button>Send Question</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
