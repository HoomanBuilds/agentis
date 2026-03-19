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
    fn get_agent_creator(self: @TContractState, token_id: u64) -> ContractAddress;
    fn get_agent_public(self: @TContractState, token_id: u64) -> bool;
    fn get_total_supply(self: @TContractState) -> u64;
    fn get_minting_fee(self: @TContractState) -> u128;
    fn set_minting_fee(ref self: TContractState, new_fee: u128);
    fn set_agent_public(ref self: TContractState, token_id: u64, is_public: bool);
    fn set_approval_for_all(ref self: TContractState, operator: ContractAddress, approved: bool);
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, token_id: u64,
    );
    fn balance_of(self: @TContractState, owner: ContractAddress) -> u64;
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
fn mint_agent_charges_fee_and_stores_metadata() {
    let owner = addr(100);
    let minter = addr(101);

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
    let token_id = nft.mint_agent("Unit Agent", "ipfs://unit-agent", "persona-unit");
    stop_cheat_caller_address(nft_address);

    assert(token_id == 1, 'TOKEN_ID');
    assert(nft.owner_of(token_id) == minter, 'OWNER');
    assert(nft.get_agent_creator(token_id) == minter, 'CREATOR');
    assert(nft.get_agent_public(token_id), 'PUBLIC_DEFAULT');
    assert(nft.get_total_supply() == 1, 'SUPPLY');
    assert(nft.balance_of(minter) == 1, 'OWNER_BAL');
    assert(token.balance_of(minter) == 950, 'MINTER_BAL');
    assert(token.balance_of(owner) == 50, 'OWNER_FEE_BAL');
}

#[test]
fn operator_transfer_moves_ownership_and_balances() {
    let owner = addr(200);
    let seller = addr(201);
    let operator = addr(202);
    let buyer = addr(203);

    let token_address = deploy_mock_erc20(owner);
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };

    start_cheat_caller_address(nft_address, seller);
    let token_id = nft.mint_agent("Transfer Agent", "ipfs://transfer", "persona-transfer");
    nft.set_approval_for_all(operator, true);
    stop_cheat_caller_address(nft_address);

    start_cheat_caller_address(nft_address, operator);
    nft.transfer_from(seller, buyer, token_id);
    stop_cheat_caller_address(nft_address);

    assert(nft.owner_of(token_id) == buyer, 'NEW_OWNER');
    assert(nft.balance_of(seller) == 0, 'SELLER_BAL');
    assert(nft.balance_of(buyer) == 1, 'BUYER_BAL');
}

#[test]
fn owner_can_update_minting_fee_and_visibility() {
    let owner = addr(300);
    let minter = addr(301);

    let token_address = deploy_mock_erc20(owner);
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };

    start_cheat_caller_address(nft_address, minter);
    let token_id = nft.mint_agent("Visibility Agent", "ipfs://visible", "persona-visible");
    nft.set_agent_public(token_id, false);
    stop_cheat_caller_address(nft_address);

    start_cheat_caller_address(nft_address, owner);
    nft.set_minting_fee(77);
    stop_cheat_caller_address(nft_address);

    assert(!nft.get_agent_public(token_id), 'VISIBILITY_SET');
    assert(nft.get_minting_fee() == 77, 'FEE_UPDATED');
}
