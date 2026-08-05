'use client';

import { Suspense, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthUiProvider } from '@/components/auth/auth-ui-context';
import { SessionProvider } from '@/components/auth/session-provider';
import { AuthModal } from '@/components/auth/auth-modal';
import { AuthDeepLink } from '@/components/auth/auth-deep-link';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <SessionProvider>
        <AuthUiProvider>
          {children}
          <AuthModal />
          <Suspense fallback={null}>
            <AuthDeepLink />
          </Suspense>
        </AuthUiProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
