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
    fn get_listing(
        self: @TContractState, nft_contract: ContractAddress, token_id: u64,
    ) -> (ContractAddress, u128, bool, u64);
    fn get_stats(self: @TContractState) -> (u64, u64, u128);
    fn get_creator_stats(self: @TContractState, creator: ContractAddress) -> (u128, u64);
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

fn deploy_marketplace(owner: ContractAddress, payment_token: ContractAddress) -> ContractAddress {
    let mut calldata = array![];
    owner.serialize(ref calldata);
    payment_token.serialize(ref calldata);
    let (address, _) = declare("AgentMarketplace")
        .unwrap()
        .contract_class()
        .deploy(@calldata)
        .unwrap();
    address
}

#[test]
fn list_agent_sets_listing_state() {
    let owner = addr(500);
    let seller = addr(501);

    let token_address = deploy_mock_erc20(owner);
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };

    let market_address = deploy_marketplace(owner, token_address);
    let market = IAgentMarketplaceForTestDispatcher { contract_address: market_address };

    start_cheat_caller_address(nft_address, seller);
    let token_id = nft.mint_agent("Listed Agent", "ipfs://listed", "persona-listed");
    nft.set_approval_for_all(market_address, true);
    stop_cheat_caller_address(nft_address);

    start_cheat_caller_address(market_address, seller);
    market.list_agent(nft_address, token_id, 123);
    stop_cheat_caller_address(market_address);

    let (listing_seller, listing_price, active, _) = market.get_listing(nft_address, token_id);
    assert(listing_seller == seller, 'SELLER_SET');
    assert(listing_price == 123, 'PRICE_SET');
    assert(active, 'LISTING_ACTIVE');

    let (total_listings, total_sales, total_volume) = market.get_stats();
    assert(total_listings == 1, 'TOTAL_LISTINGS');
    assert(total_sales == 0, 'TOTAL_SALES');
    assert(total_volume == 0, 'TOTAL_VOLUME');
}

#[test]
fn buy_agent_splits_fees_and_updates_stats() {
    let owner = addr(600);
    let seller = addr(601);
    let buyer = addr(602);

    let token_address = deploy_mock_erc20(owner);
    let token = IMockErc20ForTestDispatcher { contract_address: token_address };
    let nft_address = deploy_agent_nft(owner, token_address, 0);
    let nft = IAgentNFTForTestDispatcher { contract_address: nft_address };
    let market_address = deploy_marketplace(owner, token_address);
    let market = IAgentMarketplaceForTestDispatcher { contract_address: market_address };

    start_cheat_caller_address(nft_address, seller);
    let token_id = nft.mint_agent("Sold Agent", "ipfs://sold", "persona-sold");
    nft.set_approval_for_all(market_address, true);
    stop_cheat_caller_address(nft_address);

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

    assert(nft.owner_of(token_id) == buyer, 'NFT_TRANSFERRED');
    assert(token.balance_of(seller) == 95, 'SELLER_PAID');
    assert(token.balance_of(owner) == 5, 'FEE_PAID');

    let (total_listings, total_sales, total_volume) = market.get_stats();
    assert(total_listings == 1, 'LISTINGS');
    assert(total_sales == 1, 'SALES');
    assert(total_volume == 100, 'VOLUME');

    let (creator_volume, creator_sales) = market.get_creator_stats(seller);
    assert(creator_volume == 100, 'CREATOR_VOLUME');
    assert(creator_sales == 1, 'CREATOR_SALES');
}
