import * as React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { MoneyValue } from './MoneyValue';
import { Skeleton } from './ui/skeleton';
import { cn } from '../lib/utils';

const TONE_TO_CHART = {
  networth: 'chart-4',
  income: 'chart-1',
  expenditure: 'chart-2',
  investment: 'chart-3',
};

export function StatTile({
  tone = 'networth',
  label,
  meta,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
  size = 'lg',
  className,
}) {
  const chartClass = `text-${TONE_TO_CHART[tone]}`;
  const bgClass = `bg-${TONE_TO_CHART[tone]}/10`;
  const borderClass = `border-${TONE_TO_CHART[tone]}/20`;

  if (loading) {
    return (
      <div className={cn('surface-card p-5', className)}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-32" />
        <Skeleton className="mt-3 h-3 w-20" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm',
        className,
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 origin-left',
          `bg-${TONE_TO_CHART[tone]}`,
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {meta ? (
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
              {meta}
            </p>
          ) : null}
          <p className="text-sm font-medium text-foreground">{label}</p>
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              bgClass,
              chartClass,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div className="mt-4">
        <MoneyValue
          value={value}
          size={size}
          negative={value < 0}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : (
          <span />
        )}
        {trend ? <TrendPill trend={trend} /> : null}
      </div>
    </div>
  );
}

function TrendPill({ trend }) {
  if (trend == null) return null;
  const { delta, period } = trend;
  const positive = delta >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  const tone = positive ? 'text-chart-1' : 'text-chart-2';
  const bg = positive ? 'bg-chart-1/10' : 'bg-chart-2/10';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        bg,
        tone,
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(delta).toFixed(1)}%
      {period ? <span className="text-muted-foreground">vs {period}</span> : null}
    </span>
  );
}
