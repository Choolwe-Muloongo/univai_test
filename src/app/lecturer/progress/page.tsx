import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const students = [
  { name: 'Alice Johnson', course: 'BSc Software Development', progress: 92, status: 'On Track' },
  { name: 'Bob Williams', course: 'BSc Software Development', progress: 64, status: 'Needs Support' },
  { name: 'Diana Miller', course: 'MBA', progress: 78, status: 'On Track' },
  { name: 'Charlie Brown', course: 'Mechanical Engineering', progress: 43, status: 'At Risk' },
];

export default function LecturerProgressPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
          <p className="text-muted-foreground">Track performance and intervene early where needed.</p>
        </div>
        <Button variant="outline">Export Report</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Cohort</CardTitle>
          <CardDescription>Latest progress and engagement across your courses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {students.map((student) => (
            <div key={student.name} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/80?u=${student.name}`} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.course}</p>
                  </div>
                </div>
                <Badge variant={student.status === 'On Track' ? 'default' : student.status === 'Needs Support' ? 'secondary' : 'destructive'}>
                  {student.status}
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Course Progress</span>
                  <span>{student.progress}%</span>
                </div>
                <Progress value={student.progress} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline">Message Student</Button>
                <Button size="sm">Assign Support</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
