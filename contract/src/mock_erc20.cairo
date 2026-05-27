use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
    StoragePointerWriteAccess,
};
use starknet::{ContractAddress, get_caller_address};

#[starknet::contract]
pub mod MockErc20 {
    use super::{
        ContractAddress, Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess, get_caller_address,
    };

    #[storage]
    struct Storage {
        owner: ContractAddress,
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    #[external(v0)]
    fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.balances.write(to, self.balances.read(to) + amount);
    }

    #[external(v0)]
    fn transfer(ref self: ContractState, to: ContractAddress, amount: u256) -> bool {
        let from = get_caller_address();
        let from_bal = self.balances.read(from);
        assert(from_bal >= amount, 'INSUFFICIENT_BALANCE');
        self.balances.write(from, from_bal - amount);
        self.balances.write(to, self.balances.read(to) + amount);
        true
    }

    #[external(v0)]
    fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
        let owner = get_caller_address();
        self.allowances.write((owner, spender), amount);
        true
    }

    #[external(v0)]
    fn transfer_from(
        ref self: ContractState, from: ContractAddress, to: ContractAddress, amount: u256,
    ) -> bool {
        let spender = get_caller_address();
        let allowance = self.allowances.read((from, spender));
        assert(allowance >= amount, 'INSUFFICIENT_ALLOWANCE');

        let from_bal = self.balances.read(from);
        assert(from_bal >= amount, 'INSUFFICIENT_BALANCE');

        self.allowances.write((from, spender), allowance - amount);
        self.balances.write(from, from_bal - amount);
        self.balances.write(to, self.balances.read(to) + amount);
        true
    }

    #[external(v0)]
    fn balance_of(self: @ContractState, owner: ContractAddress) -> u256 {
        self.balances.read(owner)
    }
}
