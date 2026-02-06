import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Target } from 'lucide-react';

const insights = [
  {
    title: 'AI Mastery Gap',
    detail: 'You are 18% below target in Database Queries.',
    action: '/student/ai',
  },
  {
    title: 'Momentum Boost',
    detail: 'Complete two lessons this week to stay ahead.',
    action: '/student/lessons',
  },
  {
    title: 'Assessment Risk',
    detail: 'Programming Lab 1 is due in 4 days.',
    action: '/student/assignments',
  },
];

export default function DashboardInsightsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">Actionable AI insights based on your activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Focus Score</CardTitle>
            <CardDescription>This week</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <TrendingUp className="h-5 w-5 text-primary" />
            82%
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Tasks</CardTitle>
            <CardDescription>Ready to start</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">4</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal Progress</CardTitle>
            <CardDescription>Semester goals</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-2xl font-bold">
            <Target className="h-5 w-5 text-primary" />
            64%
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>Complete these to improve your outcome.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.title} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.detail}</p>
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link href={insight.action}>Open</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>AI Snapshot</CardTitle>
          <CardDescription>High-impact summary of your week.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">Strong: Python Fundamentals</Badge>
          <Badge variant="secondary">Need Focus: Database Queries</Badge>
          <Badge variant="secondary">Next: AI Foundations quiz</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
