import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function OnboardingAiSetupPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Preferences</h1>
        <p className="text-muted-foreground">Tell UnivAI how you prefer to learn.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Learning Profile</CardTitle>
          <CardDescription>This helps AI personalize your content and pace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Learning Style</Label>
            <Select defaultValue="visual">
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visual">Visual</SelectItem>
                <SelectItem value="reading">Reading/Writing</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="kinesthetic">Hands-on</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Weekly Study Hours</Label>
            <Input type="number" defaultValue="8" />
          </div>
          <div className="space-y-2">
            <Label>Preferred Pace</Label>
            <Select defaultValue="balanced">
              <SelectTrigger>
                <SelectValue placeholder="Select pace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="gentle">Gentle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Primary Goal</Label>
            <Input placeholder="e.g., Become a software engineer" />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" asChild>
            <Link href="/student/onboarding">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/student/onboarding/orientation">Save & Continue</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
