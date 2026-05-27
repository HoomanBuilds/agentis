/**
 * Credits Backend Library (Starknet)
 *
 * Server-side credit operations using starknet.js Contract.call() for reads
 * and backend Account.execute() for writes.
 */

import { CallData } from 'starknet';
import { CONTRACTS } from '@/constants/contracts';
import { getContract } from './starknet-client';
import { getBackendAccount } from './backend-wallet';

// Use getContract() from starknet-client — it sets blockIdentifier:'latest'
// so Alchemy doesn't reject with "Invalid block id" (pending not supported)
function getCreditsContract() {
  return getContract('AgentCredits');
}

/**
 * Check if backend wallet is configured
 */
export function isBackendWalletConfigured(): boolean {
  return !!(process.env.BACKEND_PRIVATE_KEY && process.env.BACKEND_ACCOUNT_ADDRESS);
}

/**
 * Check if user has sufficient credits
 */
export async function checkUserCredits(
  userAddress: string,
  requiredCredits: number = 1
): Promise<{ hasCredits: boolean; balance: bigint }> {
  try {
    const contract = getCreditsContract();
    const result = await contract.call('get_user_credits', [userAddress]);
    const balance = BigInt(result.toString());
    return { hasCredits: balance >= BigInt(requiredCredits), balance };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { hasCredits: false, balance: BigInt(0) };
  }
}

/**
 * Spend user credits (backend only)
 */
export async function spendUserCredits(
  userAddress: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    if (!isBackendWalletConfigured()) {
      return { success: false, error: 'Backend wallet not configured' };
    }

    const { hasCredits, balance } = await checkUserCredits(userAddress, amount);
    if (!hasCredits) {
      return { success: false, error: `Insufficient credits. Balance: ${balance}, Required: ${amount}` };
    }

    const account = getBackendAccount();
    // ABI: spend_credits(user: ContractAddress, amount: u128, reason: felt252)
    // reason must fit in a felt252 — truncate to 31 chars
    const reasonFelt = reason.slice(0, 31);
    const result = await account.execute({
      contractAddress: CONTRACTS.addresses.AgentCredits,
      entrypoint: 'spend_credits',
      calldata: CallData.compile([userAddress, amount.toString(), reasonFelt]),
    });

    console.log(`Spent ${amount} credits for ${userAddress}: ${reason}`);
    return { success: true, transactionHash: result.transaction_hash };
  } catch (error) {
    console.error('Error spending credits:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to spend credits' };
  }
}

/**
 * Get user credit balance (read-only)
 */
export async function getUserCreditBalance(userAddress: string): Promise<bigint> {
  try {
    const { balance } = await checkUserCredits(userAddress);
    return balance;
  } catch {
    return BigInt(0);
  }
}

/**
 * Check session credits for an agent
 */
export async function checkSessionCredits(
  userAddress: string,
  agentId: number
): Promise<{ hasCredits: boolean; balance: bigint }> {
  try {
    const contract = getCreditsContract();
    const result = await contract.call('get_session_credits', [
      userAddress,
      CONTRACTS.addresses.AgentNFT,
      agentId,
    ]);
    const balance = BigInt(result.toString());
    return { hasCredits: balance > BigInt(0), balance };
  } catch (error) {
    console.error('Error checking session credits:', error);
    return { hasCredits: false, balance: BigInt(0) };
  }
}

/**
 * Use a session credit (backend only)
 */
export async function useSessionCredit(
  userAddress: string,
  agentId: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    if (!isBackendWalletConfigured()) {
      return { success: false, error: 'Backend wallet not configured' };
    }

    const { hasCredits } = await checkSessionCredits(userAddress, agentId);
    if (!hasCredits) {
      return { success: false, error: 'Insufficient session credits' };
    }

    const account = getBackendAccount();
    const result = await account.execute({
      contractAddress: CONTRACTS.addresses.AgentCredits,
      entrypoint: 'use_session_credit',
      calldata: CallData.compile([
        userAddress,
        CONTRACTS.addresses.AgentNFT,
        agentId.toString(),
      ]),
    });

    console.log(`Used session credit for ${userAddress}, agent ${agentId}`);
    return { success: true, transactionHash: result.transaction_hash };
  } catch (error) {
    console.error('Error using session credit:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to use session credit' };
  }
}

/**
 * Check if a user has claimed their free tier
 */
export async function hasClaimedFreeTier(userAddress: string): Promise<boolean> {
  try {
    const contract = getCreditsContract();
    const result = await contract.call('has_user_claimed_free_tier', [userAddress]);
    return Boolean(result);
  } catch {
    return false;
  }
}
