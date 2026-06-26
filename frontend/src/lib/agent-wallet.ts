/**
 * Agent wallet utilities for Starknet.
 * Each agent gets a deterministic Starknet keypair derived from the
 * backend private key + tokenId. The public key (Stark key) is registered
 * on the RevenueShare contract so revenue can be routed to it.
 */

import { RpcProvider, Contract, ec, hash, num } from 'starknet';
import { CONTRACTS } from '@/constants/contracts';
import RevenueShareAbi from '@/constants/abis/RevenueShare.json';
import { formatSTRK } from './starknet-client';
import { executeBackendCall } from './backend-wallet';

function getProvider(): RpcProvider {
  return new RpcProvider({ nodeUrl: CONTRACTS.rpcUrl });
}

/**
 * Derive a deterministic private key for an agent.
 * seed = pedersen(backendPrivateKey, tokenId), then grindKey for validity.
 */
export function deriveAgentPrivateKey(tokenId: number): string {
  const backendKey = process.env.BACKEND_PRIVATE_KEY;
  if (!backendKey) throw new Error('BACKEND_PRIVATE_KEY not configured');

  const seed = hash.computePedersenHash(backendKey, num.toHex(tokenId));
  return ec.starkCurve.grindKey(seed);
}

/**
 * Derive the agent's Stark public key (address) from its private key.
 */
export function deriveAgentStarkKey(tokenId: number): string {
  const privateKey = deriveAgentPrivateKey(tokenId);
  return ec.starkCurve.getStarkKey(privateKey);
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
 * Ensure an agent has a wallet registered on-chain.
 * Derives the Stark key deterministically and registers it if not already set.
 */
export async function ensureAgentWallet(tokenId: number): Promise<string> {
  const existing = await getAgentWalletAddress(tokenId);
  if (existing) return existing;

  const starkKey = deriveAgentStarkKey(tokenId);
  console.log(`[agent-wallet] Registering wallet for agent ${tokenId}: ${starkKey}`);

  const result = await executeBackendCall(
    CONTRACTS.addresses.RevenueShare,
    'set_agent_wallet',
    [tokenId, starkKey]
  );

  if (!result.success) {
    throw new Error(`Failed to register agent wallet: ${result.error}`);
  }

  console.log(`[agent-wallet] Registered, tx: ${result.transactionHash}`);
  return starkKey;
}

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
