import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type PageFeedbackProps = {
  title?: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
};

type PageLoadingProps = {
  message?: string;
  label?: string;
};

export function PageLoading({ message, label }: PageLoadingProps) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        {message ?? label ?? 'Loading...'}
      </CardContent>
    </Card>
  );
}

export function PageError({
  title = 'Data unavailable',
  message,
  actionHref,
  actionLabel = 'Go back',
}: PageFeedbackProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30">
      <CardContent className="space-y-4 p-6 text-sm text-amber-900 dark:text-amber-200">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1">{message}</p>
        </div>
        {actionHref ? (
          <Button asChild variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
