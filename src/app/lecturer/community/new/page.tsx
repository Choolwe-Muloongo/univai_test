import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function NewDiscussionPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Start a Discussion</h1>
          <p className="text-muted-foreground">Ask questions, share insights, and collaborate with peers.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/lecturer/community">Back to Community</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Discussion Details</CardTitle>
            <CardDescription>Be clear and specific to help others respond quickly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="e.g., Best resources for learning React?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coursework">Coursework</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="careers">Careers</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Discussion</Label>
              <Textarea id="details" className="min-h-40" placeholder="Share details, context, and what you've tried so far." />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="flex-1">Post Discussion</Button>
              <Button variant="outline" className="flex-1">Save Draft</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Posting Guidelines</CardTitle>
              <CardDescription>Keep the community valuable and supportive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Use clear titles and provide enough context.</p>
              <p>Be respectful and constructive in replies.</p>
              <p>Share resources and summarize helpful answers.</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Suggested Tags</CardTitle>
              <CardDescription>Increase discoverability.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {['#StudyTips', '#Programming', '#Nursing', '#Business', '#Research'].map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
