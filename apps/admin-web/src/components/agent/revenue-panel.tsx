'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { fetchRevenue, type RevenueReport } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Period = 'day' | 'week' | 'month' | 'all';

function rangeFor(period: Period): { from?: string; to?: string } {
  if (period === 'all') return {};
  const to = new Date();
  const from = new Date(to);
  if (period === 'day') from.setHours(0, 0, 0, 0);
  if (period === 'week') from.setDate(from.getDate() - 7);
  if (period === 'month') from.setMonth(from.getMonth() - 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function RevenuePanel() {
  const t = useTranslations('revenue');
  const { accessToken } = useAdminAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(() => rangeFor(period), [period]);

  useEffect(() => {
    if (!accessToken) return;
    void fetchRevenue(accessToken, range)
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'));
  }, [accessToken, range]);

  const periods: Period[] = ['day', 'week', 'month', 'all'];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <span className="self-center text-xs uppercase tracking-[0.16em] text-[var(--vp-muted)]">
          {t('period')}
        </span>
        {periods.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? 'primary' : 'secondary'}
            onClick={() => setPeriod(p)}
          >
            {t(p)}
          </Button>
        ))}
      </div>

      {error ? (
        <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {report ? (
        <>
          <div className="dash-panel p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--vp-muted)]">
              {t('platformTotal')}
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Stat label={t('deposits')} value={`$${report.totals.deposits}`} accent />
              <Stat label={t('withdrawals')} value={`$${report.totals.withdrawals}`} />
              <Stat label={t('net')} value={`$${report.totals.net}`} accent />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {report.rooms.map((room) => (
              <div key={room.roomSlug} className="dash-panel p-5">
                <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
                  {room.name}
                </h3>
                <p className="text-xs text-[var(--vp-muted)]">{room.roomSlug}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label={t('deposits')} value={`$${room.deposits}`} />
                  <Row label={t('withdrawals')} value={`$${room.withdrawals}`} />
                  <Row label={t('net')} value={`$${room.net}`} highlight />
                </dl>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--vp-muted)]">…</p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--vp-muted)]">{label}</p>
      <p
        className={
          accent
            ? 'mt-1 text-2xl text-[var(--vp-accent-bright)]'
            : 'mt-1 text-2xl text-[var(--vp-fg)]'
        }
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--vp-muted)]">{label}</dt>
      <dd className={highlight ? 'text-[var(--vp-accent-bright)]' : 'text-[var(--vp-fg)]'}>
        {value}
      </dd>
    </div>
  );
}
