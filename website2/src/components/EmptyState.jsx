import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../lib/utils';

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
  dashed = false,
  className,
}) {
  const content = (
    <div
      className={cn(
        'flex flex-col items-center gap-4 px-4 py-12 text-center',
        !dashed && className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="font-display text-2xl tracking-tight text-foreground">
          {title}
        </p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
  if (dashed) {
    return (
      <div
        className={cn(
          'border border-dashed border-border rounded-xl bg-card/40',
          className,
        )}
      >
        {content}
      </div>
    );
  }
  return content;
}
