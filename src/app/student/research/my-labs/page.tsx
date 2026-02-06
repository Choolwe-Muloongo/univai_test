import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const labs = [
  { id: 'lab-01', title: 'AI Diagnostics Lab', role: 'Research Assistant', status: 'Active' },
  { id: 'lab-02', title: 'HCI UX Research', role: 'Contributor', status: 'Applied' },
];

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
          {labs.map((lab) => (
            <div key={lab.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{lab.title}</p>
                <p className="text-sm text-muted-foreground">{lab.role}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={lab.status === 'Active' ? 'secondary' : 'outline'}>
                  {lab.status}
                </Badge>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
