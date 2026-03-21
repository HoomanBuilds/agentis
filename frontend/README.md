# Frontend

Next.js 16 application for Agentis — AI Agent NFT platform on Starknet.

---

## Prerequisites

- **Node.js** v18 or higher

  ```bash
  node --version  # Should be >= 18.0.0
  ```

- **ArgentX or Braavos** wallet browser extension

- **ChromaDB** (for agent memory/RAG)

  ```bash
  # Option 1: Docker (recommended)
  docker run -d -p 8000:8000 chromadb/chroma

  # Option 2: Chroma Cloud (set CHROMA_API_KEY in .env)
  ```

---

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# (see Environment Variables section below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create `.env.local` from the template:

```bash
cp .env.example .env.local
```

### Starknet

| Variable                       | Description              | Example                                                    |
| ------------------------------ | ------------------------ | ---------------------------------------------------------- |
| `NEXT_PUBLIC_STARKNET_RPC_URL` | Starknet RPC endpoint    | `https://starknet-sepolia.public.blastapi.io/rpc/v0_7`    |
| `NEXT_PUBLIC_BASE_URL`         | Base URL of deployed app | `https://agentis-mocha.vercel.app`                         |

> **Note:** Contract addresses are configured in `src/constants/contracts.ts`, not via environment variables.

### Pinata (IPFS)

| Variable                     | Description                    | Get from                                                        |
| ---------------------------- | ------------------------------ | --------------------------------------------------------------- |
| `NEXT_PUBLIC_PINATA_JWT`     | Pinata JWT token               | [Pinata API Keys](https://app.pinata.cloud/developers/api-keys) |
| `NEXT_PUBLIC_PINATA_GATEWAY` | Custom IPFS gateway (optional) | Default: `https://gateway.pinata.cloud`                         |

### OpenAI

| Variable         | Description             | Get from                                                |
| ---------------- | ----------------------- | ------------------------------------------------------- |
| `OPENAI_API_KEY` | OpenAI API key for chat | [OpenAI API Keys](https://platform.openai.com/api-keys) |

### ChromaDB

For local development:

| Variable     | Description             | Default                 |
| ------------ | ----------------------- | ----------------------- |
| `CHROMA_URL` | Local ChromaDB endpoint | `http://localhost:8000` |

For Chroma Cloud:

| Variable          | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `CHROMA_API_KEY`  | Chroma Cloud API key (if set, uses Cloud instead of local) |
| `CHROMA_TENANT`   | Chroma Cloud tenant                                        |
| `CHROMA_DATABASE` | Chroma Cloud database                                      |

### Backend Wallet (Server-side only)

| Variable                 | Description                     |
| ------------------------ | ------------------------------- |
| `BACKEND_ACCOUNT_ADDRESS`| Starknet account address        |
| `BACKEND_PRIVATE_KEY`    | Stark curve private key         |

Used for:

- Authorized spending of credits (`spendCredits`, `useSessionCredit`)
- Registering agent wallets with RevenueShare contract
- Recording chat interactions for leaderboards
- Deriving deterministic agent wallets

> **Important:** Must be set as authorized spender on the AgentCredits contract after deployment.

---

## Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Build production bundle                  |
| `npm run start` | Start production server                  |
| `npm run lint`  | Run ESLint                               |

---

## Tech Stack

| Technology     | Version | Purpose                                   |
| -------------- | ------- | ----------------------------------------- |
| Next.js        | 16.0.10 | App Router, Server Components, API Routes |
| React          | 19.2.1  | UI framework                              |
| TypeScript     | 5.x     | Type safety                               |
| Tailwind CSS   | 4.x     | Styling                                   |
| TanStack Query | 5.x     | Server state management                   |
| starknet.js    | 6.x     | Blockchain interactions                   |
| Vercel AI SDK  | 5.x     | Streaming AI responses                    |
| ChromaDB       | 3.x     | Vector storage for RAG                    |
| GSAP           | 3.x     | Animations                                |
| Lucide React   | —       | Icons                                     |

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home page
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles
│   │   ├── agent/[id]/         # Agent detail page
│   │   ├── create/             # Mint new agent
│   │   ├── marketplace/        # Browse & buy agents
│   │   ├── profile/            # User dashboard
│   │   └── api/                # API routes
│   │       ├── agent/          # Agent metadata & settings
│   │       ├── agent-wallet/   # Wallet management
│   │       ├── auth/           # Session auth
│   │       ├── chat/           # AI chat endpoints
│   │       ├── contract/       # Contract calls
│   │       ├── credits/        # Credit operations
│   │       ├── ipfs/           # Pinata uploads
│   │       ├── knowledge-base/ # Document processing
│   │       ├── leaderboard/    # Rankings
│   │       ├── memory/         # ChromaDB operations
│   │       └── stats/          # Platform stats
│   │
│   ├── components/             # React components
│   │   ├── chat/               # Chat interface
│   │   ├── create/             # Minting flow
│   │   ├── home/               # Landing page sections
│   │   ├── marketplace/        # Listings & cards
│   │   ├── profile/            # User profile
│   │   └── shared/             # Common components
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useWallet.tsx       # Starknet wallet connection
│   │   ├── useAgentNFT.ts      # NFT contract interactions
│   │   ├── useAgentMarketplace.ts # Marketplace operations
│   │   ├── useAgentCredits.ts  # Credit management
│   │   ├── useRevenueShare.ts  # Revenue operations
│   │   └── useAgentChat.ts     # AI chat with memory
│   │
│   ├── lib/                    # Utilities
│   │   ├── starknet-client.ts  # Starknet RPC & contract instances
│   │   ├── backend-wallet.ts   # Server-side signing
│   │   ├── pinata.ts           # IPFS uploads
│   │   ├── vectordb.ts         # ChromaDB client
│   │   └── agent-wallet.ts     # Wallet derivation
│   │
│   ├── constants/              # Contract addresses, ABIs
│   ├── providers/              # React context providers
│   └── types/                  # TypeScript types
│
├── public/                     # Static assets
├── .env.example                # Environment template
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript config
```

---

## Key Features

### Wallet Integration

Connect via ArgentX or Braavos wallet extension:

```typescript
import { useWallet } from "@/hooks/useWallet";

const { connect, disconnect, activeAccount, isConnected } = useWallet();
```

### Contract Interactions

Use typed hooks for all contract operations:

```typescript
import { useAgentNFT } from "@/hooks/useAgentNFT";

const { mintAgent, getAgentMetadata, recordChat } = useAgentNFT();
```

### AI Chat with Memory

Chat with agents using RAG:

```typescript
import { useAgentChat } from "@/hooks/useAgentChat";

const { messages, sendMessage, isLoading } = useAgentChat(agentId);
```

---

## ChromaDB Setup

For local development:

```bash
# Start ChromaDB with Docker
docker run -d \
  --name chromadb \
  -p 8000:8000 \
  -v chroma-data:/chroma/chroma \
  chromadb/chroma
```

For production, use [Chroma Cloud](https://www.trychroma.com/) and set:

```env
CHROMA_API_KEY=your_api_key
CHROMA_TENANT=your_tenant
CHROMA_DATABASE=your_database
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Self-Hosted

```bash
# Build
npm run build

# Start (requires Node.js)
npm run start

# Or use PM2
pm2 start npm --name "agentis" -- start
```

---

## Troubleshooting

| Issue                 | Solution                                                       |
| --------------------- | -------------------------------------------------------------- |
| Wallet not connecting | Ensure ArgentX/Braavos extension is installed and unlocked     |
| Transaction failing   | Check you have sufficient STRK for gas                         |
| Chat not working      | Verify `OPENAI_API_KEY` is set correctly                       |
| Memory not persisting | Ensure ChromaDB is running at `CHROMA_URL`                     |
| IPFS upload failing   | Check `NEXT_PUBLIC_PINATA_JWT` is valid                        |
