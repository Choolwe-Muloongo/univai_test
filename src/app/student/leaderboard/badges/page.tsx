import { getBadges } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

export default async function LeaderboardBadgesPage() {
  const badges = await getBadges();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
        <p className="text-muted-foreground">Achievements earned during your studies.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Achievements</CardTitle>
          <CardDescription>Unlock more by completing modules and exams.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {badges.map((badge) => (
            <div key={badge.id} className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{badge.title}</p>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
                <Badge variant="secondary" className="mt-2">
                  Earned
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
