use core::byte_array::ByteArray;
use core::serde::Serde;
use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
    stop_cheat_caller_address,
};
use starknet::ContractAddress;

#[starknet::interface]
trait IMockErc20ForTest<TContractState> {
    fn mint(ref self: TContractState, to: ContractAddress, amount: u256);
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u256;
}

#[starknet::interface]
trait IAgentNFTForTest<TContractState> {
    fn mint_agent(
        ref self: TContractState,
        name: ByteArray,
        token_uri: ByteArray,
        personality_hash: ByteArray,
    ) -> u64;
}

#[starknet::interface]
trait IRevenueShareForTest<TContractState> {
    fn set_authorized_reporter(
        ref self: TContractState, reporter: ContractAddress, authorized: bool,
    );
}

#[starknet::interface]
trait IAgentCreditsForTest<TContractState> {
    fn purchase_credits(ref self: TContractState, amount: u128);
    fn purchase_plan(ref self: TContractState, plan_id: u64);
    fn claim_free_tier(ref self: TContractState);
    fn purchase_session(ref self: TContractState, nft_contract: ContractAddress, agent_id: u64);
    fn get_user_credits(self: @TContractState, user: ContractAddress) -> u128;
    fn get_session_credits(
        self: @TContractState, user: ContractAddress, nft_contract: ContractAddress, agent_id: u64,
    ) -> u64;
    fn get_total_supply(self: @TContractState) -> u128;
    fn get_plan_count(self: @TContractState) -> u64;
    fn get_plan(self: @TContractState, plan_id: u64) -> (u128, u128, u16, bool);
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

fn deploy_revenue_share(
    owner: ContractAddress, payment_token: ContractAddress, agent_nft: ContractAddress,
) -> ContractAddress {
    let mut calldata = array![];
    owner.serialize(ref calldata);
    payment_token.serialize(ref calldata);
    agent_nft.serialize(ref calldata);
    let (address, _) = declare("RevenueShare").unwrap().contract_class().deploy(@calldata).unwrap();
    address
}

fn deploy_agent_credits(
    owner: ContractAddress, payment_token: ContractAddress, revenue_share: ContractAddress,
) -> ContractAddress {
    let mut calldata = array![];
    owner.serialize(ref calldata);
    payment_token.serialize(ref calldata);
    revenue_share.serialize(ref calldata);
    let (address, _) = declare("AgentCredits").unwrap().contract_class().deploy(@calldata).unwrap();
    address
}

#[test]
fn purchase_credits_and_claim_free_tier_update_balances() {
    let owner = addr(700);
    let user = addr(701);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };
    let credits_address = deploy_agent_credits(owner, token_address, owner);
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
    assert(credits.get_total_supply() == 20, 'TOTAL_SUPPLY');
    assert(token.balance_of(owner) == 1_000_000_000_000_000_000, 'OWNER_RECEIVED_PAYMENT');
}

#[test]
fn default_plans_exist_and_purchase_plan_mints_credits() {
    let owner = addr(800);
    let user = addr(801);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };
    let credits_address = deploy_agent_credits(owner, token_address, owner);
    let credits = IAgentCreditsForTestDispatcher { contract_address: credits_address };

    assert(credits.get_plan_count() == 3, 'PLAN_COUNT');

    let (plan_credits, plan_price, plan_discount, plan_active) = credits.get_plan(0);
    assert(plan_credits == 100, 'PLAN0_CREDITS');
    assert(plan_price == 9_000_000_000_000_000_000, 'PLAN0_PRICE');
    assert(plan_discount == 10, 'PLAN0_DISCOUNT');
    assert(plan_active, 'PLAN0_ACTIVE');

    start_cheat_caller_address(token_address, owner);
    token.mint(user, 20_000_000_000_000_000_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, user);
    token.approve(credits_address, 9_000_000_000_000_000_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(credits_address, user);
    credits.purchase_plan(0);
    stop_cheat_caller_address(credits_address);

    assert(credits.get_user_credits(user) == 100, 'PLAN_CREDITS_MINTED');
    assert(token.balance_of(owner) == 9_000_000_000_000_000_000, 'PLAN_PAYMENT');
}

#[test]
fn purchase_session_adds_session_credits() {
    let owner = addr(900);
    let agent_owner = addr(901);
    let user = addr(902);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };
    let revenue_address = deploy_revenue_share(owner, token_address, nft_address);
    let revenue = IRevenueShareForTestDispatcher { contract_address: revenue_address };
    let credits_address = deploy_agent_credits(owner, token_address, revenue_address);
    let credits = IAgentCreditsForTestDispatcher { contract_address: credits_address };

    start_cheat_caller_address(nft_address, agent_owner);
    let token_id = nft.mint_agent("Session Agent", "ipfs://session", "persona-session");
    stop_cheat_caller_address(nft_address);

    start_cheat_caller_address(revenue_address, owner);
    revenue.set_authorized_reporter(credits_address, true);
    stop_cheat_caller_address(revenue_address);

    start_cheat_caller_address(token_address, owner);
    token.mint(user, 10_000_000_000_000_000_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(token_address, user);
    token.approve(credits_address, 5_000_000_000_000_000_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(credits_address, user);
    credits.purchase_session(nft_address, token_id);
    stop_cheat_caller_address(credits_address);

    assert(credits.get_session_credits(user, nft_address, token_id) == 50, 'SESSION_CREDITS');
    assert(token.balance_of(revenue_address) == 5_000_000_000_000_000_000, 'SESSION_PAYMENT_MOVED');
}
