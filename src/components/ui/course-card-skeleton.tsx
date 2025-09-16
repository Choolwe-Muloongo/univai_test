// src/components/ui/course-card-skeleton.tsx
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CourseCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="p-0">
        <Skeleton className="h-48 w-full" />
      </CardContent>
      <CardContent className="flex-1 space-y-2 pt-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}
