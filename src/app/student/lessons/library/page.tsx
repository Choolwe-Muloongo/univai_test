import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const categories = [
  { label: 'AI Foundations', total: 6 },
  { label: 'Programming Basics', total: 8 },
  { label: 'Databases', total: 4 },
  { label: 'Professional Skills', total: 5 },
];

export default function LessonsLibraryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lesson Library</h1>
        <p className="text-muted-foreground">Explore lessons by topic.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Filter lessons by focus area.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <div key={category.label} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-semibold">{category.label}</p>
                <p className="text-sm text-muted-foreground">{category.total} lessons</p>
              </div>
              <Badge variant="secondary">Browse</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
