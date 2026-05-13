import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CommunityGroupsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
        <p className="text-muted-foreground">Find study groups and communities.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Popular Groups</CardTitle>
          <CardDescription>Join a group to collaborate and share resources.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Community groups will appear once the student community module is enabled.
          </div>
          <Button asChild variant="outline">
            <Link href="/student/community/new">Start a Discussion</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
