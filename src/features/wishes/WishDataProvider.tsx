import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import type { Wish } from '../../types/wish';
import { useAuth } from '../auth';
import { wishSupabaseService, type TicketBalance } from './supabaseService';
import type { OwnedWishTicket, WishTicketType } from './types';

interface WishDataContextValue {
  balances: readonly TicketBalance[];
  wishes: readonly Wish[];
  ownedTickets: readonly OwnedWishTicket[];
  loading: boolean;
  errorMessage: string;
  refresh: () => Promise<void>;
  sendWish: (ticketType: WishTicketType, content: string, scheduledFor: string) => Promise<string>;
  completeWish: (wishId: string) => Promise<void>;
}

const WishDataContext = createContext<WishDataContextValue | null>(null);

export function WishDataProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, isHydrated, user } = useAuth();
  const [balances, setBalances] = useState<TicketBalance[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setBalances([]);
      setWishes([]);
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const userIds = [user.id, ...(user.partner ? [user.partner.id] : [])];
      const [nextBalances, nextWishes] = await Promise.all([
        wishSupabaseService.fetchBalances(userIds),
        wishSupabaseService.fetchWishes(user.id),
      ]);
      setBalances(nextBalances);
      setWishes(nextWishes);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '소원 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isHydrated) return;
    const timeout = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timeout);
  }, [isHydrated, refresh]);

  const ownedTickets = useMemo<OwnedWishTicket[]>(() => {
    if (!user) return [];
    const balance = balances.find((item) => item.userId === user.id);
    return (['normal', 'premium'] as const).map((type) => {
      const quantity = balance?.[type] ?? 0;
      return {
        id: `${user.id}-${type}`,
        type,
        quantity,
        owned: quantity > 0,
        acquiredAt: '',
        acquiredAtLabel: `현재 ${quantity}장 보유`,
        isUsable: quantity > 0 && Boolean(user.partner),
      };
    });
  }, [balances, user]);

  const value = useMemo<WishDataContextValue>(() => ({
    balances,
    wishes,
    ownedTickets,
    loading,
    errorMessage,
    refresh,
    async sendWish(ticketType, content, scheduledFor) {
      const wishId = await wishSupabaseService.sendWish(ticketType, content, scheduledFor);
      await refresh();
      return wishId;
    },
    async completeWish(wishId) {
      await wishSupabaseService.completeWish(wishId);
      await refresh();
    },
  }), [balances, errorMessage, loading, ownedTickets, refresh, wishes]);

  return <WishDataContext.Provider value={value}>{children}</WishDataContext.Provider>;
}

export function useWishData() {
  const value = useContext(WishDataContext);
  if (!value) throw new Error('useWishData must be used inside WishDataProvider.');
  return value;
}
