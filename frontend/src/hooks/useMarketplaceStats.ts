'use client';

import { useCallback } from 'react';

export interface TopCreatorEntry {
  address: string;
  volume: bigint;
}

export interface CreatorStats {
  volume: bigint;
  sales: bigint;
}

export function useMarketplaceStats() {
  const getTopCreators = useCallback(async (limit: number = 10): Promise<TopCreatorEntry[]> => {
    try {
      const response = await fetch(`/api/leaderboard/creators?limit=${limit}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.topCreators)) {
        return data.topCreators.map((entry: { address: string; totalVolume: string }) => ({
          address: entry.address,
          volume: BigInt(entry.totalVolume || 0),
        }));
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const getCreatorStats = useCallback(async (creatorAddress: string): Promise<CreatorStats> => {
    try {
      const response = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: 'AgentMarketplace',
          entryPoint: 'get_creator_stats',
          args: { creator: creatorAddress },
        }),
      });
      const data = await response.json();
      if (data.success && data.result) {
        const r = data.result;
        return {
          volume: BigInt(String(r.total_volume || r.volume || 0)),
          sales: BigInt(String(r.total_sales || r.sales || 0)),
        };
      }
      return { volume: BigInt(0), sales: BigInt(0) };
    } catch {
      return { volume: BigInt(0), sales: BigInt(0) };
    }
  }, []);

  const getMarketplaceStats = useCallback(async (): Promise<{ listings: bigint; sales: bigint; volume: bigint }> => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        return {
          listings: BigInt(data.totalListings || 0),
          sales: BigInt(data.totalSales || 0),
          volume: BigInt(data.totalVolume || 0),
        };
      }
      return { listings: BigInt(0), sales: BigInt(0), volume: BigInt(0) };
    } catch {
      return { listings: BigInt(0), sales: BigInt(0), volume: BigInt(0) };
    }
  }, []);

  return {
    getTopCreators,
    getCreatorStats,
    getMarketplaceStats,
  };
}
