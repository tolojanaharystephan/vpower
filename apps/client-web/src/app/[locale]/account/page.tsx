import { setRequestLocale } from 'next-intl/server';
import { AccountPanel } from '@/components/account/account-panel';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AccountPanel />;
}
