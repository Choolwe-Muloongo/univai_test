import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AiCareerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Career Prep</h1>
        <p className="text-muted-foreground">Build your resume and prep for interviews with AI.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Builder</CardTitle>
          <CardDescription>Paste your experience and let AI improve it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Role</Label>
            <Input placeholder="e.g., Frontend Developer" />
          </div>
          <div className="space-y-2">
            <Label>Your Experience</Label>
            <Textarea placeholder="List your projects, internships, and skills..." />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Generate Resume Draft</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview Practice</CardTitle>
          <CardDescription>Get AI-generated questions and feedback.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Start Mock Interview</Button>
        </CardContent>
      </Card>
    </div>
  );
}
