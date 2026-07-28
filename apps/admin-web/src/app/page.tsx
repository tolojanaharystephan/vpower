import { redirect } from 'next/navigation';

/** Fallback if middleware does not negotiate locale on `/`. */
export default function RootPage() {
  redirect('/fr');
}
