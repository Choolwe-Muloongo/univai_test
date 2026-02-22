import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No lab history available yet. Completed sessions will appear here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
