
import * as React from 'react';
import { cn } from '../lib/utils';

export function MoneyValue({
  value,
  className,
  size = 'lg',
  negative = false,
  signed = false,
  muted = false,
}) {
  const sizeClass =
    size === '2xl'
      ? 'text-5xl sm:text-6xl'
      : size === 'xl'
        ? 'text-4xl sm:text-5xl'
        : size === 'lg'
          ? 'text-2xl sm:text-3xl'
          : size === 'md'
            ? 'text-xl sm:text-2xl'
            : 'text-base sm:text-lg';
  const sign = value < 0 ? '−' : signed && value > 0 ? '+' : '';
  const abs = Math.abs(value);
  const [intPart, decPart] = formatSplit(abs);

  return (
    <span
      className={cn(
        'inline-flex items-baseline tabular-money leading-none tracking-tight',
        sizeClass,
        negative ? 'text-destructive' : muted ? 'text-muted-foreground' : 'text-foreground',
        className,
      )}
    >
      <span className="font-display">{sign}</span>
      <span className="font-display">{intPart}</span>
      {decPart ? (
        <>
          <span className="font-mono text-[0.55em] text-muted-foreground">.</span>
          <span className="font-mono text-[0.55em] text-muted-foreground">
            {decPart}
          </span>
        </>
      ) : null}
    </span>
  );
}

function formatSplit(n) {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
  const [intPart, decPart] = formatted.split('.');
  return [intPart, decPart || ''];
}
