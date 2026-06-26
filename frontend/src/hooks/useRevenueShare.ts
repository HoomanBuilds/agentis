'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import { CallData, constants } from 'starknet';
import { CONTRACTS } from '@/constants/contracts';
import { getTxExplorerUrl } from '@/lib/starknet-client';
import { TransactionResult } from './useAgentNFT';

const V3_DETAILS = {
  version: constants.TRANSACTION_VERSION.V3 as any,
  resourceBounds: {
    l1_gas: { max_amount: '0x200', max_price_per_unit: '0x140AED98C0A144' },
    l1_data_gas: { max_amount: '0x200', max_price_per_unit: '0x140AED98C0A144' },
    l2_gas: { max_amount: '0x500000', max_price_per_unit: '0x174876E800' },
  },
};

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
  const { activeKey, account } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // ABI returns anonymous tuple: (total_earned: u128, total_withdrawn: u128, pending_balance: u128)
        const r = Array.isArray(data.result) ? data.result : Object.values(data.result);
        return {
          total: BigInt(String(r[0] ?? 0)),
          withdrawn: BigInt(String(r[1] ?? 0)),
          pending: BigInt(String(r[2] ?? 0)),
        };
      }
      return { total: BigInt(0), withdrawn: BigInt(0), pending: BigInt(0) };
    } catch {
      return { total: BigInt(0), withdrawn: BigInt(0), pending: BigInt(0) };
    }
  }, []);

  const getRevenueSplit = useCallback(async (): Promise<RevenueSplit> => {
    try {
      const response = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: 'RevenueShare', entryPoint: 'get_revenue_split', args: [] }),
      });
      const data = await response.json();
      if (data.success && data.result) {
        // ABI returns anonymous tuple: (agent_share: u16, platform_share: u16)
        const r = Array.isArray(data.result) ? data.result : Object.values(data.result);
        return {
          agentShare: BigInt(String(r[0] ?? 8000)),
          platformShare: BigInt(String(r[1] ?? 2000)),
        };
      }
    } catch {}
    return { agentShare: BigInt(8000), platformShare: BigInt(2000) };
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

  const withdrawAgentEarnings = useCallback(async (tokenId: bigint): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await account.execute({
        contractAddress: CONTRACTS.addresses.RevenueShare,
        entrypoint: 'withdraw_agent_earnings',
        calldata: CallData.compile([tokenId.toString()]),
      }, V3_DETAILS);
      return {
        transactionHash: result.transaction_hash,
        success: true,
        explorerUrl: getTxExplorerUrl(result.transaction_hash),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { transactionHash: '', success: false, errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, account]);

  return {
    getAgentStats,
    getRevenueSplit,
    getAgentWallet,
    withdrawAgentEarnings,
    isLoading,
    error,
  };
}
