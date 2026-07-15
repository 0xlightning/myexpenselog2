
import * as React from 'react';
import { availableYears, breakdownByCategory, inRange, netWorth } from './derive';
import { KIND_META } from '../records/kindMeta';
import { useAppSelector } from '../../app/hooks';
import { PageHeader } from '../../components/PageHeader';
import { StatTile } from '../../components/StatTile';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import { SegmentedControl } from '../../components/SegmentedControl';

function formatAmount(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function Dashboard() {
  const income = useAppSelector((s) => s.income);
  const expenditure = useAppSelector((s) => s.expenditure);
  const investments = useAppSelector((s) => s.investments);

  const isLoading =
    income.status !== 'ready' ||
    expenditure.status !== 'ready' ||
    investments.status !== 'ready';

  const incomeRecs = income.records.map((r) => ({
    id: r.id,
    amount: r.amount,
    date: r.date,
    notes: r.notes,
  }));

  const expRecs = expenditure.records.map((r) => ({
    id: r.id,
    amount: r.amount,
    date: r.date,
    notes: r.notes,
  }));

  const invRecs = investments.records.map((r) => ({
    id: r.id,
    amount: r.amount,
    date: r.date,
    notes: r.notes,
  }));

  const nw = netWorth(incomeRecs, expRecs, invRecs);

  const years = React.useMemo(
    () => availableYears(incomeRecs, expRecs, invRecs),
    [incomeRecs, expRecs, invRecs],
  );

  const [range, setRange] = React.useState({ mode: 'lifetime' });

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Today"
        title="Overview"
        description="Income, expenditure, and investments — at a glance."
      >
        <SegmentedControl
          options={[
            { value: 'lifetime', label: 'Lifetime' },
            { value: 'yearly', label: 'Yearly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
          value={range.mode}
          onChange={(v) => {
            if (v === 'lifetime') {
              setRange({ mode: 'lifetime' });
            } else if (v === 'yearly') {
              setRange({ mode: 'yearly', year: years[0] });
            } else {
              setRange({ mode: 'monthly', year: years[0], month: new Date().getUTCMonth() });
            }
          }}
        />
      </PageHeader>

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      ) : (
        <>
          {/* Hero Net Worth Card */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Net Worth
                </h3>
                <div className="font-display text-4xl lg:text-5xl tracking-tight text-foreground">
                  {formatAmount(nw.total)}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Income − Expenditure − Investment
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="h-full w-full rounded-xl bg-gradient-to-r from-chart-4/10 to-chart-4/2 p-6 flex items-center justify-center">
                  <span className="text-6xl font-bold text-chart-4 tracking-tight">
                    {formatAmount(nw.total)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Row */}
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile
              tone="income"
              label="Income"
              value={nw.income}
              meta={range.mode === 'lifetime' ? 'Lifetime' : `${range.year || 'Y'}`}
              description={`${incomeRecs.length} ${incomeRecs.length === 1 ? 'entry' : 'entries'}`}
              icon={() => null}
            />
            <StatTile
              tone="expenditure"
              label="Expenditure"
              value={-nw.expenditure}
              meta={range.mode === 'lifetime' ? 'Lifetime' : `${range.year || 'Y'}`}
              description={`${expRecs.length} ${expRecs.length === 1 ? 'entry' : 'entries'}`}
              icon={() => null}
            />
            <StatTile
              tone="investment"
              label="Investment"
              value={-nw.investments}
              meta={range.mode === 'lifetime' ? 'Lifetime' : `${range.year || 'Y'}`}
              description={`${invRecs.length} ${invRecs.length === 1 ? 'entry' : 'entries'}`}
              icon={() => null}
            />
          </section>

          {/* Breakdown by Category */}
          <section className="grid gap-6 md:grid-cols-3">
            <BreakdownCard
              kind="income"
              records={incomeRecs}
              range={range}
            />
            <BreakdownCard
              kind="expenditure"
              records={expRecs}
              range={range}
            />
            <BreakdownCard
              kind="investment"
              records={invRecs}
              range={range}
            />
          </section>
        </>
      )}
    </div>
  );
}

function BreakdownCard({ kind, records, range }) {
  const meta = KIND_META[kind];
  const categories = useAppSelector((s) => {
    switch (kind) {
      case 'income': return s.income.sources;
      case 'expenditure': return s.expenditure.categories;
      case 'investment': return s.investments.categories;
      default: return [];
    }
  });

  const filtered = records.filter((r) => inRange(r, range));
  const items = breakdownByCategory(filtered, categories, kind);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-foreground">{meta.label}</h4>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? 'category' : 'categories'}
        </span>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title={`No ${meta.plural}`}
          description={`No ${meta.plural} in this range`}
          className="py-6"
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.categoryId || `other`} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="font-mono text-sm text-foreground">{formatAmount(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}