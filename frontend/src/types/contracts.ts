// Agent NFT Types
export interface AgentMetadata {
  name: string;
  personalityHash: string;
  createdAt: number;
  creator: string;
  chatCount: bigint;
  level: bigint;
}

export interface Agent {
  tokenId: bigint;
  owner: string;
  metadata: AgentMetadata;
  isPublic: boolean;
  tokenUri?: string;
}

// Marketplace Types
export interface Listing {
  seller: string;
  price: bigint;
  active: boolean;
  listedAt: number;
}

export interface MarketplaceListing extends Agent {
  listing: Listing;
}

// Credits Types
export interface CreditPlan {
  id: bigint;
  credits: bigint;
  price: bigint;
  discountPercent: bigint;
  active: boolean;
}

export interface UserCredits {
  balance: bigint;
  hasClaimedFreeTier: boolean;
}

export interface SessionCredits {
  nftContract: string;
  agentId: bigint;
  credits: bigint;
}

// Revenue Share Types
export interface AgentStats {
  totalEarnings: bigint;
  withdrawn: bigint;
  pending: bigint;
}

export interface RevenueRecord {
  tokenId: bigint;
  amount: bigint;
  payer: string;
  source: 'ContentSale' | 'Marketplace' | 'Custom';
  timestamp: number;
}

// Wallet Types
export interface StarknetWalletState {
  isConnected: boolean;
  activeKey: string | null;
}

// Transaction Types
export interface TransactionResult {
  transactionHash: string;
  success: boolean;
  errorMessage?: string;
}
