import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const submissions = [
  { id: 'sub-01', title: 'Programming Lab 1', status: 'Submitted', updated: 'Feb 1, 2026' },
  { id: 'sub-02', title: 'Digital Literacy Quiz', status: 'Graded', updated: 'Jan 28, 2026' },
  { id: 'sub-03', title: 'Database Worksheet', status: 'Draft', updated: 'Jan 25, 2026' },
];

export default function AssignmentSubmissionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
        <p className="text-muted-foreground">Manage your assignment submissions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission Log</CardTitle>
          <CardDescription>All recent uploads and feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {submissions.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">Updated {item.updated}</p>
              </div>
              <Badge variant={item.status === 'Graded' ? 'secondary' : 'outline'}>
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
