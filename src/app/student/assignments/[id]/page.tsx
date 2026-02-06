import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignment {id}</h1>
        <p className="text-muted-foreground">Submit your work before the deadline.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission</CardTitle>
          <CardDescription>Upload your file or provide a link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Upload File</Label>
            <Input type="file" />
          </div>
          <div className="space-y-2">
            <Label>Repository Link (optional)</Label>
            <Input placeholder="https://github.com/username/project" />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/assignments">Back</Link>
          </Button>
          <Button>Submit Assignment</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
