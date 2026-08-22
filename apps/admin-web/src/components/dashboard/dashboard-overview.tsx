'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  Cpu,
  Radio,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { fetchAdminOverview, getAdminAccessToken } from '@/lib/api';
import { useAdminAuth } from '@/components/auth/admin-auth-provider';
import { BrandLoader } from '@/components/brand/brand-loader';
import { PilotChart } from '@/components/dashboard/pilot-chart';

function buildPilotSeries(usersTotal: number, labels: string[]) {
  const base = Math.max(usersTotal, 8);
  const factors = [0.42, 0.48, 0.55, 0.61, 0.7, 0.78, 0.86, 1];
  return labels.map((label, index) => ({
    label,
    value: Math.round(base * factors[index]! + (index % 3) * 1.4),
  }));
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  enabled,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  delta?: string;
  enabled?: boolean;
}) {
  const t = useTranslations('common');

  return (
    <div className="stat-card group p-5 transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(46,163,242,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--vp-muted)]">{label}</p>
          <p className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--vp-fg)]">
            {value}
          </p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(46,163,242,0.12)] text-[var(--vp-accent)] transition group-hover:bg-[rgba(46,163,242,0.2)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        {hint ? <p className="text-xs text-[var(--vp-muted)]">{hint}</p> : <span />}
        <div className="flex items-center gap-2">
          {delta ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[rgba(65,181,116,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#8fd9ad]">
              <ArrowUpRight className="h-3 w-3" />
              {delta}
            </span>
          ) : null}
          {enabled !== undefined ? (
            <span className={`status-pill ${enabled ? 'status-pill-on' : 'status-pill-off'}`}>
              {enabled ? t('on') : t('off')}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid min-h-[28rem] place-items-center">
      <BrandLoader size="lg" />
    </div>
  );
}

export function DashboardOverview() {
  const t = useTranslations('dashboard');
  const common = useTranslations('common');
  const locale = useLocale();
  const { accessToken } = useAdminAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => fetchAdminOverview(accessToken ?? getAdminAccessToken() ?? ''),
    enabled: Boolean(accessToken ?? getAdminAccessToken()),
  });

  const weekLabels = useMemo(
    () => [t('day1'), t('day2'), t('day3'), t('day4'), t('day5'), t('day6'), t('day7'), t('day8')],
    [t],
  );

  const series = useMemo(
    () => buildPilotSeries(data?.usersTotal ?? 12, weekLabels),
    [data?.usersTotal, weekLabels],
  );

  if (isLoading) return <OverviewSkeleton />;

  if (error || !data) {
    return <p className="text-sm text-red-400">{t('loadError')}</p>;
  }

  const readiness = [
    {
      label: t('payments'),
      value: data.featureFlags.paymentsEnabled ? 100 : 28,
      enabled: data.featureFlags.paymentsEnabled,
    },
    {
      label: t('liveGames'),
      value: data.featureFlags.liveGamesEnabled ? 100 : 34,
      enabled: data.featureFlags.liveGamesEnabled,
    },
    {
      label: t('translations'),
      value: data.featureFlags.translationEnabled ? 100 : 62,
      enabled: data.featureFlags.translationEnabled,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('users')}
          value={String(data.usersTotal)}
          hint={t('usersHint')}
          icon={Users}
          delta={t('usersDelta')}
        />
        <StatCard
          label={t('gameProvider')}
          value={data.gameProviderMode}
          hint={t('gameProviderHint')}
          icon={Cpu}
        />
        <StatCard
          label={t('payments')}
          value={data.featureFlags.paymentsEnabled ? t('paymentsActive') : t('paymentsInactive')}
          hint={t('featureFlagHint')}
          icon={CreditCard}
          enabled={data.featureFlags.paymentsEnabled}
        />
        <StatCard
          label={t('liveGames')}
          value={data.featureFlags.liveGamesEnabled ? t('liveAvailable') : t('liveSuspended')}
          hint={t('featureFlagHint')}
          icon={Radio}
          enabled={data.featureFlags.liveGamesEnabled}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <section className="dash-panel overflow-hidden p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent)]">
                {t('pilotEyebrow')}
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
                {t('pilotTitle')}
              </h2>
              <p className="mt-1 text-sm text-[var(--vp-muted)]">{t('pilotSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--vp-border)] bg-white/[0.03] px-3 py-1.5 text-xs text-[var(--vp-muted)]">
              <Activity className="h-3.5 w-3.5 text-[var(--vp-accent)]" />
              {t('pilotRange')}
            </div>
          </div>

          <PilotChart points={series} seriesLabel={t('pilotTitle')} />

          <div className="mt-5 grid gap-3 border-t border-[var(--vp-border)] pt-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--vp-muted)]">{t('pilotPeak')}</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
                {Math.max(...series.map((p) => p.value))}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--vp-muted)]">{t('pilotAvg')}</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-[var(--vp-fg)]">
                {Math.round(series.reduce((sum, p) => sum + p.value, 0) / series.length)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--vp-muted)]">{t('providerLabel')}</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-[var(--vp-accent)]">
                {data.gameProviderMode}
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <section className="dash-panel p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent)]">
              {t('infraEyebrow')}
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
              {t('infraTitle')}
            </h2>
            <div className="mt-5 space-y-4">
              {readiness.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-[var(--vp-muted)]">{item.label}</span>
                    <span className={`status-pill ${item.enabled ? 'status-pill-on' : 'status-pill-off'}`}>
                      {item.enabled ? common('on') : common('off')}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0693e3] to-[var(--vp-accent)] transition-all duration-700"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-[var(--vp-muted)]">
              {common('syncedAt', {
                date: new Date(data.timestamp).toLocaleString(locale === 'en' ? 'en-US' : 'fr-FR'),
              })}
            </p>
          </section>

          <section className="dash-panel p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--vp-accent)]">
              {t('roadmapEyebrow')}
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--vp-fg)]">
              {t('roadmapTitle')}
            </h2>
            <ol className="mt-4 space-y-3">
              {[t('roadmap1'), t('roadmap2'), t('roadmap3'), t('roadmap4')].map((item, index) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-transparent bg-white/[0.02] px-3 py-2.5 text-sm text-[var(--vp-muted)] transition hover:border-[var(--vp-border)]"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[rgba(46,163,242,0.12)] text-xs font-semibold text-[var(--vp-accent)]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 leading-snug">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
