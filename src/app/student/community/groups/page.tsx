import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const groups = [
  { name: 'Frontend Builders', members: 124, status: 'Joined' },
  { name: 'AI & Data Club', members: 98, status: 'Join' },
  { name: 'Product Designers', members: 65, status: 'Join' },
];

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
          {groups.map((group) => (
            <div key={group.name} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{group.name}</p>
                <p className="text-sm text-muted-foreground">{group.members} members</p>
              </div>
              {group.status === 'Joined' ? (
                <Badge variant="secondary">Joined</Badge>
              ) : (
                <Button variant="outline" size="sm">Join</Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
