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
    fn record_revenue(
        ref self: TContractState,
        token_id: u64,
        amount: u128,
        payer: ContractAddress,
        source: felt252,
    );
    fn withdraw_agent_earnings(ref self: TContractState, token_id: u64) -> u128;
    fn withdraw_platform_earnings(ref self: TContractState, receiver: ContractAddress) -> u128;
    fn get_agent_stats(self: @TContractState, token_id: u64) -> (u128, u128, u128);
    fn get_platform_stats(self: @TContractState) -> (u128, u128, u128);
    fn get_revenue_count(self: @TContractState) -> u64;
    fn get_revenue_record(
        self: @TContractState, idx: u64,
    ) -> (u64, u128, ContractAddress, felt252, u64);
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

#[test]
fn record_revenue_splits_into_agent_and_platform_stats() {
    let owner = addr(1000);
    let creator = addr(1001);
    let payer = addr(1002);

    let token_address = deploy_mock_erc20(owner);
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };
    let revenue_address = deploy_revenue_share(owner, token_address, nft_address);
    let revenue = IRevenueShareForTestDispatcher { contract_address: revenue_address };

    start_cheat_caller_address(nft_address, creator);
    let token_id = nft.mint_agent("Revenue Unit", "ipfs://rev-unit", "persona-rev-unit");
    stop_cheat_caller_address(nft_address);

    start_cheat_caller_address(revenue_address, owner);
    revenue.record_revenue(token_id, 1_000, payer, 'UNIT');
    stop_cheat_caller_address(revenue_address);

    let (agent_total, agent_withdrawn, agent_pending) = revenue.get_agent_stats(token_id);
    assert(agent_total == 800, 'AGENT_TOTAL');
    assert(agent_withdrawn == 0, 'AGENT_WITHDRAWN');
    assert(agent_pending == 800, 'AGENT_PENDING');

    let (platform_total, platform_withdrawn, platform_pending) = revenue.get_platform_stats();
    assert(platform_total == 200, 'PLATFORM_TOTAL');
    assert(platform_withdrawn == 0, 'PLATFORM_WITHDRAWN');
    assert(platform_pending == 200, 'PLATFORM_PENDING');

    assert(revenue.get_revenue_count() == 1, 'REVENUE_COUNT');
    let (record_token_id, record_amount, record_payer, record_source, _) = revenue
        .get_revenue_record(0);
    assert(record_token_id == token_id, 'RECORD_TOKEN_ID');
    assert(record_amount == 1_000, 'RECORD_AMOUNT');
    assert(record_payer == payer, 'RECORD_PAYER');
    assert(record_source == 'UNIT', 'RECORD_SOURCE');
}

#[test]
fn withdraw_functions_transfer_expected_amounts() {
    let owner = addr(1100);
    let creator = addr(1101);
    let payer = addr(1102);
    let platform_receiver = addr(1103);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };
    let revenue_address = deploy_revenue_share(owner, token_address, nft_address);
    let revenue = IRevenueShareForTestDispatcher { contract_address: revenue_address };

    start_cheat_caller_address(nft_address, creator);
    let token_id = nft.mint_agent("Withdraw Unit", "ipfs://withdraw-unit", "persona-withdraw-unit");
    stop_cheat_caller_address(nft_address);

    start_cheat_caller_address(revenue_address, owner);
    revenue.record_revenue(token_id, 1_000, payer, 'WITHDRAW');
    stop_cheat_caller_address(revenue_address);

    start_cheat_caller_address(token_address, owner);
    token.mint(revenue_address, 1_000);
    stop_cheat_caller_address(token_address);

    start_cheat_caller_address(revenue_address, creator);
    let creator_withdrawn = revenue.withdraw_agent_earnings(token_id);
    stop_cheat_caller_address(revenue_address);

    start_cheat_caller_address(revenue_address, owner);
    let platform_withdrawn = revenue.withdraw_platform_earnings(platform_receiver);
    stop_cheat_caller_address(revenue_address);

    assert(creator_withdrawn == 800, 'CREATOR_WITHDRAWN');
    assert(platform_withdrawn == 200, 'PLATFORM_WITHDRAWN');
    assert(token.balance_of(creator) == 800, 'CREATOR_BAL');
    assert(token.balance_of(platform_receiver) == 200, 'PLATFORM_BAL');
    assert(token.balance_of(revenue_address) == 0, 'CONTRACT_BAL');
}
