import { RpcProvider, Contract, Account, ec, hash, num, CallData, uint256, constants } from 'starknet';
import { CONTRACTS } from '@/constants/contracts';
import RevenueShareAbi from '@/constants/abis/RevenueShare.json';
import { formatSTRK } from './starknet-client';
import { executeBackendCall, getBackendAccount } from './backend-wallet';

// Same account class as our backend wallet (deployed on Sepolia)
const ACCOUNT_CLASS_HASH = '0x5b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564';

function getProvider(): RpcProvider {
  return new RpcProvider({ nodeUrl: CONTRACTS.rpcUrl });
}

export function deriveAgentPrivateKey(tokenId: number): string {
  const backendKey = process.env.BACKEND_PRIVATE_KEY;
  if (!backendKey) throw new Error('BACKEND_PRIVATE_KEY not configured');

  const seed = hash.computePedersenHash(backendKey, num.toHex(tokenId));
  const key = ec.starkCurve.grindKey(seed);
  return key.startsWith('0x') ? key : '0x' + key;
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

const V3_DETAILS = {
  version: constants.TRANSACTION_VERSION.V3 as any,
  resourceBounds: {
    l1_gas: { max_amount: '0x200', max_price_per_unit: '0x140AED98C0A144' },
    l1_data_gas: { max_amount: '0x200', max_price_per_unit: '0x140AED98C0A144' },
    l2_gas: { max_amount: '0x500000', max_price_per_unit: '0x174876E800' },
  },
};

// Lower bounds for deploy_account (validation checks max_fee <= balance)
const DEPLOY_V3 = {
  version: constants.TRANSACTION_VERSION.V3 as any,
  resourceBounds: {
    l1_gas: { max_amount: '0x200', max_price_per_unit: '0x15BEAFE6C2781A' },
    l1_data_gas: { max_amount: '0x200', max_price_per_unit: '0x1A638FB3AF8' },
    l2_gas: { max_amount: '0x300000', max_price_per_unit: '0x15632A6B49' },
  },
};

export async function isAgentAccountDeployed(tokenId: number): Promise<boolean> {
  const address = deriveAgentAccountAddress(tokenId);
  const provider = getProvider();
  try {
    await provider.getClassHashAt(address, 'latest');
    return true;
  } catch {
    return false;
  }
}

export async function deployAgentAccount(tokenId: number): Promise<string> {
  const deployed = await isAgentAccountDeployed(tokenId);
  if (deployed) return deriveAgentAccountAddress(tokenId);

  const privateKey = deriveAgentPrivateKey(tokenId);
  const publicKey = deriveAgentStarkKey(tokenId);
  const accountAddress = deriveAgentAccountAddress(tokenId);
  const provider = getProvider();

  // Fund with 5 STRK (deploy max fee is ~3.4 STRK)
  const fundAmount = uint256.bnToUint256(BigInt('5000000000000000000'));
  const backendAccount = getBackendAccount();
  const fundTx = await backendAccount.execute({
    contractAddress: CONTRACTS.addresses.STRK,
    entrypoint: 'transfer',
    calldata: CallData.compile([accountAddress, fundAmount]),
  }, V3_DETAILS);
  console.log(`[agent-wallet] Funded ${accountAddress} with 5 STRK, tx: ${fundTx.transaction_hash}`);
  await provider.waitForTransaction(fundTx.transaction_hash);

  const agentAccount = new Account(provider, accountAddress, privateKey, '1', constants.TRANSACTION_VERSION.V3);
  const deployTx = await agentAccount.deployAccount({
    classHash: ACCOUNT_CLASS_HASH,
    constructorCalldata: CallData.compile({ public_key: publicKey }),
    addressSalt: publicKey,
  }, DEPLOY_V3);
  console.log(`[agent-wallet] Deployed agent ${tokenId} account, tx: ${deployTx.transaction_hash}`);
  await provider.waitForTransaction(deployTx.transaction_hash);

  return accountAddress;
}

export async function transferFromAgentWallet(
  tokenId: number,
  toAddress: string,
  amount: bigint
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    await deployAgentAccount(tokenId);

    const privateKey = deriveAgentPrivateKey(tokenId);
    const accountAddress = deriveAgentAccountAddress(tokenId);
    const provider = getProvider();

    const agentAccount = new Account(provider, accountAddress, privateKey, '1', constants.TRANSACTION_VERSION.V3);
    const result = await agentAccount.execute({
      contractAddress: CONTRACTS.addresses.STRK,
      entrypoint: 'transfer',
      calldata: CallData.compile([toAddress, uint256.bnToUint256(amount)]),
    }, DEPLOY_V3);

    console.log(`[agent-wallet] Transferred ${amount} from agent ${tokenId} to ${toAddress}, tx: ${result.transaction_hash}`);
    return { success: true, transactionHash: result.transaction_hash };
  } catch (error: any) {
    console.error(`[agent-wallet] Transfer failed:`, error);
    return { success: false, error: error.message || 'Transfer failed' };
  }
}

export async function agentPurchaseCredits(
  agentId: number,
  amount: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    return await executeBackendCall(
      CONTRACTS.addresses.AgentCredits,
      'purchase_credits',
      [amount]
    );
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to purchase credits' };
  }
}
