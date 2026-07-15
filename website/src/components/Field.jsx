import * as React from 'react';
import { cn } from '../lib/utils';
import { Label } from './ui/label';

export const Field = React.forwardRef(function Field(
  { label, htmlFor, error, hint, required, className, children },
  ref,
) {
  return (
    <div className={cn('flex flex-col space-y-1.5', className)} ref={ref}>
      {label ? (
        <Label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-sm font-medium text-foreground"
        >
          {label}
          {required ? (
            <span className="text-destructive" aria-hidden>*</span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
});
