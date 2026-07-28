import { setRequestLocale } from 'next-intl/server';

/** Auth opens as a modal on the home page via AuthDeepLink. */
export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto flex min-h-[60svh] max-w-7xl items-center justify-center px-4 pt-28">
      <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--vp-accent)]/40" aria-hidden />
    </div>
  );
}
