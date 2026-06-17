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
  const text = message ?? label ?? 'Loading...';

  return (
    <Card aria-live="polite" role="status">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-64 max-w-full animate-pulse rounded bg-muted/80" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-20 animate-pulse rounded-xl bg-muted/50" />
          <div className="h-20 animate-pulse rounded-xl bg-muted/50" />
          <div className="h-20 animate-pulse rounded-xl bg-muted/50" />
        </div>
        <p className="text-sm text-muted-foreground">{text}</p>
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
