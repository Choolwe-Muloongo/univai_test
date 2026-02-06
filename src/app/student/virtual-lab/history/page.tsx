import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const history = [
  { id: 'lab-001', title: 'Python Debugging Lab', date: 'Jan 20, 2026', status: 'Completed' },
  { id: 'lab-002', title: 'Web Dev Lab', date: 'Jan 12, 2026', status: 'Completed' },
  { id: 'lab-003', title: 'SQL Practice', date: 'Jan 5, 2026', status: 'Missed' },
];

export default function VirtualLabHistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lab History</h1>
        <p className="text-muted-foreground">Past lab participation and results.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Sessions</CardTitle>
          <CardDescription>Review your lab participation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.date}</p>
              </div>
              <Badge variant={item.status === 'Missed' ? 'destructive' : 'secondary'}>
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
