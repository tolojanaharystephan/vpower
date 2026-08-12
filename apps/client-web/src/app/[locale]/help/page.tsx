import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CircleHelp, Gamepad2, Headphones } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CareAtmosphere } from '@/components/help/care-atmosphere';

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('help');

  const cards = [
    {
      href: '/faq' as const,
      icon: CircleHelp,
      title: t('cardFaqTitle'),
      body: t('cardFaqBody'),
      cta: t('cardFaqCta'),
    },
    {
      href: '/providers' as const,
      icon: Gamepad2,
      title: t('cardGamesTitle'),
      body: t('cardGamesBody'),
      cta: t('cardGamesCta'),
    },
    {
      href: '/support' as const,
      icon: Headphones,
      title: t('cardSupportTitle'),
      body: t('cardSupportBody'),
      cta: t('cardSupportCta'),
    },
  ];

  const steps = [
    { title: t('step1Title'), body: t('step1Body') },
    { title: t('step2Title'), body: t('step2Body') },
    { title: t('step3Title'), body: t('step3Body') },
  ];

  return (
    <div className="care-shell mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <section className="care-hero">
        <div className="animate-fade-up">
          <p className="care-kicker">{t('eyebrow')}</p>
          <h1 className="care-title">{t('title')}</h1>
          <p className="care-lede">{t('subtitle')}</p>
        </div>
        <CareAtmosphere label={t('visualLabel')} className="animate-fade-up" />
      </section>

      <section className="care-path" aria-label={t('pathLabel')}>
        {steps.map((step, index) => (
          <article key={step.title} className="care-step animate-fade-up">
            <span className="care-step-index">{String(index + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-14">
        <div className="mb-6 max-w-xl">
          <h2 className="care-section-title">{t('destinationsTitle')}</h2>
          <p className="care-section-lede">{t('destinationsBody')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ href, icon: Icon, title, body, cta }) => (
            <Link key={href} href={href} className="help-card">
              <span className="help-card-icon">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2>{title}</h2>
              <p>{body}</p>
              <span className="help-card-cta">{cta}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
