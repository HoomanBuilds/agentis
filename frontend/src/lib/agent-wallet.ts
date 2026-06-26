import { RpcProvider, Contract, ec, hash, num } from 'starknet';
import { CONTRACTS } from '@/constants/contracts';
import RevenueShareAbi from '@/constants/abis/RevenueShare.json';
import { formatSTRK } from './starknet-client';
import { executeBackendCall } from './backend-wallet';

// Same account class as our backend wallet (deployed on Sepolia)
const ACCOUNT_CLASS_HASH = '0x5b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564';

function getProvider(): RpcProvider {
  return new RpcProvider({ nodeUrl: CONTRACTS.rpcUrl });
}

export function deriveAgentPrivateKey(tokenId: number): string {
  const backendKey = process.env.BACKEND_PRIVATE_KEY;
  if (!backendKey) throw new Error('BACKEND_PRIVATE_KEY not configured');

  const seed = hash.computePedersenHash(backendKey, num.toHex(tokenId));
  return ec.starkCurve.grindKey(seed);
}

export function deriveAgentStarkKey(tokenId: number): string {
  const privateKey = deriveAgentPrivateKey(tokenId);
  return ec.starkCurve.getStarkKey(privateKey);
}

// Counterfactual account address: where the account contract WILL live once deployed
export function deriveAgentAccountAddress(tokenId: number): string {
  const publicKey = deriveAgentStarkKey(tokenId);
  return hash.calculateContractAddressFromHash(
    publicKey,
    ACCOUNT_CLASS_HASH,
    [publicKey],
    0
  );
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

export async function ensureAgentWallet(tokenId: number): Promise<string> {
  const existing = await getAgentWalletAddress(tokenId);
  if (existing) return existing;
  return forceRegisterAgentWallet(tokenId);
}

export async function forceRegisterAgentWallet(tokenId: number): Promise<string> {
  const accountAddress = deriveAgentAccountAddress(tokenId);
  console.log(`[agent-wallet] Registering wallet for agent ${tokenId}: ${accountAddress}`);

  const result = await executeBackendCall(
    CONTRACTS.addresses.RevenueShare,
    'set_agent_wallet',
    [tokenId, accountAddress]
  );

  if (!result.success) {
    throw new Error(`Failed to register agent wallet: ${result.error}`);
  }

  console.log(`[agent-wallet] Registered, tx: ${result.transactionHash}`);
  return accountAddress;
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
