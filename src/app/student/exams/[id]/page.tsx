import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam {id}</h1>
        <p className="text-muted-foreground">Review requirements before starting.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eligibility</CardTitle>
          <CardDescription>AI proctoring requires camera access.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span>Status</span>
          <Badge>Eligible</Badge>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/exams">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/student/program/semester/1/exam">Start Exam</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
