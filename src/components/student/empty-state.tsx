import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {description ? <p>{description}</p> : null}
        {action ? <div>{action}</div> : null}
      </CardContent>
    </Card>
  );
}
