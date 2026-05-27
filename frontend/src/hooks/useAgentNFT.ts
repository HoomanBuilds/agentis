'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import { CallData, uint256, byteArray } from 'starknet';
import { CONTRACTS, DEFAULT_MINTING_FEE } from '@/constants/contracts';
import { getTxExplorerUrl, getProvider } from '@/lib/starknet-client';


export interface TransactionResult {
  transactionHash: string;
  success: boolean;
  errorMessage?: string;
  explorerUrl?: string;
}

export interface AgentMetadata {
  name: string;
  token_uri: string;
  personality_hash: string;
  created_at: bigint;
  creator: string;
  chat_count: bigint;
  level: bigint;
}

export interface TopAgentEntry {
  tokenId: bigint;
  chatCount: bigint;
}

export function useAgentNFT() {
  const { activeKey, account, refreshBalance } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TransactionResult | null>(null);

  /**
   * Mint a new AI Agent NFT
   * Flow: User approves STRK spend → Backend mints → NFT transferred to user
   */
  const mintAgent = useCallback(async (
    name: string,
    tokenUri: string,
    personalityHash: string
  ): Promise<TransactionResult> => {
    console.log('[mintAgent] called', { name, tokenUri: tokenUri.slice(0, 60) + '...', personalityHash });

    if (!activeKey || !account) {
      const msg = 'Wallet not connected';
      console.error('[mintAgent] FAIL — wallet not connected', { activeKey, account });
      return { transactionHash: '', success: false, errorMessage: msg };
    }

    console.log('[mintAgent] wallet ok, account:', account.address);

    // Pre-flight: check account is deployed (Starknet accounts are smart contracts)
    try {
      const provider = getProvider();
      await provider.getClassHashAt(account.address);
    } catch {
      const msg = 'Your wallet account is not deployed on Starknet yet. Open ReadyX/ArgentX and approve the "Deploy account" transaction first, then try minting again.';
      console.error('[mintAgent] account not deployed:', account.address);
      return { transactionHash: '', success: false, errorMessage: msg };
    }

    setIsLoading(true);
    setError(null);

    try {
      const approveFee = uint256.bnToUint256(DEFAULT_MINTING_FEE);
      console.log('[mintAgent] approve calldata', {
        spender: CONTRACTS.addresses.AgentNFT,
        fee: DEFAULT_MINTING_FEE.toString(),
        feeU256: approveFee,
      });

      const nameBA = byteArray.byteArrayFromString(name);
      const uriBA = byteArray.byteArrayFromString(tokenUri);
      const hashBA = byteArray.byteArrayFromString(personalityHash);
      console.log('[mintAgent] ByteArrays encoded', {
        name: { dataLen: nameBA.data.length, pending_word_len: nameBA.pending_word_len },
        uri: { dataLen: uriBA.data.length, pending_word_len: uriBA.pending_word_len },
        hash: { dataLen: hashBA.data.length, pending_word_len: hashBA.pending_word_len },
      });

      // Multicall: approve STRK spend, then mint
      console.log('[mintAgent] sending multicall to wallet...');
      const result = await account.execute([
        {
          contractAddress: CONTRACTS.addresses.STRK,
          entrypoint: 'approve',
          calldata: CallData.compile([CONTRACTS.addresses.AgentNFT, approveFee]),
        },
        {
          contractAddress: CONTRACTS.addresses.AgentNFT,
          entrypoint: 'mint_agent',
          calldata: CallData.compile([nameBA, uriBA, hashBA]),
        },
      ]);

      const txHash = result.transaction_hash;
      console.log('[mintAgent] wallet signed, txHash:', txHash);

      const confirmed = await waitForTxSuccess(txHash);
      if (!confirmed) {
        throw new Error('Minting transaction failed or timed out');
      }
      console.log('[mintAgent] tx confirmed ✓');

      setTimeout(() => refreshBalance(), 3000);

      const txResult: TransactionResult = {
        transactionHash: txHash,
        success: true,
        explorerUrl: getTxExplorerUrl(txHash),
      };
      setLastResult(txResult);
      return txResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[mintAgent] FAIL —', errorMessage, err);
      setError(errorMessage);
      return { transactionHash: '', success: false, errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, account, refreshBalance]);

  const waitForTxSuccess = async (txHash: string, maxWaitMs = 120000): Promise<boolean> => {
    const startTime = Date.now();
    const pollInterval = 3000;
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const response = await fetch(`/api/tx/status?hash=${txHash}`);
        const data = await response.json();
        if (data.status === 'success') return true;
        if (data.status === 'failed') return false;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    return false;
  };

  const getAgentMetadata = useCallback(async (tokenId: bigint): Promise<AgentMetadata | null> => {
    try {
      const response = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: 'AgentNFT',
          entryPoint: 'get_agent_metadata',
          args: { token_id: tokenId.toString() }
        })
      });
      const data = await response.json();
      if (data.success && data.result) {
        // ABI returns anonymous tuple: (name, token_uri, personality_hash, created_at, creator, chat_count, level, is_public)
        const r = Array.isArray(data.result) ? data.result : Object.values(data.result);
        return {
          name: String(r[0] ?? ''),
          token_uri: String(r[1] ?? ''),
          personality_hash: String(r[2] ?? ''),
          created_at: BigInt(String(r[3] ?? 0)),
          creator: String(r[4] ?? ''),
          chat_count: BigInt(String(r[5] ?? 0)),
          level: BigInt(String(r[6] ?? 0)),
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching agent metadata:', err);
      return null;
    }
  }, []);

  const getAgentsByOwner = useCallback(async (ownerKey: string): Promise<bigint[]> => {
    if (!ownerKey) return [];
    try {
      // AgentNFT has no tokens_of_owner — iterate over all minted tokens and filter by owner_of
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      const totalSupply = Number(statsData.totalAgents || 0);
      if (totalSupply === 0) return [];

      const ids = Array.from({ length: totalSupply }, (_, i) => i + 1);
      const results = await Promise.all(ids.map(async (id) => {
        const res = await fetch('/api/contract/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contract: 'AgentNFT', entryPoint: 'owner_of', args: { token_id: String(id) } }),
        });
        const d = await res.json();
        if (d.success && d.result && String(d.result).toLowerCase() === ownerKey.toLowerCase()) {
          return BigInt(id);
        }
        return null;
      }));
      return results.filter((id): id is bigint => id !== null);
    } catch (err) {
      console.error('Error fetching agents by owner:', err);
      return [];
    }
  }, []);

  const getTopAgentsByChats = useCallback(async (limit: number = 10): Promise<TopAgentEntry[]> => {
    try {
      const response = await fetch(`/api/leaderboard/agents?limit=${limit}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.agents)) {
        return data.agents.map((entry: { tokenId: string; chatCount: string }) => ({
          tokenId: BigInt(entry.tokenId),
          chatCount: BigInt(entry.chatCount),
        }));
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  const getTotalSupply = useCallback(async (): Promise<bigint> => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success && data.totalAgents) {
        return BigInt(data.totalAgents);
      }
      return BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, []);

  const setAgentPublic = useCallback(async (
    tokenId: bigint,
    isPublic: boolean
  ): Promise<TransactionResult> => {
    if (!activeKey || !account) {
      return { transactionHash: '', success: false, errorMessage: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await account.execute({
        contractAddress: CONTRACTS.addresses.AgentNFT,
        entrypoint: 'set_agent_public',
        calldata: CallData.compile([
          tokenId.toString(),
          isPublic ? 1 : 0,
        ]),
      });

      const txResult: TransactionResult = {
        transactionHash: result.transaction_hash,
        success: true,
        explorerUrl: getTxExplorerUrl(result.transaction_hash),
      };
      setLastResult(txResult);
      refreshBalance();
      return txResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set visibility';
      setError(errorMessage);
      return { transactionHash: '', success: false, errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [activeKey, account, refreshBalance]);

  const getAgentPublic = useCallback(async (tokenId: bigint): Promise<boolean> => {
    try {
      const response = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: 'AgentNFT',
          entryPoint: 'get_agent_public',
          args: { token_id: tokenId.toString() },
        }),
      });
      const data = await response.json();
      if (data.success && typeof data.result === 'boolean') return data.result;
      return true;
    } catch {
      return true;
    }
  }, []);

  const getOwnerOf = useCallback(async (tokenId: bigint): Promise<string | null> => {
    try {
      const response = await fetch('/api/contract/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract: 'AgentNFT',
          entryPoint: 'owner_of',
          args: { token_id: tokenId.toString() },
        }),
      });
      const data = await response.json();
      if (data.success && typeof data.result === 'string') return data.result;
      return null;
    } catch {
      return null;
    }
  }, []);

  return {
    mintAgent,
    getAgentMetadata,
    getAgentsByOwner,
    getTopAgentsByChats,
    getTotalSupply,
    setAgentPublic,
    getAgentPublic,
    getOwnerOf,
    isLoading,
    error,
    lastResult,
  };
}
