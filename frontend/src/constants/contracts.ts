export const CONTRACTS = {
  network: 'sepolia' as const,
  rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
  explorerUrl: 'https://sepolia.voyager.online',

  addresses: {
    AgentNFT: '0x04b5333d96dd95f0d8f8d9727cb23420575239e4448c9cc30a89f31b1bd2612f',
    AgentMarketplace: '0x057cff38e58af4db96ec4d2afe421da1b75c48ecde419ed26869846f775fa848',
    RevenueShare: '0x06307038ef05caa67dd65352d2aa9b1fa3ac5b2f81ea8541ba77c503a331e423',
    AgentCredits: '0x044d35290e39f2353fcfe4645ffb42b3af4e1fd7b190930505c302cbf04eeef9',
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
