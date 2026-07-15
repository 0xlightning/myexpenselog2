import * as React from 'react';
import { AlertTriangle, Wallet, TrendingUp, TrendingDown, X, Plus, Pencil, Trash2 } from 'lucide-react';
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

const ACTION_ICONS = {
  addCategory: Plus,
  editCategory: Pencil,
  deleteCategory: Trash2,
  deleteRecord: Trash2,
};

const ACTION_COLORS = {
  addCategory: 'bg-stat-income/15 text-chart-1',
  editCategory: 'bg-chart-4/15 text-chart-4',
  deleteCategory: 'bg-chart-2/15 text-chart-2',
  deleteRecord: 'bg-destructive/15 text-destructive',
};

function ActionIcon({ type, className }) {
  const Icon = ACTION_ICONS[type];
  if (!Icon) return null;
  const colorClass = ACTION_COLORS[type] || 'bg-muted text-muted-foreground';
  return (
    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', colorClass, className)}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

function AlertDialog({ open, onOpenChange, type, title, description, confirmLabel = 'Continue', cancelLabel = 'Cancel', onConfirm, variant = 'danger' }) {
  const onOpenChangeBounded = React.useCallback(
    (val) => {
      if (!val) onOpenChange();
    },
    [onOpenChange],
  );

  React.useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => {
      if (e.key === 'Escape') onOpenChange();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open, onOpenChange]);

  if (!open) return null;

  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return {
          icon: 'bg-stat-income/15 text-chart-1',
          title: 'text-chart-1',
          border: 'border-chart-1/20',
        };
      case 'warning':
        return {
          icon: 'bg-chart-4/15 text-chart-4',
          title: 'text-chart-4',
          border: 'border-chart-4/20',
        };
      case 'danger':
      default:
        return {
          icon: 'bg-destructive/15 text-destructive',
          title: 'text-destructive',
          border: 'border-destructive/30',
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => onOpenChange()} />
      <div className={cn("relative z-10 w-full max-w-md rounded-xl border bg-popover p-0 text-popover-foreground shadow-lg", variantClasses.border)}>
        <div className="p-6 pb-3">
          <div className="flex gap-4">
            <ActionIcon type={type} className={cn('shrink-0', variantClasses.icon)} />
            <div className="flex-1">
              <DialogTitle className={variantClasses.title}>{title}</DialogTitle>
              <DialogBody className="mt-2 text-sm text-muted-foreground">{description}</DialogBody>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange()}>{cancelLabel}</Button>
          <Button variant={variant === 'danger' ? 'destructive' : 'default'} onClick={() => onConfirm && onConfirm()}>{confirmLabel}</Button>
        </DialogFooter>
      </div>
    </div>
  );
}

export { AlertDialog };