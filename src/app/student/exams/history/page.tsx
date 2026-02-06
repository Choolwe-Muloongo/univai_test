import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const history = [
  { id: 'hx-01', title: 'Semester 1 Exam', date: 'Jan 18, 2026', score: '86%', status: 'Passed' },
  { id: 'hx-02', title: 'Digital Literacy Quiz', date: 'Jan 8, 2026', score: '74%', status: 'Passed' },
];

export default function ExamHistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exam History</h1>
        <p className="text-muted-foreground">Past exam attempts and scores.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Exams</CardTitle>
          <CardDescription>Results logged in your record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.date}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.score}</p>
                <Badge variant="secondary">{item.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
