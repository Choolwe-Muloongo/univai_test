import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PlatformPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
};

export function PlatformPage({
  eyebrow,
  title,
  description,
  items,
  actionHref,
  actionLabel = 'Open',
  children,
}: PlatformPageProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-normal text-primary">{eyebrow}</p>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="max-w-3xl text-muted-foreground">{description}</p>
      </section>

      {children ?? (
        <Card>
          <CardHeader>
            <CardTitle>Operational Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((item) => (
                <div key={item} className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
            {actionHref ? (
              <Button asChild variant="outline">
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
