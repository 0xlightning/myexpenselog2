import * as React from 'react';
import { cn } from '../../lib/utils';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton = React.forwardRef<HTMLDivElement, DivProps>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn('animate-pulse rounded-md bg-muted', className)}
        {...props}
      />
    );
  },
);
