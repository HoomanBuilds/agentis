# Agentis

**The first decentralized AI agent creator economy on Starknet.**

Agentis lets anyone mint an AI agent as an NFT, define its personality, and earn revenue every time someone chats with it — all enforced by Cairo smart contracts on Starknet.

**Live:** [agentis-mocha.vercel.app](https://agentis-mocha.vercel.app) · **Network:** Starknet Sepolia

---

## What is Agentis?

On centralized platforms (Character.ai, OpenAI GPTs), creators build AI agents that generate millions of interactions — and earn $0. The platform owns the agent, captures all revenue, and can delete it at any time.

Agentis flips this:

- **Mint** an AI agent as an ERC721 NFT — you own it permanently
- **Earn** 80% of every session payment, enforced on-chain by the RevenueShare contract
- **Sell** your agent on the marketplace at any price
- **Level up** automatically every 100 chats — measurable on-chain reputation

Every payment is in STRK. Every revenue split is a Cairo contract call, not a platform promise.

---

## How It Works

### For Creators

1. Connect ArgentX or Braavos wallet
2. Define your agent's name, personality traits, and description
3. Optionally upload an image and a knowledge base document (for RAG)
4. Pay 10 STRK minting fee → receive an ERC721 NFT
5. Your agent is live. Every session purchase sends 80% directly to your wallet.

### For Users

1. Buy credits (0.1 STRK each, or bulk plans with up to 30% discount)
2. Or buy a session pack: 5 STRK for 50 messages with a specific agent
3. Chat with any public agent — each message is delivered via streaming AI
4. Every chat is recorded on-chain, leveling up the agent

### Credit Plans

| Plan | Price | Credits | Discount |
|------|-------|---------|----------|
| Free tier | — | 10 (one-time) | — |
| Individual | 0.1 STRK/credit | Any amount | — |
| Starter | 9 STRK | 100 | 10% |
| Pro | 40 STRK | 500 | 20% |
| Unlimited | 70 STRK | 1,000 | 30% |
| Session pack | 5 STRK | 50 (agent-specific) | — |

---

## Architecture

### Smart Contracts (Cairo, Starknet Sepolia)

Four interconnected Cairo contracts form a complete on-chain economy:

```
STRK Token
  │
  ├── AgentNFT          mint_agent (10 STRK) → ERC721 + personality hash on-chain
  │       └── record_chat → chat count + auto level-up every 100 chats
  │
  ├── AgentCredits       purchase_credits / purchase_plan / claim_free_tier
  │       └── spend_credits (authorized spender pattern — no user sig per message)
  │
  ├── RevenueShare       record_revenue → 80% creator / 20% platform
  │       └── withdraw_agent_earnings → direct to creator wallet
  │
  └── AgentMarketplace   list_agent / buy_agent (5% fee)
          └── creator_stats → on-chain sales volume for leaderboards
```

#### Authorized Spender Pattern

The backend wallet is registered as an authorized spender on `AgentCredits`. After each AI response is delivered, the backend calls `spend_credits(user, 1, reason)` without requiring a user signature per message. This is only possible via Starknet's native account abstraction — it would require ERC-4337 bundlers on EVM chains.

### Frontend (Next.js)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Wallet | `get-starknet-core` v4 (ArgentX, Braavos) |
| Starknet SDK | `starknet.js` v6+ |
| AI | Vercel AI SDK v5, OpenAI-compatible API |
| Vector DB | ChromaDB — persistent chat memory + knowledge base RAG |
| Storage | IPFS via Pinata (agent metadata + images) |
| Auth | Nonce-based sessions, httpOnly cookies |

---

## Contract Addresses (Starknet Sepolia)

| Contract | Address |
|----------|---------|
| AgentNFT | `0x02efcbabe92b04d58b19b75c5d3d7c741327fa9d9bae0451039e1753ad77b5c3` |
| AgentCredits | `0x006067f530519483394d2e2588c90fddaff5870f8710cc562184ae3cef30f9b4` |
| RevenueShare | `0x07f99fe77b58957b4d20d0a6b0a03a82953967d6a3b6763959169e44f3fc9807` |
| AgentMarketplace | `0x0397e87f72ca52c0fc61604e58afd731251ae445be278db0d53e723bbe80a758` |
| STRK Token | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` |

Verify on [Voyager Sepolia](https://sepolia.voyager.online).

---

## Project Structure

```
agentis/
├── contract/                    # Cairo smart contracts
│   ├── src/
│   │   ├── agent_nft.cairo      # ERC721 with chat tracking + leveling
│   │   ├── agent_credits.cairo  # Credit system, plans, session credits
│   │   ├── revenue_share.cairo  # 80/20 revenue split
│   │   ├── agent_marketplace.cairo  # P2P trading with creator stats
│   │   └── interfaces.cairo
│   ├── tests/
│   └── Scarb.toml
│
└── frontend/                    # Next.js application
    └── src/
        ├── app/
        │   ├── page.tsx             # Home
        │   ├── create/              # Mint new agent
        │   ├── agents/              # Browse all agents
        │   ├── agent/[id]/          # Agent detail + chat
        │   ├── marketplace/         # Buy/sell agents
        │   ├── profile/             # Wallet dashboard
        │   └── api/                 # 20+ API routes
        │       ├── chat/            # Streaming AI chat + credit deduction
        │       ├── agent/           # Agent metadata
        │       ├── credits/         # Credit balance + spending
        │       ├── marketplace*/    # Listing management
        │       ├── knowledge-base/  # RAG document upload + search
        │       ├── ipfs/            # Pinata upload/fetch
        │       └── stats/           # Platform metrics
        ├── components/
        │   ├── chat/                # Streaming chat UI, session management
        │   ├── create/              # Mint form, preview, progress
        │   ├── marketplace/         # Listings, buy flow
        │   ├── profile/             # Dashboard, earnings
        │   └── shared/              # Wallet connect, loading states
        ├── hooks/
        │   ├── useAgentNFT.ts       # Mint, read, transfer
        │   ├── useAgentCredits.ts   # Purchase, balance, sessions
        │   ├── useAgentMarketplace.ts
        │   └── useWallet.ts         # Connect/disconnect, balance
        ├── lib/
        │   ├── starknet-client.ts   # RpcProvider + Contract instances
        │   ├── backend-wallet.ts    # Server-side signing, multicalls
        │   ├── credits.ts           # Credit utilities
        │   ├── vectordb.ts          # ChromaDB memory + knowledge base
        │   ├── pinata.ts            # IPFS upload/resolve
        │   └── auth.ts              # Nonce sessions
        └── constants/
            ├── contracts.ts         # Addresses + pricing constants
            └── abis/                # Contract ABIs
```

---

## Local Development

### Prerequisites

- Node.js 18+
- [Scarb](https://docs.swmansion.com/scarb/) (for Cairo contracts)
- ArgentX or Braavos browser extension

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in env vars (see below)
npm run dev
```

### Contracts

```bash
cd contract
scarb build
# ABIs output to target/dev/agentis_*.contract_class.json

scarb test  # run snforge tests
```

### Environment Variables

```env
# Starknet
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Backend signing account (for server-side credit deduction + chat recording)
BACKEND_ACCOUNT_ADDRESS=0x...
BACKEND_PRIVATE_KEY=0x...

# IPFS (Pinata)
PINATA_JWT=...

# AI chat
OPENAI_API_KEY=...

# Vector DB (ChromaDB Cloud or leave blank for localhost:8000)
CHROMA_API_KEY=...
CHROMA_TENANT=...
CHROMA_DATABASE=...
```

> The backend account must be authorized as a spender on `AgentCredits`. Run `contract/scripts/authorize_backend_spender.sh` once after deployment.

---

## Key Technical Details

### V3 Transactions

All server-side transactions use Starknet V3 with explicit resource bounds (no fee estimation, which breaks with some RPC providers):

```ts
const V3_DETAILS = {
  version: constants.TRANSACTION_VERSION.V3,
  resourceBounds: {
    l1_gas:      { max_amount: '0x5000',   max_price_per_unit: '0xB5E620F48000' },
    l1_data_gas: { max_amount: '0x5000',   max_price_per_unit: '0xB5E620F48000' },
    l2_gas:      { max_amount: '0x500000', max_price_per_unit: '0x174876E800' },
  },
};
```

### Multicall for Atomic Operations

Credit spending and chat recording happen in a single multicall to prevent duplicate-nonce errors from concurrent transactions:

```ts
// spend_credits + record_chat in one tx
spendCreditsAndRecordChat(userAddress, agentId, reason)
```

### Knowledge Base (RAG)

When an agent is minted with a knowledge base document, the file is chunked into ~800-character paragraphs and stored in ChromaDB under `knowledgeBaseId = tokenId`. During chat, relevant chunks are retrieved and injected into the system prompt.

ChromaDB Cloud free tier enforces a 16KB limit per `Add` call — the vectordb layer batches inserts by accumulated byte size (14KB per batch).

---

## Revenue Model

| Source | Fee | Split |
|--------|-----|-------|
| Agent minting | 10 STRK | 100% platform |
| Credit purchase | 0.1 STRK/credit | 100% platform |
| Bulk plans | 9–70 STRK | 100% platform |
| Session pack (50 msgs) | 5 STRK | **80% creator / 20% platform** |
| Marketplace sale | 5% of sale price | 100% platform |

All splits enforced by `RevenueShare.cairo`. Platform never holds user funds — withdrawals go directly to creator wallets.

---

## Roadmap

- [x] 4 Cairo contracts deployed on Sepolia
- [x] Production frontend with streaming AI chat
- [x] ChromaDB vector memory + knowledge base RAG
- [x] IPFS metadata and image storage
- [x] ArgentX / Braavos wallet integration
- [x] Authorized spender + multicall credit system
- [ ] Mainnet deployment + security audit
- [ ] Paymaster integration (gasless UX via AVNU)
- [ ] Creator analytics dashboard
- [ ] StarknetID integration
- [ ] Agent-to-agent communication
- [ ] Mobile app (iOS + Android)

---

## License

MIT
