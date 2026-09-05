import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '../auth';
import { memorySupabaseService } from './supabaseService';
import type { MemoryRecord, MemoryWriteInput } from './types';

interface MemoryContextValue {
  memories: readonly MemoryRecord[];
  loading: boolean;
  errorMessage: string;
  refresh: () => Promise<void>;
  createMemory: (input: MemoryWriteInput) => Promise<string>;
  updateMemory: (memory: MemoryRecord, input: MemoryWriteInput) => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, isHydrated, user } = useAuth();
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user?.isCoupleConnected) {
      setMemories([]);
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      setMemories(await memorySupabaseService.fetchMemories(user.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '추억 기록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isHydrated) return;
    const timeout = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timeout);
  }, [isHydrated, refresh]);

  const value = useMemo<MemoryContextValue>(() => ({
    memories,
    loading,
    errorMessage,
    refresh,
    async createMemory(input) {
      if (!user) throw new Error('로그인이 필요합니다.');
      const id = await memorySupabaseService.createMemory(user.id, input);
      await refresh();
      return id;
    },
    async updateMemory(memory, input) {
      await memorySupabaseService.updateMemory(memory, input);
      await refresh();
    },
    async deleteMemory(memoryId) {
      await memorySupabaseService.deleteMemory(memoryId);
      await refresh();
    },
  }), [errorMessage, loading, memories, refresh, user]);

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>;
}

export function useMemories() {
  const value = useContext(MemoryContext);
  if (!value) throw new Error('useMemories must be used inside MemoryProvider.');
  return value;
}
