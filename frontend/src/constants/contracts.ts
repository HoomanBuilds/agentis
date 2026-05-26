export const CONTRACTS = {
  network: 'sepolia' as const,
  rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://api.cartridge.gg/x/starknet/sepolia',
  explorerUrl: 'https://sepolia.voyager.online',

  addresses: {
    AgentNFT: '0x021da685fadac9146fa0753ea29b023e2c75d7903612656bb1a164a146c02ae6',
    AgentMarketplace: '0x0497f402ea0a1ca75db9e3766f21a07ab43c26cae792bca62d56ecfa961be016',
    RevenueShare: '0x06a8ecb9e0a14e9bdbfb514a2c40acbdf99700573b039c5aed0eb856c93e1ab2',
    AgentCredits: '0x070acc051f8df0a1a33455764985b885128e469ec7a1cab9def9cec7a7832df6',
    STRK: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
  },

  // Backend/owner account address on Starknet
  OWNER_ADDRESS: '0x0370a7a0169c5018b185e01023f0ab5fb4bac660ff87e7bc0dc52c400c5b28f9',
} as const;

// Token decimals (STRK uses 18 decimals like ETH)
export const TOKEN_DECIMALS = 18;

// Minting fee (read from contract, this is default) - 10 STRK in wei
export const DEFAULT_MINTING_FEE = BigInt('10000000000000000000');

// Credit pricing - 0.1 STRK per credit in wei
export const CREDIT_PRICE = BigInt('100000000000000000');
export const FREE_TIER_CREDITS = BigInt(10);

// Session pricing - 5 STRK for 50 session credits
export const SESSION_COST = BigInt('5000000000000000000');

// Type helpers
export type ContractName = keyof typeof CONTRACTS.addresses;
