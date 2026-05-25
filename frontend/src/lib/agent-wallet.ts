/**
 * Agent wallet utilities for Starknet.
 * On Starknet, agent wallets are Starknet accounts derived deterministically.
 * For now, agent wallet info is stored on-chain via RevenueShare contract.
 */

import { RpcProvider, Contract } from 'starknet';
import { CONTRACTS } from '@/constants/contracts';
import RevenueShareAbi from '@/constants/abis/RevenueShare.json';
import { formatSTRK } from './starknet-client';
import { executeBackendCall } from './backend-wallet';

function getProvider(): RpcProvider {
  return new RpcProvider({ nodeUrl: CONTRACTS.rpcUrl });
}

/**
 * Get agent wallet address from RevenueShare contract
 */
export async function getAgentWalletAddress(tokenId: number): Promise<string | null> {
  try {
    const provider = getProvider();
    const contract = new Contract(RevenueShareAbi, CONTRACTS.addresses.RevenueShare, provider);
    const result = await contract.call('get_agent_wallet', [tokenId]);
    const address = '0x' + BigInt(result.toString()).toString(16).padStart(64, '0');
    // Zero address means no wallet registered
    if (BigInt(address) === BigInt(0)) return null;
    return address;
  } catch {
    return null;
  }
}

/**
 * Get agent STRK balance
 */
export async function getAgentBalance(tokenId: number): Promise<string> {
  try {
    const walletAddress = await getAgentWalletAddress(tokenId);
    if (!walletAddress) return '0.0000';

    const provider = getProvider();
    const strkContract = new Contract(
      [{ name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'felt' }], outputs: [{ name: 'balance', type: 'Uint256' }], stateMutability: 'view' }],
      CONTRACTS.addresses.STRK,
      provider
    );
    const result = await strkContract.call('balanceOf', [walletAddress]);
    const balance = BigInt(result.toString());
    return formatSTRK(balance, 4);
  } catch (error) {
    console.error(`[getAgentBalance] Error for agent ${tokenId}:`, error);
    return '0.0000';
  }
}

/**
 * Get agent wallet info for display
 */
export async function getAgentWalletInfo(tokenId: number): Promise<{
  address: string | null;
  balance: string;
}> {
  const address = await getAgentWalletAddress(tokenId);
  const balance = await getAgentBalance(tokenId);
  return { address, balance };
}

/** Alias for getAgentWalletAddress */
export const getAgentWalletPublicKey = getAgentWalletAddress;

/**
 * Purchase credits on behalf of an agent using the backend wallet.
 * Used for auto-pay when agent owner chats with their own agent.
 */
export async function agentPurchaseCredits(
  agentId: number,
  amount: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const result = await executeBackendCall(
      CONTRACTS.addresses.AgentCredits,
      'purchase_credits',
      [amount]
    );
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to purchase credits' };
  }
}
