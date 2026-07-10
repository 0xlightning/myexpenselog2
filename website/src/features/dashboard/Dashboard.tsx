import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import {
  availableYears,
  breakdownByCategory,
  inRange,
  netWorth,
  type BreakdownItem,
  type DateRange,
  type RecordLike,
} from './derive';
import { KIND_META, type RecordKind } from '../records/kindMeta';
import { formatAmount } from '../../lib/dates';
import { useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';

const CHART_TOKENS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
] as const;

function asRecordLike(
  xs: Array<{ id: string; amount: number; date: string; notes: string }>,
): RecordLike[] {
  return xs.map((r) => ({
    id: r.id,
    amount: r.amount,
    date: r.date,
    notes: r.notes,
  }));
}

function BreakdownPanel({
  kind,
  records,
  range,
}: {
  kind: RecordKind;
  records: RecordLike[];
  range: DateRange;
}): JSX.Element {
  const meta = KIND_META[kind];
  const categories = useAppSelector((s: RootState) => {
    switch (kind) {
      case 'income':
        return s.income.sources;
      case 'expenditure':
        return s.expenditure.categories;
      case 'investment':
        return s.investments.categories;
    }
  });
  const filtered = records.filter((r) => inRange(r, range));
  const items = breakdownByCategory(filtered, categories, kind);
  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{meta.label}</CardTitle>
        <CardDescription>
          {items.length === 0
            ? `No ${meta.plural} in this range`
            : `${items.length} ${items.length === 1 ? 'bucket' : 'buckets'} · ${formatAmount(total)}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? null : (
          <ul className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <BreakdownRow
                key={item.categoryId ?? `other-${idx}`}
                item={item}
                total={total}
                token={CHART_TOKENS[idx % CHART_TOKENS.length]}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownRow({
  item,
  total,
  token,
}: {
  item: BreakdownItem;
  total: number;
  token: string;
}): JSX.Element {
  const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className={item.isOther ? 'text-muted-foreground italic' : ''}>
          {item.label}
        </span>
        <span className="tabular-nums">
          {formatAmount(item.amount)}{' '}
          <span className="text-xs text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${token}`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </li>
  );
}

function NetWorthCard({ value }: { value: number }): JSX.Element {
  const isNegative = value < 0;
  return (
    <Card>
      <CardHeader>
        <CardDescription>Net worth</CardDescription>
        <CardTitle
          className={
            isNegative
              ? 'text-3xl font-semibold tabular-nums text-destructive'
              : 'text-3xl font-semibold tabular-nums'
          }
        >
          {formatAmount(value)}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function RangeSelector({
  range,
  years,
  onChange,
}: {
  range: DateRange;
  years: number[];
  onChange: (next: DateRange) => void;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-md border border-input bg-background p-0.5">
        {(['lifetime', 'yearly', 'monthly'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              if (m === 'lifetime') onChange({ mode: 'lifetime' });
              else if (m === 'yearly') {
                onChange({ mode: 'yearly', year: years[0] });
              } else {
                onChange({
                  mode: 'monthly',
                  year: years[0],
                  month: new Date().getUTCMonth(),
                });
              }
            }}
            className={
              range.mode === m
                ? 'rounded px-3 py-1 text-sm font-medium bg-secondary text-secondary-foreground'
                : 'rounded px-3 py-1 text-sm text-muted-foreground hover:text-foreground'
            }
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
      {range.mode !== 'lifetime' ? (
        <>
          <select
            value={range.year}
            onChange={(e) => {
              const year = Number(e.target.value);
              if (range.mode === 'yearly') onChange({ mode: 'yearly', year });
              else onChange({ ...range, year });
            }}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {range.mode === 'monthly' ? (
            <select
              value={range.month}
              onChange={(e) => onChange({ ...range, month: Number(e.target.value) })}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(Date.UTC(2026, i, 1)).toLocaleString(undefined, {
                    month: 'long',
                  })}
                </option>
              ))}
            </select>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function Dashboard(): JSX.Element {
  const income = useAppSelector((s) => s.income);
  const expenditure = useAppSelector((s) => s.expenditure);
  const investments = useAppSelector((s) => s.investments);

  const incomeRecs = asRecordLike(income.records);
  const expRecs = asRecordLike(expenditure.records);
  const invRecs = asRecordLike(investments.records);

  const isLoading =
    income.status !== 'ready' ||
    expenditure.status !== 'ready' ||
    investments.status !== 'ready';

  const years = React.useMemo(
    () => availableYears(incomeRecs, expRecs, invRecs),
    [incomeRecs, expRecs, invRecs],
  );

  const [range, setRange] = React.useState<DateRange>({ mode: 'lifetime' });

  const nw = React.useMemo(
    () => netWorth(incomeRecs, expRecs, invRecs),
    [incomeRecs, expRecs, invRecs],
  );

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <RangeSelector range={range} years={years} onChange={setRange} />
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          <Skeleton className="h-24" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          <NetWorthCard value={nw.total} />
          <div className="grid gap-6 md:grid-cols-3">
            <BreakdownPanel kind="income" records={incomeRecs} range={range} />
            <BreakdownPanel
              kind="expenditure"
              records={expRecs}
              range={range}
            />
            <BreakdownPanel
              kind="investment"
              records={invRecs}
              range={range}
            />
          </div>
        </div>
      )}
    </div>
  );
}
