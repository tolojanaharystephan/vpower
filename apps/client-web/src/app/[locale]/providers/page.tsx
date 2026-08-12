import { setRequestLocale } from 'next-intl/server';
import { PortalHub } from '@/components/portal/portal-hub';

export default async function ProvidersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PortalHub />;
}
