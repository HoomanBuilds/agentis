/**
 * One-time script: set AgentNFT minting fee to 0 on the deployed contract.
 *
 * The deployed contract has a u128/u256 mismatch when calling STRK.transfer_from —
 * the fee payment always fails. Setting the fee to 0 bypasses the transfer_from
 * call entirely (the `if fee > 0` guard is skipped), making minting functional
 * while the fixed contract is being redeployed.
 *
 * Usage:
 *   cd /home/shreyas/code/work/agentis
 *   BACKEND_ACCOUNT_ADDRESS=0x... BACKEND_PRIVATE_KEY=0x... node scripts/set-minting-fee.mjs
 *
 *   Or with .env:
 *   node --env-file=frontend/.env scripts/set-minting-fee.mjs
 */

import { Account, RpcProvider, CallData } from 'starknet';

const RPC_URL = process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://api.cartridge.gg/x/starknet/sepolia';
const AGENT_NFT = '0x021da685fadac9146fa0753ea29b023e2c75d7903612656bb1a164a146c02ae6';

const privateKey = process.env.BACKEND_PRIVATE_KEY;
const accountAddress = process.env.BACKEND_ACCOUNT_ADDRESS;

if (!privateKey || !accountAddress) {
  console.error('Set BACKEND_PRIVATE_KEY and BACKEND_ACCOUNT_ADDRESS env vars');
  process.exit(1);
}

const provider = new RpcProvider({ nodeUrl: RPC_URL });
const account = new Account(provider, accountAddress, privateKey);

console.log('Setting minting fee to 0...');
console.log('  AgentNFT:', AGENT_NFT);
console.log('  Owner account:', accountAddress);

try {
  const result = await account.execute({
    contractAddress: AGENT_NFT,
    entrypoint: 'set_minting_fee',
    calldata: CallData.compile(['0']),   // new_fee: u128 = 0
  });

  console.log('Tx submitted:', result.transaction_hash);
  console.log('  https://sepolia.voyager.online/tx/' + result.transaction_hash);

  // Wait for confirmation
  console.log('Waiting for confirmation...');
  await provider.waitForTransaction(result.transaction_hash);
  console.log('Done. Minting fee is now 0 STRK.');
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
