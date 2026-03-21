'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import { CallData, uint256 } from 'starknet';
import { CONTRACTS, CREDIT_PRICE, SESSION_COST } from '@/constants/contracts';
import { getTxExplorerUrl } from '@/lib/starknet-client';
import { TransactionResult } from './useAgentNFT';

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
      });

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
          calldata: CallData.compile([uint256.bnToUint256(amount)]),
        },
      ]);

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
      ]);

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
      ]);

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

  /**
   * Plans match contract init values but with 18-decimal STRK prices
   */
  const getPlans = useCallback(async (): Promise<CreditPlan[]> => {
    return [
      {
        id: BigInt(0),
        credits: BigInt(100),
        price: BigInt('9000000000000000000'),  // 9 STRK
        discountPercent: BigInt(10),
        active: true,
      },
      {
        id: BigInt(1),
        credits: BigInt(500),
        price: BigInt('40000000000000000000'), // 40 STRK
        discountPercent: BigInt(20),
        active: true,
      },
      {
        id: BigInt(2),
        credits: BigInt(1000),
        price: BigInt('70000000000000000000'), // 70 STRK
        discountPercent: BigInt(30),
        active: true,
      },
    ];
  }, []);

  const getPlan = useCallback(async (planId: bigint): Promise<CreditPlan | null> => {
    const allPlans = await getPlans();
    return allPlans.find(p => p.id === planId) || null;
  }, [getPlans]);

  const getCreditPrice = useCallback(async (): Promise<bigint> => {
    return CREDIT_PRICE; // 0.1 STRK
  }, []);

  const getFreeTierAmount = useCallback(async (): Promise<bigint> => {
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
