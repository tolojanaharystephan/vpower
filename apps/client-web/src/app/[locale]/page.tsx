import { setRequestLocale } from 'next-intl/server';
import { PortalHub } from '@/components/portal/portal-hub';

/** Home = provider portal (cards include each provider's own contacts). */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PortalHub />;
}
