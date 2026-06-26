const FALLBACK_RPCS = [
  'https://api.cartridge.gg/x/starknet/sepolia',
  'https://free-rpc.nethermind.io/sepolia-juno/v0_7',
];

export const CONTRACTS = {
  network: 'sepolia' as const,
  rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || FALLBACK_RPCS[0],
  fallbackRpcUrls: FALLBACK_RPCS,
  explorerUrl: 'https://sepolia.voyager.online',

  addresses: {
    AgentNFT: '0x02efcbabe92b04d58b19b75c5d3d7c741327fa9d9bae0451039e1753ad77b5c3',
    AgentMarketplace: '0x0397e87f72ca52c0fc61604e58afd731251ae445be278db0d53e723bbe80a758',
    RevenueShare: '0x07f99fe77b58957b4d20d0a6b0a03a82953967d6a3b6763959169e44f3fc9807',
    AgentCredits: '0x006067f530519483394d2e2588c90fddaff5870f8710cc562184ae3cef30f9b4',
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
