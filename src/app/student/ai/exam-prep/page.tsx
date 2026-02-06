import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const drills = [
  { id: 'prep-1', title: 'Semester 1 Foundations', questions: 25 },
  { id: 'prep-2', title: 'Python Basics', questions: 20 },
  { id: 'prep-3', title: 'AI Fundamentals', questions: 15 },
];

export default function AiExamPrepPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Exam Prep</h1>
        <p className="text-muted-foreground">Practice with AI-generated drills and instant feedback.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {drills.map((drill) => (
          <Card key={drill.id}>
            <CardHeader>
              <CardTitle>{drill.title}</CardTitle>
              <CardDescription>{drill.questions} questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Drill</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
