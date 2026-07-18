
import * as React from 'react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  children,
  className,
}) {
  return (
    <header
      className={cn(
        'flex flex-col gap-6 pb-2 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {Icon ? (
          <div
            className={cn(
              'hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              'bg-primary/10 text-primary sm:flex',
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          {eyebrow ? (
            <Badge variant="outline" className="w-fit">
              {eyebrow}
            </Badge>
          ) : null}
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl md:text-5xl text-balance">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base text-balance">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </header>
  );
}
