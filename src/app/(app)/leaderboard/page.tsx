// src/app/(app)/leaderboard/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import { leaderboardData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">
          See how you stack up against your peers. Keep learning to climb the ranks!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Students</CardTitle>
          <CardDescription>Based on points earned from completing modules, high scores, and community participation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leaderboardData.map((student, index) => (
              <div key={student.id} className={`flex items-center gap-4 rounded-lg border p-4 ${index < 3 ? 'bg-muted/50' : ''}`}>
                <div className="flex items-center gap-4 w-12">
                  <span className="text-xl font-bold text-muted-foreground">#{student.rank}</span>
                  {student.rank <= 3 && <Trophy className={`w-6 h-6 ${
                      student.rank === 1 ? 'text-yellow-500' : 
                      student.rank === 2 ? 'text-slate-400' : 
                      'text-yellow-700'
                  }`} />}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatar} alt={student.name} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{student.name}</p>
                  <p className="text-sm text-muted-foreground">{student.school}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold">{student.points} pts</p>
                    <Badge variant={student.rank <= 10 ? 'default' : 'secondary'}>
                        {student.rank <=10 ? `Top ${student.rank}` : `Top ${Math.ceil(student.rank/10)*10}%`}
                    </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
