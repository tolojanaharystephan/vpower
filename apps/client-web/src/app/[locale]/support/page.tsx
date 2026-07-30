import { setRequestLocale } from 'next-intl/server';
import { SupportPanel } from '@/components/support/support-panel';

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SupportPanel />;
}
