
import * as React from 'react';
import { cn } from '../lib/utils';

export function LedgerSection({
  label,
  meta,
  description,
  children,
  className,
  action,
  right,
}) {
  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
            {label}
          </h2>
          {meta ? (
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {meta}
            </span>
          ) : null}
          {description ? (
            <span className="text-sm text-muted-foreground">{description}</span>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>
      {children}
    </section>
  );
}
