'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/components/auth/session-provider';
import { getWallets, type RoomWallet } from '@/lib/api';

export function useRoomWallets() {
  const { accessToken, isAuthenticated, ready } = useSession();
  const query = useQuery({
    queryKey: ['wallets'],
    queryFn: () => getWallets(accessToken!),
    enabled: Boolean(ready && isAuthenticated && accessToken),
  });

  const wallets = query.data?.wallets ?? [];
  const bySlug = (slug: string): RoomWallet | undefined =>
    wallets.find((wallet) => wallet.roomSlug === slug);

  return { ...query, wallets, bySlug };
}
