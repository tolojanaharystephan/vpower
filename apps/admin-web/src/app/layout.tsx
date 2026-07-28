import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BRAND } from '@vpower777/config';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} Admin`,
    template: `%s · ${BRAND.name} Admin`,
  },
  description: 'Back-office VPower777',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
