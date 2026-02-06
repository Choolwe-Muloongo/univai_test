import { getLeaderboard } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

export default async function LeaderboardClassPage() {
  const leaderboardData = await getLeaderboard();
  const cohort = leaderboardData.filter((student) => student.school === 'School of ICT');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cohort Leaderboard</h1>
        <p className="text-muted-foreground">Rankings inside your school cohort.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Students</CardTitle>
          <CardDescription>Updated weekly based on performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cohort.map((student) => (
            <div key={student.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {student.rank}
                </div>
                <div>
                  <p className="font-semibold">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.school}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <Badge variant="secondary">{student.points} pts</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
