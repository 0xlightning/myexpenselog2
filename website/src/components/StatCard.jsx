
import * as React from 'react';
import { MoneyValue } from './MoneyValue';
import { cn } from '../lib/utils';

/**
 * A quiet paper card. The label is a small mono eyebrow, the value
 * is the display MoneyValue. No icon, no badge, no gradient.
 * The hairline at the top registers this card against the page axis.
 */
export function StatCard({
  label,
  meta,
  value,
  description,
  className,
  size = 'lg',
  negative = false,
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-sm border border-ink/10 bg-card px-5 py-5',
        className,
      )}
    >
      <div className="ledger-rule flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink">
          {label}
        </span>
        {meta ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </div>
      <MoneyValue value={value} size={size} negative={negative} />
      {description ? (
        <span className="font-mono text-xs text-muted-foreground">{description}</span>
      ) : null}
    </div>
  );
}
