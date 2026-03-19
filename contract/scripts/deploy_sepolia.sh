#!/usr/bin/env bash
set -euo pipefail

PROFILE="${SNCAST_PROFILE:-sepolia}"
OWNER_ADDRESS="${OWNER_ADDRESS:?Set OWNER_ADDRESS (deployer/admin address)}"
PAYMENT_TOKEN_ADDRESS="${PAYMENT_TOKEN_ADDRESS:?Set PAYMENT_TOKEN_ADDRESS (ERC20 used for payments)}"
MINT_FEE="${MINT_FEE:-0}"
BACKEND_SPENDER="${BACKEND_SPENDER:-}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v sncast >/dev/null 2>&1; then
  echo "sncast not found in PATH" >&2
  exit 1
fi

if ! command -v scarb >/dev/null 2>&1; then
  echo "scarb not found in PATH" >&2
  exit 1
fi

URL_ARGS=()
if [[ -n "${STARKNET_RPC_URL:-}" ]]; then
  URL_ARGS=(--url "$STARKNET_RPC_URL")
fi

run_sncast() {
  local subcommand="$1"
  shift
  sncast --profile "$PROFILE" --wait "$subcommand" "$@" "${URL_ARGS[@]}"
}

extract_hex() {
  grep -Eo '0x[0-9a-fA-F]+' | head -n 1
}

extract_class_hash() {
  local out="$1"
  local class_hash
  class_hash="$(awk '/Class Hash:/ {print $3; exit}' <<<"$out")"
  if [[ -z "$class_hash" ]]; then
    class_hash="$(extract_hex <<<"$out")"
  fi
  [[ -n "$class_hash" ]] || { echo "Failed to parse class hash" >&2; exit 1; }
  printf '%s\n' "$class_hash"
}

extract_contract_address() {
  local out="$1"
  local contract_address
  contract_address="$(awk '/Contract Address:/ {print $3; exit}' <<<"$out")"
  if [[ -z "$contract_address" ]]; then
    contract_address="$(extract_hex <<<"$out")"
  fi
  [[ -n "$contract_address" ]] || { echo "Failed to parse contract address" >&2; exit 1; }
  printf '%s\n' "$contract_address"
}

declare_contract() {
  local name="$1"
  local out
  out="$(run_sncast declare --contract-name "$name")"
  echo "$out" >&2
  extract_class_hash "$out"
}

deploy_contract() {
  local class_hash="$1"
  shift
  local out
  out="$(run_sncast deploy --class-hash "$class_hash" --constructor-calldata "$@")"
  echo "$out" >&2
  extract_contract_address "$out"
}

echo "Building contracts..."
scarb build

echo "Declaring and deploying AgentNFT..."
AGENT_NFT_CLASS_HASH="$(declare_contract AgentNFT)"
AGENT_NFT_ADDRESS="$(deploy_contract "$AGENT_NFT_CLASS_HASH" "$OWNER_ADDRESS" "$PAYMENT_TOKEN_ADDRESS" "$MINT_FEE")"

echo "Declaring and deploying RevenueShare..."
REVENUE_SHARE_CLASS_HASH="$(declare_contract RevenueShare)"
REVENUE_SHARE_ADDRESS="$(deploy_contract "$REVENUE_SHARE_CLASS_HASH" "$OWNER_ADDRESS" "$PAYMENT_TOKEN_ADDRESS" "$AGENT_NFT_ADDRESS")"

echo "Declaring and deploying AgentCredits..."
AGENT_CREDITS_CLASS_HASH="$(declare_contract AgentCredits)"
AGENT_CREDITS_ADDRESS="$(deploy_contract "$AGENT_CREDITS_CLASS_HASH" "$OWNER_ADDRESS" "$PAYMENT_TOKEN_ADDRESS" "$REVENUE_SHARE_ADDRESS")"

echo "Declaring and deploying AgentMarketplace..."
AGENT_MARKETPLACE_CLASS_HASH="$(declare_contract AgentMarketplace)"
AGENT_MARKETPLACE_ADDRESS="$(deploy_contract "$AGENT_MARKETPLACE_CLASS_HASH" "$OWNER_ADDRESS" "$PAYMENT_TOKEN_ADDRESS")"

echo "Applying post-deploy wiring..."
run_sncast invoke \
  --contract-address "$REVENUE_SHARE_ADDRESS" \
  --function set_authorized_reporter \
  --arguments "$AGENT_CREDITS_ADDRESS, true"

if [[ -n "$BACKEND_SPENDER" ]]; then
  run_sncast invoke \
    --contract-address "$AGENT_CREDITS_ADDRESS" \
    --function set_authorized_spender \
    --arguments "$BACKEND_SPENDER, true"
fi

mkdir -p deployments
OUT_FILE="deployments/sepolia.$(date +%Y%m%d_%H%M%S).env"
cat >"$OUT_FILE" <<EOF
SNCAST_PROFILE=$PROFILE
OWNER_ADDRESS=$OWNER_ADDRESS
PAYMENT_TOKEN_ADDRESS=$PAYMENT_TOKEN_ADDRESS
MINT_FEE=$MINT_FEE
AGENT_NFT_CLASS_HASH=$AGENT_NFT_CLASS_HASH
AGENT_NFT_ADDRESS=$AGENT_NFT_ADDRESS
REVENUE_SHARE_CLASS_HASH=$REVENUE_SHARE_CLASS_HASH
REVENUE_SHARE_ADDRESS=$REVENUE_SHARE_ADDRESS
AGENT_CREDITS_CLASS_HASH=$AGENT_CREDITS_CLASS_HASH
AGENT_CREDITS_ADDRESS=$AGENT_CREDITS_ADDRESS
AGENT_MARKETPLACE_CLASS_HASH=$AGENT_MARKETPLACE_CLASS_HASH
AGENT_MARKETPLACE_ADDRESS=$AGENT_MARKETPLACE_ADDRESS
EOF

cp "$OUT_FILE" deployments/sepolia.latest.env

printf '\nDeployment complete. Artifacts:\n'
printf '  %s\n' "$OUT_FILE"
printf '  deployments/sepolia.latest.env\n'
