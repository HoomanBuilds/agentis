use core::byte_array::ByteArray;
use core::serde::Serde;
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
    stop_cheat_caller_address,
};
use starknet::ContractAddress;

#[starknet::interface]
trait IMockErc20ForTest<TContractState> {
    fn mint(ref self: TContractState, to: ContractAddress, amount: u128);
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u128) -> bool;
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u128;
}

#[starknet::interface]
trait IAgentNFTForTest<TContractState> {
    fn mint_agent(
        ref self: TContractState,
        name: ByteArray,
        token_uri: ByteArray,
        personality_hash: ByteArray,
    ) -> u64;
    fn owner_of(self: @TContractState, token_id: u64) -> ContractAddress;
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
}

#[starknet::interface]
trait IAgentMarketplaceForTest<TContractState> {
    fn list_agent(
        ref self: TContractState, nft_contract: ContractAddress, token_id: u64, price: u128,
    );
    fn buy_agent(ref self: TContractState, nft_contract: ContractAddress, token_id: u64);
}

#[starknet::interface]
trait IAgentCreditsForTest<TContractState> {
    fn purchase_credits(ref self: TContractState, amount: u128);
    fn claim_free_tier(ref self: TContractState);
    fn purchase_session(ref self: TContractState, nft_contract: ContractAddress, agent_id: u64);
    fn set_authorized_spender(ref self: TContractState, spender: ContractAddress, authorized: bool);
    fn use_session_credit(
        ref self: TContractState,
        user: ContractAddress,
        nft_contract: ContractAddress,
        agent_id: u64,
    );
    fn get_user_credits(self: @TContractState, user: ContractAddress) -> u128;
    fn get_session_credits(
        self: @TContractState, user: ContractAddress, nft_contract: ContractAddress, agent_id: u64,
    ) -> u64;
}

#[starknet::interface]
trait IRevenueShareForTest<TContractState> {
    fn set_authorized_reporter(
        ref self: TContractState, reporter: ContractAddress, authorized: bool,
    );
    fn get_agent_stats(self: @TContractState, token_id: u64) -> (u128, u128, u128);
    fn get_platform_stats(self: @TContractState) -> (u128, u128, u128);
}

fn addr(value: felt252) -> ContractAddress {
    value.try_into().unwrap()
}

fn deploy_mock_erc20(owner: ContractAddress) -> ContractAddress {
    let mut calldata = array![];
    owner.serialize(ref calldata);
    let (address, _) = declare("MockErc20").unwrap().contract_class().deploy(@calldata).unwrap();
    address
}

fn deploy_agent_nft(
    owner: ContractAddress, payment_token: ContractAddress, mint_fee: u128,
) -> ContractAddress {
    let mut calldata = array![];
    owner.serialize(ref calldata);
    payment_token.serialize(ref calldata);
    mint_fee.serialize(ref calldata);
    let (address, _) = declare("AgentNFT").unwrap().contract_class().deploy(@calldata).unwrap();
    address
}

#[test]
fn agent_nft_mint_charges_fee_and_sets_owner() {
    let owner = addr(100);
    let minter = addr(200);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };
    let nft_address = deploy_agent_nft(owner, token_address, 50);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };

    start_cheat_caller_address(token_address, owner);
    token.mint(minter, 1_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, minter);
    token.approve(nft_address, 50);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(nft_address, minter);
    let token_id = nft.mint_agent("Agent A", "ipfs://agent-a", "persona-a");
    stop_cheat_caller_address(nft_address);

    assert(token_id == 1, 'TOKEN_ID');
    assert(nft.owner_of(1) == minter, 'OWNER');
    assert(token.balance_of(minter) == 950, 'MINTER_BAL');
    assert(token.balance_of(owner) == 50, 'OWNER_BAL');
}

#[test]
fn marketplace_buy_splits_fees_and_transfers_nft() {
    let owner = addr(500);
    let seller = addr(501);
    let buyer = addr(502);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };

    let mut market_calldata = array![];
    owner.serialize(ref market_calldata);
    token_address.serialize(ref market_calldata);
    let (market_address, _) = declare("AgentMarketplace")
        .unwrap()
        .contract_class()
        .deploy(@market_calldata)
        .unwrap();
    let market = IAgentMarketplaceForTestDispatcher { contract_address: market_address };

    start_cheat_caller_address(nft_address, seller);
    let token_id = nft.mint_agent("Seller Agent", "ipfs://seller", "persona-seller");
    nft.set_approval_for_all(market_address, true);
    stop_cheat_caller_address(nft_address);
    assert(token_id == 1, 'MINTED_TOKEN');

    start_cheat_caller_address(market_address, seller);
    market.list_agent(nft_address, token_id, 100);
    stop_cheat_caller_address(market_address);

    start_cheat_caller_address(token_address, owner);
    token.mint(buyer, 1_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, buyer);
    token.approve(market_address, 100);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(market_address, buyer);
    market.buy_agent(nft_address, token_id);
    stop_cheat_caller_address(market_address);

    assert(nft.owner_of(token_id) == buyer, 'NEW_OWNER');
    assert(token.balance_of(seller) == 95, 'SELLER_RECEIVES_95');
    assert(token.balance_of(owner) == 5, 'OWNER_RECEIVES_FEE');
}

#[test]
fn credits_purchase_and_free_tier_work() {
    let owner = addr(700);
    let user = addr(701);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };

    let mut credits_calldata = array![];
    owner.serialize(ref credits_calldata);
    token_address.serialize(ref credits_calldata);
    owner.serialize(ref credits_calldata);
    let (credits_address, _) = declare("AgentCredits")
        .unwrap()
        .contract_class()
        .deploy(@credits_calldata)
        .unwrap();
    let credits = IAgentCreditsForTestDispatcher { contract_address: credits_address };

    start_cheat_caller_address(token_address, owner);
    token.mint(user, 10_000_000_000_000_000_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, user);
    token.approve(credits_address, 1_000_000_000_000_000_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(credits_address, user);
    credits.purchase_credits(10);
    credits.claim_free_tier();
    stop_cheat_caller_address(credits_address);

    assert(credits.get_user_credits(user) == 20, 'CREDITS_BALANCE');
    assert(token.balance_of(owner) == 1_000_000_000_000_000_000, 'OWNER_RECEIVES_PAYMENT');
}

#[test]
fn session_purchase_routes_revenue_and_consumes_session_credit() {
    let owner = addr(900);
    let agent_owner = addr(901);
    let buyer = addr(902);
    let backend_spender = addr(903);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };

    start_cheat_caller_address(nft_address, agent_owner);
    let token_id = nft.mint_agent("Revenue Agent", "ipfs://rev", "persona-rev");
    stop_cheat_caller_address(nft_address);
    assert(token_id == 1, 'REVENUE_TOKEN');

    let mut revenue_calldata = array![];
    owner.serialize(ref revenue_calldata);
    token_address.serialize(ref revenue_calldata);
    nft_address.serialize(ref revenue_calldata);
    let (revenue_address, _) = declare("RevenueShare")
        .unwrap()
        .contract_class()
        .deploy(@revenue_calldata)
        .unwrap();
    let revenue = IRevenueShareForTestDispatcher { contract_address: revenue_address };

    let mut credits_calldata = array![];
    owner.serialize(ref credits_calldata);
    token_address.serialize(ref credits_calldata);
    revenue_address.serialize(ref credits_calldata);
    let (credits_address, _) = declare("AgentCredits")
        .unwrap()
        .contract_class()
        .deploy(@credits_calldata)
        .unwrap();
    let credits = IAgentCreditsForTestDispatcher { contract_address: credits_address };

    start_cheat_caller_address(revenue_address, owner);
    revenue.set_authorized_reporter(credits_address, true);
    stop_cheat_caller_address(revenue_address);

    start_cheat_caller_address(token_address, owner);
    token.mint(buyer, 10_000_000_000_000_000_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, buyer);
    token.approve(credits_address, 5_000_000_000_000_000_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(credits_address, buyer);
    credits.purchase_session(nft_address, token_id);
    stop_cheat_caller_address(credits_address);

    assert(credits.get_session_credits(buyer, nft_address, token_id) == 50, 'SESSION_PACK');

    let (agent_total, _, agent_pending) = revenue.get_agent_stats(token_id);
    assert(agent_total == 4_000_000_000_000_000_000, 'AGENT_TOTAL');
    assert(agent_pending == 4_000_000_000_000_000_000, 'AGENT_PENDING');

    let (platform_total, _, platform_pending) = revenue.get_platform_stats();
    assert(platform_total == 1_000_000_000_000_000_000, 'PLATFORM_TOTAL');
    assert(platform_pending == 1_000_000_000_000_000_000, 'PLATFORM_PENDING');

    start_cheat_caller_address(credits_address, owner);
    credits.set_authorized_spender(backend_spender, true);
    stop_cheat_caller_address(credits_address);

    start_cheat_caller_address(credits_address, backend_spender);
    credits.use_session_credit(buyer, nft_address, token_id);
    stop_cheat_caller_address(credits_address);

    assert(credits.get_session_credits(buyer, nft_address, token_id) == 49, 'SESSION_USED');
}
