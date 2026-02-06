import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const modules = [
  { id: 'cs101-sem1-1', title: 'Introduction to ICT', credits: 3 },
  { id: 'cs101-sem1-2', title: 'Fundamentals of Programming', credits: 3 },
  { id: 'cs101-sem1-3', title: 'Mathematics for CS I', credits: 3 },
  { id: 'cs101-sem1-4', title: 'Introduction to AI', credits: 3 },
];

export default function EnrollmentModulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Select Semester Modules</h1>
        <p className="text-muted-foreground">Choose the modules you want to register for this semester.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Semester 1 Modules</CardTitle>
          <CardDescription>Default modules are pre-selected for your program.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {modules.map((module) => (
            <div key={module.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">{module.title}</p>
                <p className="text-sm text-muted-foreground">{module.credits} credits</p>
              </div>
              <Button size="sm" variant="outline">Selected</Button>
            </div>
          ))}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/enroll">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/student/enroll/payment">Continue to Payment</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
