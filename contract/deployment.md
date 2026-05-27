# Starknet Sepolia Deployment

Date: May 27, 2026
Network: Starknet Sepolia (`SN_SEPOLIA`)

## Deployment Account

- Name: `agentis_sepolia`
- Address: `0x0370a7a0169c5018b185e01023f0ab5fb4bac660ff87e7bc0dc52c400c5b28f9`

## Constructor Inputs

- `OWNER_ADDRESS`: `0x0370a7a0169c5018b185e01023f0ab5fb4bac660ff87e7bc0dc52c400c5b28f9`
- `PAYMENT_TOKEN_ADDRESS` (STRK): `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`
- `MINT_FEE`: `10000000000000000000` (10 STRK)

## Deployed Contracts

### AgentNFT

- Class hash: `0x55cd12b972f6b3ec83e49c818a999dc6f92f9c345a9142dadf1db5ad273ae7a`
- Contract address: `0x02efcbabe92b04d58b19b75c5d3d7c741327fa9d9bae0451039e1753ad77b5c3`
- Declare tx: `0x68f56b9da971827f40e9f67209aaa20ad0e16248fd654131a77feaf7f0d15bf`
- Deploy tx: `0x4cbae75929d91a756713f42adbacef6b17d47d6ce465843522776b0e617972e`
- Voyager: https://sepolia.voyager.online/contract/0x02efcbabe92b04d58b19b75c5d3d7c741327fa9d9bae0451039e1753ad77b5c3

### RevenueShare

- Class hash: `0x69d190a6e7efd0a299c4e0ce19f02be2b520674843a1d587653bf55501c5ab5`
- Contract address: `0x07f99fe77b58957b4d20d0a6b0a03a82953967d6a3b6763959169e44f3fc9807`
- Declare tx: `0x152dbcae9582772ddb0ef6f1f77bc43399b119d7718159e692411a49a9ad9c`
- Deploy tx: `0x4a60f8a7a91878ee55f6ea9158dad6d7da984cba955e9250fc2de33b45a0be2`
- Voyager: https://sepolia.voyager.online/contract/0x07f99fe77b58957b4d20d0a6b0a03a82953967d6a3b6763959169e44f3fc9807

### AgentCredits

- Class hash: `0x707769715ededbd331d3a381bacd8717adebd6cd43bbea83689a9d747e87f82`
- Contract address: `0x006067f530519483394d2e2588c90fddaff5870f8710cc562184ae3cef30f9b4`
- Declare tx: `0x5d1f60c86a941919a314f40ccb3e47fc1cf332c97c11cf80781700e326ce485`
- Deploy tx: `0x10b7e08fb663ec6a4bfd4c440e6ad7ee5e14f71652a3e2252dab5359ef19c68`
- Voyager: https://sepolia.voyager.online/contract/0x006067f530519483394d2e2588c90fddaff5870f8710cc562184ae3cef30f9b4

### AgentMarketplace

- Class hash: `0x3bf47c39b7f43adf4b76609b6fac2e199f46f4c8e5d02dcda6a7e8dc8ad2b34`
- Contract address: `0x0397e87f72ca52c0fc61604e58afd731251ae445be278db0d53e723bbe80a758`
- Declare tx: `0x55df247bccc5228f6df4b0c56dd5d45804b907b98163a377ac3e19f3299a47`
- Deploy tx: `0x1687a2c607eede1013b48cbfe429866e3fb9688cee9a443c2356ab6b3edc370`
- Voyager: https://sepolia.voyager.online/contract/0x0397e87f72ca52c0fc61604e58afd731251ae445be278db0d53e723bbe80a758

## Post-Deploy Wiring

- `RevenueShare.set_authorized_reporter(AgentCredits, true)` — tx: `0x790aa84d75189ec7c40c56ee738a528b93421f506b825537c76fdd5191e61fb`
- `AgentCredits.set_authorized_spender(Owner, true)` — tx: `0x7126d0b4ad40a9b8d3af0f59b5809d1a163d500efddbbfa210d57a5767b9089`

## Fix Applied

Redeployed to fix `IERC20Like` interface using `u128` for token amounts when STRK ERC20
requires `u256`. All payment calls now correctly pass `u256` amounts, resolving
"Failed to deserialize param #3" on every mint/buy/credit-purchase transaction.

## Generated Artifacts

- `deployments/sepolia.20260527_095631.env`
- `deployments/sepolia.latest.env`

---

## Previous Deployment (March 20, 2026) — DEPRECATED

Broken: `IERC20Like` used `u128` for amounts; STRK requires `u256`. All payment txs failed.

- AgentNFT: `0x021da685fadac9146fa0753ea29b023e2c75d7903612656bb1a164a146c02ae6`
- RevenueShare: `0x06a8ecb9e0a14e9bdbfb514a2c40acbdf99700573b039c5aed0eb856c93e1ab2`
- AgentCredits: `0x070acc051f8df0a1a33455764985b885128e469ec7a1cab9def9cec7a7832df6`
- AgentMarketplace: `0x0497f402ea0a1ca75db9e3766f21a07ab43c26cae792bca62d56ecfa961be016`
