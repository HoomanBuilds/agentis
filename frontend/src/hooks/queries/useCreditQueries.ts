'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * React Query hook for fetching and caching credit balance.
 */
export function useCreditBalance(publicKey: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['credits', 'balance', publicKey],
    queryFn: async (): Promise<bigint> => {
      if (!publicKey) return BigInt(0);
      
      const response = await fetch(`/api/credits/balance?address=${encodeURIComponent(publicKey)}`);
      const data = await response.json();
      
      if (data.success && data.balance) {
        return BigInt(data.balance);
      }
      return BigInt(0);
    },
    enabled: !!publicKey,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  /**
   * Invalidate the balance cache (call after purchases/claims)
   */
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['credits', 'balance', publicKey] });
  }, [queryClient, publicKey]);

  /**
   * Optimistically update balance (for immediate UI feedback)
   */
  const updateOptimistic = useCallback((newBalance: bigint) => {
    queryClient.setQueryData(['credits', 'balance', publicKey], newBalance);
  }, [queryClient, publicKey]);

  return {
    balance: query.data ?? BigInt(0),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    invalidate,
    updateOptimistic,
  };
}

/**
 * React Query hook for checking if user has claimed free tier.
 */
export function useHasClaimedFreeTier(publicKey: string | undefined) {
  return useQuery({
    queryKey: ['credits', 'claimed', publicKey],
    queryFn: async (): Promise<boolean> => {
      if (!publicKey) return false;
      
      const response = await fetch(`/api/credits/claimed?address=${encodeURIComponent(publicKey)}`);
      const data = await response.json();
      
      if (data.success && data.claimed === true) {
        return true;
      }
      
      // Fallback
      const balanceResponse = await fetch(`/api/credits/balance?address=${encodeURIComponent(publicKey)}`);
      const balanceData = await balanceResponse.json();
      
      return balanceData.success && balanceData.balance && BigInt(balanceData.balance) > BigInt(0);
    },
    enabled: !!publicKey,
    staleTime: 5 * 60 * 1000,
  });
}
