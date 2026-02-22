import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const tools = [
  { title: 'AI Chat', description: 'Full chat experience for study help and support.', href: '/student/ai/chat' },
  { title: 'AI Tutor', description: 'Ask questions and get guided explanations.', href: '/student/ai/tutor' },
  { title: 'Lesson Companion', description: 'AI summaries and practice by lesson.', href: '/student/ai/lesson-companion' },
  { title: 'Study Plan', description: 'Personalized weekly learning plan.', href: '/student/study-plan' },
  { title: 'Virtual Lab', description: 'Practice and get instant feedback.', href: '/student/virtual-lab' },
  { title: 'Exam Prep', description: 'AI-generated practice drills.', href: '/student/ai/exam-prep' },
  { title: 'Career Prep', description: 'Resume and interview coaching.', href: '/student/ai/career' },
  { title: 'AI Notes', description: 'Auto-generated study notes.', href: '/student/ai/notes' },
];

export default function AiHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Learning Hub</h1>
        <p className="text-muted-foreground">Your personalized learning assistant across the entire program.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href} className="block">
            <Card className="h-full transition-all hover:border-primary/60 hover:shadow-lg">
              <CardHeader>
                <CardTitle>{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Open tool</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
