import { redirect } from 'next/navigation';

/** Promotions menu removed — use the providers portal like the reference site. */
export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/providers`);
}
