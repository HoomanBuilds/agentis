/**
 * Backend wallet utilities for server-side operations on Starknet.
 * Uses BACKEND_PRIVATE_KEY + BACKEND_ACCOUNT_ADDRESS env vars.
 */

import { Account, Contract, CallData, constants, num, shortString } from 'starknet';
import { CONTRACTS } from '@/constants/contracts';
import { getProvider } from './starknet-client';
import AgentNFTAbi from '@/constants/abis/AgentNFT.json';
import AgentCreditsAbi from '@/constants/abis/AgentCredits.json';
import RevenueShareAbi from '@/constants/abis/RevenueShare.json';

// Starknet Sepolia only accepts V3 transactions.
// Providing explicit resourceBounds skips fee estimation (which fails with RPC v0.10
// due to response format changes). These bounds are generous maximums — actual cost
// on testnet is near zero and only the actual fee is charged.
const V3_RESOURCE_BOUNDS = {
  l1_gas: { max_amount: '0x5000', max_price_per_unit: '0xB5E620F48000' },
  l1_data_gas: { max_amount: '0x5000', max_price_per_unit: '0xB5E620F48000' },
  l2_gas: { max_amount: '0x500000', max_price_per_unit: '0x174876E800' },
};
const V3_DETAILS = {
  version: constants.TRANSACTION_VERSION.V3 as any,
  resourceBounds: V3_RESOURCE_BOUNDS,
};

let cachedAccount: Account | null = null;

/**
 * Get the backend Starknet Account for signing transactions
 */
export function getBackendAccount(): Account {
  if (cachedAccount) return cachedAccount;

  const privateKey = process.env.BACKEND_PRIVATE_KEY;
  const accountAddress = process.env.BACKEND_ACCOUNT_ADDRESS;

  if (!privateKey || !accountAddress) {
    throw new Error('BACKEND_PRIVATE_KEY and BACKEND_ACCOUNT_ADDRESS must be configured');
  }

  cachedAccount = new Account(getProvider(), accountAddress, privateKey, '1', constants.TRANSACTION_VERSION.V3);
  return cachedAccount;
}

/**
 * Get the backend account address
 */
export function getBackendAddress(): string {
  const address = process.env.BACKEND_ACCOUNT_ADDRESS;
  if (!address) throw new Error('BACKEND_ACCOUNT_ADDRESS not configured');
  return address;
}

/**
 * Execute a contract call using the backend account
 */
export async function executeBackendCall(
  contractAddress: string,
  entrypoint: string,
  calldata: any[]
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const account = getBackendAccount();
    const result = await account.execute(
      { contractAddress, entrypoint, calldata: CallData.compile(calldata) },
      V3_DETAILS,
    );

    console.log(`Backend tx submitted: ${result.transaction_hash}`);
    console.log(`  Contract: ${contractAddress}`);
    console.log(`  Entrypoint: ${entrypoint}`);

    return { success: true, transactionHash: result.transaction_hash };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backend execute failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Execute a multicall (multiple contract calls in one tx) using the backend account
 */
export async function executeBackendMulticall(
  calls: Array<{ contractAddress: string; entrypoint: string; calldata: any[] }>
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const account = getBackendAccount();
    const compiledCalls = calls.map(c => ({
      contractAddress: c.contractAddress,
      entrypoint: c.entrypoint,
      calldata: CallData.compile(c.calldata),
    }));

    const result = await account.execute(compiledCalls, V3_DETAILS);
    console.log(`Backend multicall submitted: ${result.transaction_hash}`);
    return { success: true, transactionHash: result.transaction_hash };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Backend multicall failed:', message);
    return { success: false, error: message };
  }
}

/**
 * Spend user credits (backend only - uses authorized spender role)
 */
export async function spendUserCredits(
  userAddress: string,
  amount: bigint,
  reason: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  console.log(`[Credits] Spend: user=${userAddress}, amount=${amount}, reason=${reason}`);

  const { hasCredits, balance } = await checkUserCredits(userAddress, amount);
  if (!hasCredits) {
    return { success: false, error: `Insufficient credits. Balance: ${balance}, Required: ${amount}` };
  }

  return executeBackendCall(
    CONTRACTS.addresses.AgentCredits,
    'spend_credits',
    [userAddress, amount.toString(), CallData.compile([reason])]
  );
}

/**
 * Check if user has sufficient credits
 */
export async function checkUserCredits(
  userAddress: string,
  requiredCredits: bigint = BigInt(1)
): Promise<{ hasCredits: boolean; balance: bigint }> {
  try {
    const contract = new Contract(AgentCreditsAbi, CONTRACTS.addresses.AgentCredits, getProvider());
    const result = await contract.call('get_user_credits', [userAddress]);
    const balance = BigInt(result.toString());
    return { hasCredits: balance >= requiredCredits, balance };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { hasCredits: false, balance: BigInt(0) };
  }
}

/**
 * Get user credit balance
 */
export async function getUserCreditBalance(userAddress: string): Promise<bigint> {
  const { balance } = await checkUserCredits(userAddress);
  return balance;
}

/**
 * Check session credits for an agent
 */
export async function checkSessionCredits(
  userAddress: string,
  agentId: number
): Promise<{ hasCredits: boolean; balance: bigint }> {
  try {
    const contract = new Contract(AgentCreditsAbi, CONTRACTS.addresses.AgentCredits, getProvider());
    const result = await contract.call('get_session_credits', [
      userAddress,
      CONTRACTS.addresses.AgentNFT,
      agentId,
    ]);
    const balance = BigInt(result.toString());
    return { hasCredits: balance > BigInt(0), balance };
  } catch {
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
  const { hasCredits } = await checkSessionCredits(userAddress, agentId);
  if (!hasCredits) {
    return { success: false, error: 'No session credits available' };
  }

  console.log(`[Session] Using credit: user=${userAddress}, agentId=${agentId}`);
  return executeBackendCall(
    CONTRACTS.addresses.AgentCredits,
    'use_session_credit',
    [userAddress, CONTRACTS.addresses.AgentNFT, agentId]
  );
}

/**
 * Register agent wallet with RevenueShare contract
 */
export async function registerAgentWallet(
  agentId: number,
  walletAddress: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  console.log(`[RevenueShare] Register wallet: agentId=${agentId}, wallet=${walletAddress}`);
  return executeBackendCall(
    CONTRACTS.addresses.RevenueShare,
    'set_agent_wallet',
    [agentId, walletAddress]
  );
}

/**
 * Record a chat interaction on-chain
 */
export async function recordChatOnChain(
  agentId: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  console.log(`[AgentNFT] Recording chat for agent: ${agentId}`);
  return executeBackendCall(
    CONTRACTS.addresses.AgentNFT,
    'record_chat',
    [agentId]
  );
}

/**
 * Transfer an NFT from backend owner to a user
 */
export async function transferNFTToUser(
  tokenId: number,
  toAddress: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  console.log(`[AgentNFT] Transferring token ${tokenId} to ${toAddress}`);
  const fromAddress = getBackendAddress();

  return executeBackendCall(
    CONTRACTS.addresses.AgentNFT,
    'transfer_from',
    [fromAddress, toAddress, tokenId]
  );
}

/**
 * Spend credits + record chat in one multicall (avoids duplicate-nonce from concurrent txs)
 */
export async function spendCreditsAndRecordChat(
  userAddress: string,
  agentId: number,
  reason: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  const { hasCredits, balance } = await checkUserCredits(userAddress, BigInt(1));
  if (!hasCredits) {
    return { success: false, error: `Insufficient credits. Balance: ${balance}, Required: 1` };
  }

  const reasonFelt = shortString.encodeShortString(reason.slice(0, 31));
  console.log(`[Multicall] spend_credits + record_chat: user=${userAddress}, agent=${agentId}`);

  return executeBackendMulticall([
    {
      contractAddress: CONTRACTS.addresses.AgentCredits,
      entrypoint: 'spend_credits',
      calldata: [userAddress, '1', reasonFelt],
    },
    {
      contractAddress: CONTRACTS.addresses.AgentNFT,
      entrypoint: 'record_chat',
      calldata: [agentId.toString()],
    },
  ]);
}

/**
 * Use session credit + record chat in one multicall (avoids duplicate-nonce from concurrent txs)
 */
export async function useSessionAndRecordChat(
  userAddress: string,
  agentId: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  const { hasCredits } = await checkSessionCredits(userAddress, agentId);
  if (!hasCredits) {
    return { success: false, error: 'No session credits available' };
  }

  console.log(`[Multicall] use_session_credit + record_chat: user=${userAddress}, agent=${agentId}`);

  return executeBackendMulticall([
    {
      contractAddress: CONTRACTS.addresses.AgentCredits,
      entrypoint: 'use_session_credit',
      calldata: [userAddress, CONTRACTS.addresses.AgentNFT, agentId.toString()],
    },
    {
      contractAddress: CONTRACTS.addresses.AgentNFT,
      entrypoint: 'record_chat',
      calldata: [agentId.toString()],
    },
  ]);
}
