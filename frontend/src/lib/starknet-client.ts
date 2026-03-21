import { RpcProvider, Contract, num } from 'starknet';
import { CONTRACTS, TOKEN_DECIMALS } from '@/constants/contracts';

// ABI imports for Contract instances
import AgentNFTAbi from '@/constants/abis/AgentNFT.json';
import AgentCreditsAbi from '@/constants/abis/AgentCredits.json';
import RevenueShareAbi from '@/constants/abis/RevenueShare.json';
import AgentMarketplaceAbi from '@/constants/abis/AgentMarketplace.json';

// Singleton RPC provider
let provider: RpcProvider | null = null;

export function getProvider(): RpcProvider {
  if (!provider) {
    provider = new RpcProvider({ nodeUrl: CONTRACTS.rpcUrl });
  }
  return provider;
}

/**
 * Get a Contract instance for reading (no account needed)
 */
export function getContract(name: keyof typeof CONTRACTS.addresses): Contract {
  const p = getProvider();
  const abiMap = {
    AgentNFT: AgentNFTAbi,
    AgentCredits: AgentCreditsAbi,
    RevenueShare: RevenueShareAbi,
    AgentMarketplace: AgentMarketplaceAbi,
    STRK: AgentCreditsAbi, // ERC20 ABI subset is compatible
  };
  return new Contract(abiMap[name], CONTRACTS.addresses[name], p);
}

/**
 * Format wei to STRK string (1 STRK = 10^18 wei)
 */
export function formatSTRK(wei: bigint, decimals: number = 2): string {
  const strk = Number(wei) / 10 ** TOKEN_DECIMALS;
  return strk.toFixed(decimals);
}

/**
 * Parse STRK string to wei
 */
export function parseSTRK(strk: string): bigint {
  const amount = parseFloat(strk);
  return BigInt(Math.floor(amount * 10 ** TOKEN_DECIMALS));
}

/**
 * Get explorer URL for a transaction
 */
export function getTxExplorerUrl(txHash: string): string {
  return `${CONTRACTS.explorerUrl}/tx/${txHash}`;
}

/**
 * Get explorer URL for a contract/account
 */
export function getAccountExplorerUrl(address: string): string {
  return `${CONTRACTS.explorerUrl}/contract/${address}`;
}

/**
 * Get account STRK balance via API proxy
 */
export async function getAccountBalance(address: string): Promise<bigint> {
  try {
    const response = await fetch(`/api/account/balance?address=${address}`);
    if (!response.ok) return BigInt(0);
    const data = await response.json();
    return data?.balance ? BigInt(data.balance) : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

/**
 * Get transaction receipt status
 */
export async function getTxStatus(txHash: string): Promise<'pending' | 'success' | 'failed'> {
  try {
    const p = getProvider();
    const receipt = await p.getTransactionReceipt(txHash);
    if ('execution_status' in receipt) {
      if (receipt.execution_status === 'SUCCEEDED') return 'success';
      if (receipt.execution_status === 'REVERTED') return 'failed';
    }
    return 'pending';
  } catch {
    return 'pending';
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTx(
  txHash: string,
  timeoutMs: number = 120000,
  pollIntervalMs: number = 3000
): Promise<{ status: 'success' | 'failed' | 'timeout'; message?: string }> {
  try {
    const p = getProvider();
    await p.waitForTransaction(txHash, {
      retryInterval: pollIntervalMs,
    });
    const status = await getTxStatus(txHash);
    if (status === 'success') return { status: 'success' };
    if (status === 'failed') return { status: 'failed', message: 'Transaction execution reverted' };
    return { status: 'timeout' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return { status: 'timeout', message: 'Transaction confirmation timed out' };
    }
    return { status: 'failed', message: msg };
  }
}

/**
 * Convert felt252 to hex string address
 */
export function feltToAddress(felt: string | bigint): string {
  return num.toHex(felt);
}
