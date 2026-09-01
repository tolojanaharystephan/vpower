import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BrandMark } from '@/components/brand/brand-mark';
import { BrandWordmark } from '@/components/brand/brand-wordmark';

export async function SiteFooter() {
  const t = await getTranslations('footer');
  const brand = await getTranslations('brand');
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('colExplore'),
      links: [{ href: '/providers' as const, label: t('providers') }],
    },
    {
      title: t('colSupport'),
      links: [
        { href: '/help' as const, label: t('help') },
        { href: '/support' as const, label: t('support') },
        { href: '/faq' as const, label: t('faq') },
      ],
    },
  ] as const;

  return (
    <footer className="relative overflow-hidden border-t border-[rgba(255,255,255,0.08)] bg-[#08080c]">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-56 w-56 rounded-full bg-[rgba(46,163,242,0.1)] blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr_1fr_1fr] lg:gap-10">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <BrandMark className="h-9 w-9" />
              <BrandWordmark
                name="VPower"
                className="font-[family-name:var(--font-display)] text-xl tracking-[0.06em] text-[var(--vp-accent)]"
              />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[var(--vp-muted)]">
              {t('blurb')}
            </p>
            <a
              href="mailto:hello@vpower777.com"
              className="mt-6 inline-block text-sm text-[var(--vp-fg)] transition hover:text-[var(--vp-accent)]"
            >
              hello@vpower777.com
            </a>
            <div className="mt-6 flex items-center gap-3">
              {(['X', 'IG', 'YT'] as const).map((label) => (
                <span
                  key={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] text-[10px] font-semibold tracking-wider text-[var(--vp-muted)]"
                  title={t('socialSoon')}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--vp-fg)]">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--vp-muted)] transition hover:text-[var(--vp-fg)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--vp-fg)]">
              {t('colLegal')}
            </p>
            <ul className="mt-5 space-y-3">
              <li>
                <span className="text-sm text-[var(--vp-muted)]">{t('responsible')}</span>
              </li>
              <li>
                <span className="text-sm text-[var(--vp-muted)]/55" title={t('comingSoon')}>
                  {t('terms')}
                </span>
              </li>
              <li>
                <span className="text-sm text-[var(--vp-muted)]/55" title={t('comingSoon')}>
                  {t('privacy')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[rgba(255,255,255,0.08)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--vp-muted)]">
            © {year} {brand('name')}. {t('rights')}
          </p>
          <p className="text-xs text-[var(--vp-muted)]/70">{brand('tagline')}</p>
        </div>
      </div>

      <div className="footer-watermark" aria-hidden>
        <BrandWordmark name="VPower" />
      </div>
    </footer>
  );
}
