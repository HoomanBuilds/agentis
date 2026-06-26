'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import { CallData, uint256, constants } from 'starknet';
import { CONTRACTS, CREDIT_PRICE, SESSION_COST } from '@/constants/contracts';
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

export interface CreditPlan {
  id: bigint;
  credits: bigint;
  price: bigint;
  discountPercent: bigint;
  active: boolean;
}

export function useAgentCredits() {
  const { activeKey, account, refreshBalance } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TransactionResult | null>(null);

  /**
   * Claim free tier credits (one-time per account)
   */
  const claimFreeTier = useCallback(async (): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await account.execute({
        contractAddress: CONTRACTS.addresses.AgentCredits,
        entrypoint: 'claim_free_tier',
        calldata: [],
      }, V3_DETAILS);

      setTimeout(() => refreshBalance(), 5000);
      const txResult: TransactionResult = {
        transactionHash: result.transaction_hash,
        success: true,
        explorerUrl: getTxExplorerUrl(result.transaction_hash),
      };
      setLastResult(txResult);
      return txResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { transactionHash: '', success: false, errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, account, refreshBalance]);

  /**
   * Purchase credits with STRK (approve + purchase_credits)
   */
  const purchaseCredits = useCallback(async (
    amount: bigint,
    cost: bigint
  ): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Multicall: approve STRK + purchase_credits
      const result = await account.execute([
        {
          contractAddress: CONTRACTS.addresses.STRK,
          entrypoint: 'approve',
          calldata: CallData.compile([
            CONTRACTS.addresses.AgentCredits,
            uint256.bnToUint256(cost),
          ]),
        },
        {
          contractAddress: CONTRACTS.addresses.AgentCredits,
          entrypoint: 'purchase_credits',
          calldata: CallData.compile([amount.toString()]),
        },
      ], V3_DETAILS);

      setTimeout(() => refreshBalance(), 5000);
      const txResult: TransactionResult = {
        transactionHash: result.transaction_hash,
        success: true,
        explorerUrl: getTxExplorerUrl(result.transaction_hash),
      };
      setLastResult(txResult);
      return txResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { transactionHash: '', success: false, errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, account, refreshBalance]);

  /**
   * Purchase a credit plan (approve + purchase_plan)
   */
  const purchasePlan = useCallback(async (
    planId: bigint,
    planPrice: bigint
  ): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await account.execute([
        {
          contractAddress: CONTRACTS.addresses.STRK,
          entrypoint: 'approve',
          calldata: CallData.compile([
            CONTRACTS.addresses.AgentCredits,
            uint256.bnToUint256(planPrice),
          ]),
        },
        {
          contractAddress: CONTRACTS.addresses.AgentCredits,
          entrypoint: 'purchase_plan',
          calldata: CallData.compile([planId.toString()]),
        },
      ], V3_DETAILS);

      setTimeout(() => refreshBalance(), 5000);
      const txResult: TransactionResult = {
        transactionHash: result.transaction_hash,
        success: true,
        explorerUrl: getTxExplorerUrl(result.transaction_hash),
      };
      setLastResult(txResult);
      return txResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { transactionHash: '', success: false, errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, account, refreshBalance]);

  /**
   * Purchase session credits (approve STRK + purchase_session)
   */
  const purchaseSession = useCallback(async (
    agentId: number,
    _agentWallet?: string
  ): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionPrice = SESSION_COST;

      const result = await account.execute([
        {
          contractAddress: CONTRACTS.addresses.STRK,
          entrypoint: 'approve',
          calldata: CallData.compile([
            CONTRACTS.addresses.AgentCredits,
            uint256.bnToUint256(sessionPrice),
          ]),
        },
        {
          contractAddress: CONTRACTS.addresses.AgentCredits,
          entrypoint: 'purchase_session',
          calldata: CallData.compile([
            CONTRACTS.addresses.AgentNFT,
            agentId,
          ]),
        },
      ], V3_DETAILS);

      setTimeout(() => refreshBalance(), 5000);
      const txResult: TransactionResult = {
        transactionHash: result.transaction_hash,
        success: true,
        explorerUrl: getTxExplorerUrl(result.transaction_hash),
      };
      setLastResult(txResult);
      return txResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { transactionHash: '', success: false, errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, account, refreshBalance]);

  const getCreditBalance = useCallback(async (userKey: string): Promise<bigint> => {
    try {
      const response = await fetch(`/api/credits/balance?address=${encodeURIComponent(userKey)}`);
      const data = await response.json();
      if (data.success && data.balance) return BigInt(data.balance);
      return BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, []);

  const hasClaimedFreeTier = useCallback(async (userKey: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/credits/claimed?address=${encodeURIComponent(userKey)}`);
      const data = await response.json();
      if (data.success && data.claimed === true) return true;

      // Fallback: check balance
      const balanceResponse = await fetch(`/api/credits/balance?address=${encodeURIComponent(userKey)}`);
      const balanceData = await balanceResponse.json();
      return balanceData.success && balanceData.balance && BigInt(balanceData.balance) > BigInt(0);
    } catch {
      return false;
    }
  }, []);

  const getPlans = useCallback(async (): Promise<CreditPlan[]> => {
    try {
      const countRes = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: 'AgentCredits', entryPoint: 'get_plan_count', args: [] }),
      });
      const countData = await countRes.json();
      const planCount = Number(countData.result ?? 0);
      if (planCount === 0) return [];

      const plans = await Promise.all(
        Array.from({ length: planCount }, (_, i) => i).map(async (id) => {
          const res = await fetch('/api/contract/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contract: 'AgentCredits', entryPoint: 'get_plan', args: { plan_id: String(id) } }),
          });
          const d = await res.json();
          if (!d.success || !d.result) return null;
          // tuple: (credits: u128, price: u128, discount_bps: u16, active: bool)
          const r = Array.isArray(d.result) ? d.result : Object.values(d.result);
          return {
            id: BigInt(id),
            credits: BigInt(String(r[0] ?? 0)),
            price: BigInt(String(r[1] ?? 0)),
            discountPercent: BigInt(Math.round(Number(r[2] ?? 0) / 100)),
            active: Boolean(r[3]),
          } as CreditPlan;
        })
      );
      return plans.filter((p): p is CreditPlan => p !== null);
    } catch {
      return [];
    }
  }, []);

  const getPlan = useCallback(async (planId: bigint): Promise<CreditPlan | null> => {
    const all = await getPlans();
    return all.find(p => p.id === planId) ?? null;
  }, [getPlans]);

  const getCreditPrice = useCallback(async (): Promise<bigint> => {
    try {
      const res = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: 'AgentCredits', entryPoint: 'get_credit_price', args: [] }),
      });
      const data = await res.json();
      if (data.success && data.result) return BigInt(String(data.result));
    } catch {}
    return CREDIT_PRICE;
  }, []);

  const getFreeTierAmount = useCallback(async (): Promise<bigint> => {
    try {
      const res = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract: 'AgentCredits', entryPoint: 'get_free_tier_credits', args: [] }),
      });
      const data = await res.json();
      if (data.success && data.result) return BigInt(String(data.result));
    } catch {}
    return BigInt(10);
  }, []);

  return {
    claimFreeTier,
    purchaseCredits,
    purchasePlan,
    purchaseSession,
    getCreditBalance,
    hasClaimedFreeTier,
    getPlan,
    getPlans,
    getCreditPrice,
    getFreeTierAmount,
    isLoading,
    error,
    lastResult,
  };
}
