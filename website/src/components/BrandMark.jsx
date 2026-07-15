
import * as React from 'react';
import { Wallet } from 'lucide-react';
import { cn } from '../lib/utils';

export function BrandMark({ className, showWordmark = true, size = 'default' }) {
  const config = {
    sm: { square: 'h-7 w-7', icon: 'h-3.5 w-3.5', text: 'text-sm' },
    default: { square: 'h-8 w-8', icon: 'h-4 w-4', text: 'text-base' },
    lg: { square: 'h-11 w-11', icon: 'h-5 w-5', text: 'text-2xl' },
  }[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs',
          config.square,
        )}
        aria-hidden
      >
        <Wallet className={config.icon} />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            'font-display tracking-tight text-foreground',
            config.text,
          )}
        >
          myexpense<span className="text-muted-foreground">·</span>log
        </span>
      ) : null}
    </span>
  );
}
