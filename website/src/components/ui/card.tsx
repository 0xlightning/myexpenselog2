import * as React from 'react';
import { cn } from '../../lib/utils';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

function join(...classes: Array<string | undefined>): string {
  return cn(...(classes as Parameters<typeof cn>));
}

export const Card = React.forwardRef<HTMLDivElement, DivProps>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={join(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
      {...props}
    />
  );
});

export const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={join('flex flex-col gap-1.5 p-6', className)}
        {...props}
      />
    );
  },
);

export const CardTitle = React.forwardRef<HTMLDivElement, DivProps>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={join(
          'text-lg font-semibold leading-none tracking-tight',
          className,
        )}
        {...props}
      />
    );
  },
);

export const CardDescription = React.forwardRef<HTMLDivElement, DivProps>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={join('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  },
);

export const CardContent = React.forwardRef<HTMLDivElement, DivProps>(
  function CardContent({ className, ...props }, ref) {
    return (
      <div ref={ref} className={join('p-6 pt-0', className)} {...props} />
    );
  },
);

export const CardFooter = React.forwardRef<HTMLDivElement, DivProps>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={join('flex items-center p-6 pt-0', className)}
        {...props}
      />
    );
  },
);
