<p align="center">
  <img alt="Agentis" src="frontend/public/agentis-logo.png" width="90" />
</p>

<h1 align="center">Agentis</h1>

<p align="center">The first decentralized AI agent creator economy on Starknet.</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/Cairo-Smart%20Contracts-c3e834?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6TTIgMTdsOCA0IDgtNE0yIDEybDggNCA4LTQiLz48L3N2Zz4=" />
  <img src="https://img.shields.io/badge/Starknet-Sepolia-c3e834?style=flat-square&logo=ethereum&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/IPFS-Pinata-6c47ff?style=flat-square&logo=ipfs&logoColor=white" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector%20DB-f97316?style=flat-square" />
  <img src="https://img.shields.io/badge/OpenAI-Compatible-412991?style=flat-square&logo=openai&logoColor=white" />
</p>

> The first decentralized AI agent creator economy on Starknet. Mint agents as NFTs. Earn 80% of every session. Trade them on-chain.

Agentis is a platform where anyone can create an AI agent, define its personality, and own it permanently as an ERC721 NFT on Starknet. Every time someone pays to chat with your agent, 80% of that payment lands in your wallet, enforced by a Cairo smart contract, not a platform policy. Agents level up based on chat count recorded on-chain. A built-in marketplace lets owners list and sell agents at any price.

The problem it solves: on every centralized AI platform today (Character.ai, OpenAI GPTs, Claude Projects), creators build agents that drive millions of interactions and earn exactly $0. The platform owns the agent, captures all revenue, and can delete it at any time. Agentis gives creators verifiable ownership, on-chain revenue, and a secondary market.

**Live:** [agentis-mocha.vercel.app](https://agentis-mocha.vercel.app) · **Network:** Starknet Sepolia

---

## Table of Contents

- [What Agentis Does](#what-agentis-does)
- [How It Works](#how-it-works)
  - [Creating an Agent](#creating-an-agent)
  - [The Chat System](#the-chat-system)
  - [The Credit System](#the-credit-system)
  - [The Marketplace](#the-marketplace)
- [Smart Contracts](#smart-contracts)
- [Why Starknet](#why-starknet)
- [Deployed Contracts](#deployed-contracts)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)

---

## What Agentis Does

Agentis is four systems working together:

1. **AgentNFT.** A Cairo ERC721 contract on Starknet Sepolia. Minting costs 10 STRK and produces an NFT whose on-chain metadata stores a hash of the agent's personality definition. Every chat is recorded on-chain, and every 100 chats triggers an automatic level-up.

2. **AgentCredits.** A dual-credit system. General credits work across all your own agents. Session credits (5 STRK for 50 messages) are scoped to a specific agent; 80% of that payment flows to the agent owner via the RevenueShare contract. The backend wallet is registered as an authorized spender, so credit deduction happens server-side after each AI response without requiring a user signature per message.

3. **RevenueShare.** A Cairo contract that enforces an 80/20 split between agent creators and the platform. It stores a complete audit trail of every revenue event (payer, amount, source, timestamp) and supports creator-configurable withdrawal addresses.

4. **AgentMarketplace.** A P2P trading contract where owners list agents at any STRK price. Buyers execute a multicall (approve + buy in one transaction). The marketplace tracks creator sales volume and count on-chain, which powers the leaderboard.

---

## How It Works

### Creating an Agent

A creator connects ArgentX or Braavos, fills in a name, personality traits, and a description. They can optionally upload a profile image (stored on IPFS via Pinata) and a knowledge base document (stored in ChromaDB for RAG retrieval during chat). The frontend builds a JSON metadata object, uploads it to IPFS, and calls `mint_agent(name, tokenUri, personalityHash)` on AgentNFT after the user approves the 10 STRK fee.

```
Creator defines personality
  → metadata + image uploaded to IPFS
  → knowledge base chunked and stored in ChromaDB (if provided)
  → personalityHash = btoa(encodeURIComponent(JSON.stringify({traits, description})))
  → [STRK approve, mint_agent(name, tokenUri, personalityHash)] multicall
  → ERC721 minted, personality hash anchored on-chain
```

The personality hash is a deterministic fingerprint of the agent's original definition. It can be verified on-chain at any time, proving the creator authored this agent independently of the platform.

### The Chat System

When a user opens a chat, the frontend calls the `/api/chat` route, which:

1. Verifies the user's session (nonce-based auth, httpOnly cookie).
2. Checks credit balance: either general credits or session credits for this agent.
3. Fetches the agent's metadata from IPFS to build the system prompt.
4. Queries ChromaDB for relevant knowledge base chunks (RAG) and recent message history.
5. Streams the AI response back to the browser via Vercel AI SDK.
6. After the response completes, fires a single multicall: `spend_credits + record_chat` in one transaction, with no duplicate-nonce issues and no separate async transactions that could fail independently.

The multicall is the key architectural detail. Two separate `account.execute()` calls would grab the same nonce and one would fail. Combining them into one transaction via `executeBackendMulticall()` is atomic.

```
User sends message
  → session + credit check
  → fetch agent metadata from IPFS (cached)
  → ChromaDB: retrieve relevant knowledge base chunks + recent history
  → stream AI response (OpenAI-compatible API)
  → response complete → multicall: spend_credits(user, 1) + record_chat(agentId)
  → credit balance decremented, chat count incremented in single tx
```

### The Credit System

| Method | Cost | Who gets revenue |
|--------|------|-----------------|
| Claim free tier | free | 10 credits, one-time per wallet |
| Buy credits | 0.1 STRK each | 100% platform |
| Starter plan | 9 STRK | 100 credits, 10% discount |
| Pro plan | 40 STRK | 500 credits, 20% discount |
| Power plan | 70 STRK | 1,000 credits, 30% discount |
| Session pack | 5 STRK | 50 agent-specific credits (80% to creator / 20% platform) |

The session pack is the creator monetization path. When a user buys a session pack for agent #42, the AgentCredits contract calls `RevenueShare.record_revenue()`, which splits the 5 STRK immediately: 4 STRK to the agent owner's wallet, 1 STRK to the platform.

### The Marketplace

Owners call `list_agent(nftContract, tokenId, price)` on AgentMarketplace. Buyers execute a two-call multicall (`STRK.approve(marketplace, price)` followed by `marketplace.buy_agent(nftContract, tokenId)`), so the token transfer and NFT ownership change are atomic. The marketplace takes a 5% fee; the rest goes to the seller. All creator statistics (total sales volume, number of sales) are tracked on-chain and feed the leaderboard.

---

## Smart Contracts

### AgentNFT

ERC721 with extended on-chain state. Every token stores its name, IPFS token URI, personality hash, creator address, chat count, level, and visibility flag. `record_chat()` is the most-called function: it increments the chat count and emits `AgentLevelUp` when `chat_count % 100 == 0`. Only the authorized backend can call it.

Key entry points: `mint_agent`, `record_chat`, `set_agent_public`, `transfer_from`, `get_agent_metadata`, `get_agent_creator`

### AgentCredits

Dual-ledger credit contract. `balances` maps wallet addresses to general credits. `session_credits` maps `(user, nftContract, tokenId)` tuples to session-specific balances. The `authorized_spenders` map lets the backend wallet deduct credits without user signatures; this is the mechanism that makes per-message payments seamless.

Key entry points: `purchase_credits`, `purchase_plan`, `claim_free_tier`, `purchase_session`, `spend_credits`, `use_session_credit`, `set_authorized_spender`

### RevenueShare

Every `record_revenue(tokenId, amount, payer, source)` call stores the full event in indexed storage and splits the amount: 80% to `agent_wallet[tokenId]` (defaults to the NFT owner, can be updated), 20% to the platform. `withdraw_agent_earnings()` lets creators pull accumulated balance at any time.

Key entry points: `record_revenue`, `withdraw_agent_earnings`, `withdraw_platform_earnings`, `set_agent_wallet`, `update_revenue_split`

### AgentMarketplace

Listing state is stored as `(nftContract, tokenId) -> (seller, price, active, listedAt)`. The `buy_agent` call validates the listing, transfers STRK (5% fee to platform, 95% to seller), transfers the NFT, and updates `creator_volume` and `creator_sales` on the seller for leaderboard ranking.

Key entry points: `list_agent`, `buy_agent`, `cancel_listing`, `update_price`, `get_creator_stats`

---

## Why Starknet

Agentis is built specifically for Starknet, not ported to it.

**Sub-cent transactions make per-chat recording viable.** Every message is recorded on-chain. At steady state (500 active agents, 20 sessions/month, 10 messages each) that's 100,000 on-chain transactions per month. On Ethereum L1 that would cost $500K-$5M/month. On Starknet it costs under $1,000.

**Native account abstraction enables the authorized spender pattern.** The backend deducts credits after each AI response without asking the user to sign a transaction. On EVM chains this would require ERC-4337 bundlers and paymaster contracts. On Starknet it's a single `set_authorized_spender` call because every account is a contract.

**Multicall is first-class.** The approve+buy marketplace flow and the spend_credits+record_chat chat flow both use multicall: multiple contract calls in a single transaction, sharing one nonce. This is native to Starknet account architecture.

---

## Deployed Contracts

All contracts are live on Starknet Sepolia testnet.

| Contract | Address | Explorer |
|----------|---------|---------|
| AgentNFT | `0x02efcbabe92b04d58b19b75c5d3d7c741327fa9d9bae0451039e1753ad77b5c3` | [View](https://sepolia.voyager.online/contract/0x02efcbabe92b04d58b19b75c5d3d7c741327fa9d9bae0451039e1753ad77b5c3) |
| AgentCredits | `0x006067f530519483394d2e2588c90fddaff5870f8710cc562184ae3cef30f9b4` | [View](https://sepolia.voyager.online/contract/0x006067f530519483394d2e2588c90fddaff5870f8710cc562184ae3cef30f9b4) |
| RevenueShare | `0x07f99fe77b58957b4d20d0a6b0a03a82953967d6a3b6763959169e44f3fc9807` | [View](https://sepolia.voyager.online/contract/0x07f99fe77b58957b4d20d0a6b0a03a82953967d6a3b6763959169e44f3fc9807) |
| AgentMarketplace | `0x0397e87f72ca52c0fc61604e58afd731251ae445be278db0d53e723bbe80a758` | [View](https://sepolia.voyager.online/contract/0x0397e87f72ca52c0fc61604e58afd731251ae445be278db0d53e723bbe80a758) |
| STRK Token | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` | [View](https://sepolia.voyager.online/contract/0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d) |

---

## Project Structure

```
agentis/
├── contract/                              - Cairo smart contracts (Scarb + snforge)
│   ├── src/
│   │   ├── agent_nft.cairo                - ERC721 with chat tracking and leveling
│   │   ├── agent_credits.cairo            - dual-credit system, plans, authorized spender
│   │   ├── revenue_share.cairo            - 80/20 revenue split with audit trail
│   │   ├── agent_marketplace.cairo        - P2P trading, 5% fee, creator statistics
│   │   └── interfaces.cairo
│   ├── tests/                             - snforge test suite
│   ├── scripts/
│   │   └── authorize_backend_spender.sh   - one-time: register backend as credit spender
│   └── Scarb.toml
│
└── frontend/                              - Next.js 16 application (App Router)
    └── src/
        ├── app/
        │   ├── page.tsx                   - home page
        │   ├── create/                    - mint a new agent
        │   ├── agents/                    - browse all public agents
        │   ├── agent/[id]/                - agent detail + chat interface
        │   ├── marketplace/               - buy and sell agents
        │   ├── profile/                   - wallet dashboard, earnings, owned agents
        │   └── api/
        │       ├── chat/                  - streaming AI + credit deduction (multicall)
        │       ├── agent/                 - read agent metadata + IPFS resolution
        │       ├── credits/               - balance reads and spending
        │       ├── knowledge-base/        - RAG document upload and search
        │       ├── marketplace-listing/   - listing management
        │       ├── ipfs/                  - Pinata upload and fetch with caching
        │       ├── stats/                 - platform-wide metrics
        │       ├── auth/                  - nonce generation and session verification
        │       └── leaderboard/           - top agents and top creators
        ├── components/
        │   ├── chat/                      - streaming chat UI, session management
        │   ├── create/                    - mint form, live preview, progress modal
        │   ├── marketplace/               - listings grid, buy flow
        │   ├── profile/                   - dashboard, earnings, owned agents
        │   └── shared/                    - wallet connect state, loading pages
        ├── hooks/
        │   ├── useAgentNFT.ts             - mint, read metadata, transfer
        │   ├── useAgentCredits.ts         - purchase credits, check balance, session credits
        │   ├── useAgentMarketplace.ts     - list, buy, cancel, update price
        │   └── useWallet.ts               - connect/disconnect, balance, active key
        ├── lib/
        │   ├── starknet-client.ts         - RpcProvider singleton + Contract instances
        │   ├── backend-wallet.ts          - server-side signing, multicall helpers
        │   ├── credits.ts                 - credit check and spend utilities
        │   ├── vectordb.ts                - ChromaDB memory and knowledge base (RAG)
        │   ├── pinata.ts                  - IPFS upload and resolve
        │   └── auth.ts                    - nonce sessions, httpOnly cookies
        └── constants/
            ├── contracts.ts               - deployed addresses, pricing constants
            └── abis/                      - AgentNFT, AgentCredits, RevenueShare, AgentMarketplace
```

---

## Quick Start

You need Node.js 18+, [Scarb](https://docs.swmansion.com/scarb/) for Cairo, and ArgentX or Braavos installed in your browser.

```bash
git clone https://github.com/hoomanbuilds/agentis
cd agentis

# frontend
cd frontend
npm install
cp .env.example .env.local
# fill in env vars (see below)
npm run dev
# open http://localhost:3000
```

```bash
# contracts (optional, already deployed on Sepolia)
cd contract
scarb build
scarb test

# after a fresh deployment, authorize the backend as a credit spender (one-time)
bash scripts/authorize_backend_spender.sh
```

### Testing the Full Flow

1. Open `http://localhost:3000`, connect ArgentX on Starknet Sepolia.
2. Claim your 10 free credits at `/profile`.
3. Go to `/create`. Fill in a name and personality, optionally add an image or a knowledge base `.txt` file. Pay 10 STRK to mint.
4. After minting, visit your agent's page. Start a chat; each message costs 1 credit.
5. Check the transaction on [Voyager Sepolia](https://sepolia.voyager.online) and you will see `record_chat` and `spend_credits` in the same multicall transaction.
6. Buy a session pack from the agent's page (5 STRK for 50 messages). 80% of that goes directly to the agent owner's wallet.

---

## Environment Variables

```env
# Starknet RPC
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Backend signing account, used for server-side credit deduction and chat recording.
# Must be authorized as a spender on AgentCredits via authorize_backend_spender.sh
BACKEND_ACCOUNT_ADDRESS=0x...
BACKEND_PRIVATE_KEY=0x...

# Pinata JWT for IPFS metadata and image uploads
PINATA_JWT=...

# Any OpenAI-compatible endpoint
OPENAI_API_KEY=...

# ChromaDB (leave blank to use localhost:8000, or set Cloud credentials)
CHROMA_API_KEY=
CHROMA_TENANT=
CHROMA_DATABASE=
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contracts | Cairo, Scarb, snforge |
| Blockchain | Starknet (Sepolia testnet) |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Wallet | `get-starknet-core` v4 (ArgentX, Braavos) |
| Starknet SDK | `starknet.js` v6+ (V3 transactions, multicall) |
| AI | Vercel AI SDK v5, OpenAI-compatible API (streaming) |
| Vector DB | ChromaDB v3 (persistent chat memory + knowledge base RAG) |
| Storage | IPFS via Pinata (agent metadata and images) |
| Auth | Nonce-based sessions, httpOnly cookies |
| State | TanStack React Query v5 |

---

*Your agent. Your earnings. On-chain.*
