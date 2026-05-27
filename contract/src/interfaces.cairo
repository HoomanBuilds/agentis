use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20Like<TContractState> {
    fn transfer(ref self: TContractState, to: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, amount: u256,
    ) -> bool;
}

#[starknet::interface]
pub trait IAgentNFT<TContractState> {
    fn owner_of(self: @TContractState, token_id: u64) -> ContractAddress;
    fn get_approved(self: @TContractState, token_id: u64) -> ContractAddress;
    fn is_approved_for_all(
        self: @TContractState, owner: ContractAddress, operator: ContractAddress,
    ) -> bool;
    fn transfer_from(
        ref self: TContractState, from: ContractAddress, to: ContractAddress, token_id: u64,
    );
    fn get_agent_creator(self: @TContractState, token_id: u64) -> ContractAddress;
}

#[starknet::interface]
pub trait IRevenueShare<TContractState> {
    fn record_revenue(
        ref self: TContractState,
        token_id: u64,
        amount: u128,
        payer: ContractAddress,
        source: felt252,
    );
}
