'use client';

import { useCallback } from 'react';
import { CONTRACTS } from '@/constants/contracts';

export interface AgentEarnings {
  total: bigint;
  withdrawn: bigint;
  pending: bigint;
}

export interface RevenueSplit {
  agentShare: bigint;
  platformShare: bigint;
}

export function useRevenueShare() {
  const getAgentStats = useCallback(async (tokenId: bigint): Promise<AgentEarnings> => {
    try {
      const response = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: 'RevenueShare',
          entryPoint: 'get_agent_stats',
          args: { token_id: tokenId.toString() },
        }),
      });
      const data = await response.json();
      if (data.success && data.result) {
        const r = data.result;
        return {
          total: BigInt(String(r.total_earned || r.total || 0)),
          withdrawn: BigInt(String(r.total_withdrawn || r.withdrawn || 0)),
          pending: BigInt(String(r.pending_balance || r.pending || 0)),
        };
      }
      return { total: BigInt(0), withdrawn: BigInt(0), pending: BigInt(0) };
    } catch {
      return { total: BigInt(0), withdrawn: BigInt(0), pending: BigInt(0) };
    }
  }, []);

  const getRevenueSplit = useCallback(async (): Promise<RevenueSplit> => {
    return {
      agentShare: BigInt(8000),
      platformShare: BigInt(2000),
    };
  }, []);

  const getAgentWallet = useCallback(async (tokenId: bigint): Promise<string | null> => {
    try {
      const response = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: 'RevenueShare',
          entryPoint: 'get_agent_wallet',
          args: { token_id: tokenId.toString() },
        }),
      });
      const data = await response.json();
      if (data.success && data.result && data.result !== '0x0') {
        return data.result;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  return {
    getAgentStats,
    getRevenueSplit,
    getAgentWallet,
  };
}
