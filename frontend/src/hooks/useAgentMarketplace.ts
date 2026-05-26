'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import { CallData, uint256 } from 'starknet';
import { CONTRACTS } from '@/constants/contracts';
import { getTxExplorerUrl } from '@/lib/starknet-client';
import { TransactionResult } from './useAgentNFT';

export interface MarketplaceListing {
  tokenId: bigint;
  seller: string;
  price: bigint;
  listedAt: bigint;
  active: boolean;
}

export function useAgentMarketplace() {
  const { activeKey, account, refreshBalance } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TransactionResult | null>(null);

  /**
   * Approve the marketplace contract to transfer an NFT
   */
  const approveForMarketplace = useCallback(async (
    tokenId: bigint
  ): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await account.execute({
        contractAddress: CONTRACTS.addresses.AgentNFT,
        entrypoint: 'approve',
        calldata: CallData.compile([
          CONTRACTS.addresses.AgentMarketplace,
          tokenId.toString(),
        ]),
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
   * List an agent for sale
   */
  const listAgent = useCallback(async (
    tokenId: bigint,
    price: bigint
  ): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await account.execute({
        contractAddress: CONTRACTS.addresses.AgentMarketplace,
        entrypoint: 'list_agent',
        calldata: CallData.compile([
          CONTRACTS.addresses.AgentNFT,
          tokenId.toString(),
          price.toString(),
        ]),
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
   * Buy an agent from the marketplace (approve STRK + buy_agent)
   */
  const buyAgent = useCallback(async (
    tokenId: bigint,
    price: bigint
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
            CONTRACTS.addresses.AgentMarketplace,
            uint256.bnToUint256(price),
          ]),
        },
        {
          contractAddress: CONTRACTS.addresses.AgentMarketplace,
          entrypoint: 'buy_agent',
          calldata: CallData.compile([
            CONTRACTS.addresses.AgentNFT,
            tokenId.toString(),
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

  /**
   * Cancel a listing
   */
  const cancelListing = useCallback(async (tokenId: bigint): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await account.execute({
        contractAddress: CONTRACTS.addresses.AgentMarketplace,
        entrypoint: 'cancel_listing',
        calldata: CallData.compile([
          CONTRACTS.addresses.AgentNFT,
          tokenId.toString(),
        ]),
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

  const updatePrice = useCallback(async (
    tokenId: bigint,
    newPrice: bigint
  ): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await account.execute({
        contractAddress: CONTRACTS.addresses.AgentMarketplace,
        entrypoint: 'update_price',
        calldata: CallData.compile([
          CONTRACTS.addresses.AgentNFT,
          tokenId.toString(),
          newPrice.toString(),
        ]),
      });
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
  }, [activeKey, account]);

  const getListing = useCallback(async (tokenId: bigint): Promise<MarketplaceListing | null> => {
    try {
      const response = await fetch('/api/marketplace-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: Number(tokenId) }),
      });
      const data = await response.json();
      if (data.success && data.listing) {
        return {
          tokenId: BigInt(data.listing.tokenId),
          seller: data.listing.seller,
          price: BigInt(data.listing.price || 0),
          listedAt: BigInt(data.listing.listedAt || 0),
          active: data.listing.active,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const getAllListings = useCallback(async (): Promise<MarketplaceListing[]> => {
    try {
      const response = await fetch('/api/marketplace-listing');
      const data = await response.json();
      if (data.success && Array.isArray(data.listings)) {
        return data.listings.map((listing: Record<string, unknown>) => ({
          tokenId: BigInt(listing.tokenId as number),
          seller: listing.seller as string,
          price: BigInt(listing.price as string || 0),
          listedAt: BigInt(listing.listedAt as number || 0),
          active: listing.active as boolean,
        }));
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  return {
    approveForMarketplace,
    listAgent,
    buyAgent,
    cancelListing,
    updatePrice,
    getListing,
    getAllListings,
    isLoading,
    error,
    lastResult,
  };
}
