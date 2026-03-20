# Starknet Sepolia Deployment

Date: March 20, 2026
Network: Starknet Sepolia (`SN_SEPOLIA`)

## Deployment Account

- Name: `agentis_sepolia`
- Address: `0x0370a7a0169c5018b185e01023f0ab5fb4bac660ff87e7bc0dc52c400c5b28f9`
- Account deploy tx: `0x4767774a60e38280e5de0f62a4edda45625363c6b2dda2a34be2fdea3e768b5`
- Voyager: https://sepolia.voyager.online/tx/0x04767774a60e38280e5de0f62a4edda45625363c6b2dda2a34be2fdea3e768b5

## Constructor Inputs

- `OWNER_ADDRESS`: `0x0370a7a0169c5018b185e01023f0ab5fb4bac660ff87e7bc0dc52c400c5b28f9`
- `PAYMENT_TOKEN_ADDRESS` (STRK): `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d`
- `MINT_FEE`: `0`

## Deployed Contracts

### AgentNFT

- Class hash: `0x66dfb605bec9e280d0ca8cf77797fa8a5a2369e9f4964fe93187a617f1aa90f`
- Contract address: `0x04b5333d96dd95f0d8f8d9727cb23420575239e4448c9cc30a89f31b1bd2612f`
- Declare tx: `0x3fb91b77e2f2d8f7f2fbdda2a021bddfab3e096189c5180718ae003c01ff5ec`
- Deploy tx: `0x00d12597743b7a7c33549530be6fd5952e3ec1e17c15770ea7a8d010dbc8a7fe`
- Voyager contract: https://sepolia.voyager.online/contract/0x04b5333d96dd95f0d8f8d9727cb23420575239e4448c9cc30a89f31b1bd2612f

### RevenueShare

- Class hash: `0x3bd4da84f2532e6244f8501d60f98632cf12c5c5ae1a78888a9c530dd8e4a4e`
- Contract address: `0x06307038ef05caa67dd65352d2aa9b1fa3ac5b2f81ea8541ba77c503a331e423`
- Declare tx: `0x1b76676e3088b417a35e09e21ac0ddfcfce9ee2207d9be437c63df95ba57f67`
- Deploy tx: `0x05051f8f09e3dbe2059816f2aafb7373e339f06870b4bd01cd30ce1a9e05ca14`
- Voyager contract: https://sepolia.voyager.online/contract/0x06307038ef05caa67dd65352d2aa9b1fa3ac5b2f81ea8541ba77c503a331e423

### AgentCredits

- Class hash: `0x53f667289ec5d616c9df7d1930feb87bd02c0deb0ac44327ead64075ebe417d`
- Contract address: `0x044d35290e39f2353fcfe4645ffb42b3af4e1fd7b190930505c302cbf04eeef9`
- Declare tx: `0x60f608406aecdb34362a9a6e8b9146c89f56b1303ae86afe219f7457a33b2e7`
- Deploy tx: `0x0237b37fcdf023c05bb41d4ffef7522d6cddb0e4f8252525bfc48c693037cad4`
- Voyager contract: https://sepolia.voyager.online/contract/0x044d35290e39f2353fcfe4645ffb42b3af4e1fd7b190930505c302cbf04eeef9

### AgentMarketplace

- Class hash: `0x73cead952dc31dba71ffb75d5cf1f97bcd2cef0a71f1ebd0b57599cfd7e53bb`
- Contract address: `0x057cff38e58af4db96ec4d2afe421da1b75c48ecde419ed26869846f775fa848`
- Declare tx: `0x56e2955a895718cf22091edf92e0d6b9b09ef800c8c6c1e1aeec1ad9c68dbd0`
- Deploy tx: `0x06d47e181a12b3cdf971b3f340fe93316ee6bc64eb1ea65b5dac88588247fad5`
- Voyager contract: https://sepolia.voyager.online/contract/0x057cff38e58af4db96ec4d2afe421da1b75c48ecde419ed26869846f775fa848

## Post-Deploy Wiring

- `RevenueShare.set_authorized_reporter(AgentCredits, true)`
- Invoke tx: `0x07e7ea0b06abdd9da1d5383fed4c9a4d0352a53cecf393cf8e0b716f79d0e89b`
- Voyager: https://sepolia.voyager.online/tx/0x07e7ea0b06abdd9da1d5383fed4c9a4d0352a53cecf393cf8e0b716f79d0e89b

## Generated Artifacts

- `deployments/sepolia.20260320_233320.env`
- `deployments/sepolia.latest.env`
