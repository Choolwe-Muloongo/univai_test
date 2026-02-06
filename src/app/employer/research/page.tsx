import Link from 'next/link';
import { PlusCircle, FlaskConical } from 'lucide-react';
import { getResearchOpportunities } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function EmployerResearchPage() {
  const opportunities = await getResearchOpportunities();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Research Postings</h1>
          <p className="text-muted-foreground">
            Collaborate with UnivAI faculty and students on applied research.
          </p>
        </div>
        <Button asChild>
          <Link href="/employer/research/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Post Research
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((opp) => (
          <Card key={opp.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{opp.title}</CardTitle>
              <CardDescription>{opp.company}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm text-muted-foreground">
              <Badge variant="secondary">{opp.field}</Badge>
              <p className="line-clamp-3">{opp.description}</p>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                12 active applicants
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/employer/research/${opp.id}`}>Manage Posting</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
