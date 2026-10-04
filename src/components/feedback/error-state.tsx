'use client';

import { TriangleAlertIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ErrorStateProps = {
  title: string;
  description: string;
  onRetry: () => void;
};

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-destructive/40 px-6 py-12 text-center">
      <TriangleAlertIcon aria-hidden className="size-8 text-destructive" />
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
