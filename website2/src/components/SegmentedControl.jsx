import * as React from 'react';
import { cn } from '../lib/utils';

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  disabled = false,
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-muted p-1',
        disabled && 'opacity-50',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium',
              'transition-colors disabled:pointer-events-none',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
            )}
          >
            {opt.icon && <opt.icon className="h-3 w-3" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
