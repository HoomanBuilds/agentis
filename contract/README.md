# Agentis Starknet Contracts

Starknet migration of the Casper contracts from `inspiration/contract`:

- `AgentNFT` (`src/agent_nft.cairo`)
- `AgentMarketplace` (`src/agent_marketplace.cairo`)
- `AgentCredits` (`src/agent_credits.cairo`)
- `RevenueShare` (`src/revenue_share.cairo`)

## Toolchain

Required:

- `scarb` 2.16.x
- `snforge` / `sncast` 0.57.x
- `starknet-devnet` (for local flow)

Verify:

```bash
scarb --version
snforge --version
sncast --version
starknet-devnet --version
```

## Build and Test

From `contract/`:

```bash
scarb fmt
scarb build
snforge test
```

## sncast Profiles

`snfoundry.toml` now includes standard environment profiles:

- `devnet` (local RPC)
- `sepolia` (testnet)
- `mainnet` (mainnet)

By default, testnet/mainnet profiles use named accounts:

- `agentis_sepolia`
- `agentis_mainnet`

If needed, override RPC at runtime with `STARKNET_RPC_URL`.

## Sepolia Account Setup

Create + deploy an account for the `sepolia` profile:

```bash
sncast account create --name agentis_sepolia --network sepolia
```

Fund the printed account address, then:

```bash
sncast account deploy --name agentis_sepolia --network sepolia
```

You can inspect active config with:

```bash
sncast --profile sepolia show-config
```

## Sepolia Deployment

Use the deployment script:

```bash
cp scripts/sepolia.env.example scripts/sepolia.env
```

Update `scripts/sepolia.env`, then run:

```bash
set -a
source scripts/sepolia.env
set +a
./scripts/deploy_sepolia.sh
```

The script performs:

1. `scarb build`
2. Declare/deploy in dependency order:
   - `AgentNFT`
   - `RevenueShare`
   - `AgentCredits`
   - `AgentMarketplace`
3. Post-deploy wiring:
   - `RevenueShare.set_authorized_reporter(agent_credits, true)`
   - Optional `AgentCredits.set_authorized_spender(backend, true)`
4. Writes deployment outputs to:
   - `deployments/sepolia.<timestamp>.env`
   - `deployments/sepolia.latest.env`

## Local Devnet Flow

Start node:

```bash
starknet-devnet --seed 0
```

Use local profile:

```bash
sncast --profile devnet show-config
```

Then declare/deploy with `sncast --profile devnet ...`.

## Notes

- Payment flows use `IERC20Like` in `src/interfaces.cairo`.
- `AgentCredits.purchase_session` transfers payment to `RevenueShare` then calls `record_revenue`.
- Integration coverage is in `tests/integration.cairo`.
