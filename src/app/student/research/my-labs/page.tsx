import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ResearchMyLabsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Labs</h1>
        <p className="text-muted-foreground">Track your active research involvement.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research Activity</CardTitle>
          <CardDescription>Applications and current lab roles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No lab activity yet. Apply for a research opportunity to see it here.
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/research">Browse Research</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
