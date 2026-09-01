import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Syne, Outfit, Noto_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { isLocale } from '@vpower777/config';
import { Providers } from '@/components/providers';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { routing } from '@/i18n/routing';

const display = Syne({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

const body = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600'],
});

const noto = Noto_Sans({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-noto',
  weight: ['400', '500', '600', '700'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${noto.variable}`}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
