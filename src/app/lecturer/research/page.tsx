// src/app/(app)/research/page.tsx
import { ArrowRight, FlaskConical, Building } from 'lucide-react';
import Link from 'next/link';

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
import { getResearchOpportunities } from '@/lib/api';

export default async function ResearchPage() {
  const researchOpportunities = await getResearchOpportunities();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Research Hub</h1>
        <p className="text-muted-foreground">
          Explore cutting-edge research opportunities from our industry partners.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {researchOpportunities.map((opp) => (
          <Card key={opp.id} className="flex flex-col">
            <CardHeader>
                <div className='flex items-center gap-4'>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FlaskConical className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>{opp.title}</CardTitle>
                        <CardDescription className='flex items-center gap-1.5 pt-1'><Building className='w-4 h-4'/>{opp.company}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <Badge variant="secondary">
                  {opp.field}
              </Badge>
              <p className='text-muted-foreground'>{opp.description}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={`/lecturer/research/${opp.id}`}>
                  Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

    
