import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpenCheck } from 'lucide-react';

const notes = [
  {
    id: 'note-1',
    title: 'Database Normalization Summary',
    tags: ['SQL', 'Databases'],
    updated: 'Feb 1, 2026',
  },
  {
    id: 'note-2',
    title: 'Python Control Flow Cheatsheet',
    tags: ['Python'],
    updated: 'Jan 28, 2026',
  },
  {
    id: 'note-3',
    title: 'AI Foundations Highlights',
    tags: ['AI'],
    updated: 'Jan 20, 2026',
  },
];

export default function AiNotesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Notes</h1>
        <p className="text-muted-foreground">
          Auto-generated summaries and key takeaways from your lessons.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Notes</CardTitle>
          <CardDescription>Find insights fast.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search by topic or module" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notes</CardTitle>
          <CardDescription>AI-generated highlights from your activity.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <BookOpenCheck className="mt-1 h-4 w-4 text-primary" />
                <div>
                  <p className="font-semibold">{note.title}</p>
                  <p className="text-sm text-muted-foreground">Updated {note.updated}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                <Button variant="outline" size="sm">
                  Open
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
