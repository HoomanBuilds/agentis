#!/usr/bin/env bash
# Authorize the backend wallet as a spender on the AgentCredits contract.
# Run once after deployment or whenever the backend wallet address changes.
#
# Usage:
#   cd contract
#   ./scripts/authorize_backend_spender.sh

set -euo pipefail

PROFILE="${SNCAST_PROFILE:-sepolia}"
AGENT_CREDITS="0x006067f530519483394d2e2588c90fddaff5870f8710cc562184ae3cef30f9b4"
BACKEND_SPENDER="0x0370a7a0169c5018b185e01023f0ab5fb4bac660ff87e7bc0dc52c400c5b28f9"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v sncast >/dev/null 2>&1; then
  echo "sncast not found in PATH" >&2
  exit 1
fi

URL_ARGS=()
if [[ -n "${STARKNET_RPC_URL:-}" ]]; then
  URL_ARGS=(--url "$STARKNET_RPC_URL")
fi

echo "Authorizing backend spender on AgentCredits..."
echo "  Contract : $AGENT_CREDITS"
echo "  Spender  : $BACKEND_SPENDER"
echo "  Profile  : $PROFILE"

sncast --profile "$PROFILE" --wait invoke \
  --contract-address "$AGENT_CREDITS" \
  --function set_authorized_spender \
  --arguments "$BACKEND_SPENDER, true" \
  "${URL_ARGS[@]}"

echo "Done. Backend wallet is now an authorized spender."
