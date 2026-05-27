use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
    StoragePointerWriteAccess,
};
use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
use crate::interfaces::{IERC20LikeDispatcher, IERC20LikeDispatcherTrait};

#[starknet::contract]
pub mod AgentNFT {
    use core::byte_array::ByteArray;
    use super::{
        ContractAddress, IERC20LikeDispatcher, IERC20LikeDispatcherTrait, Map, StorageMapReadAccess,
        StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess,
        get_block_timestamp, get_caller_address, get_contract_address,
    };

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    #[storage]
    struct Storage {
        owner: ContractAddress,
        payment_token: ContractAddress,
        minting_fee: u128,
        next_token_id: u64,
        total_supply: u64,
        token_owner: Map<u64, ContractAddress>,
        token_approval: Map<u64, ContractAddress>,
        operator_approval: Map<(ContractAddress, ContractAddress), bool>,
        token_name: Map<u64, ByteArray>,
        token_uri: Map<u64, ByteArray>,
        personality_hash: Map<u64, ByteArray>,
        token_creator: Map<u64, ContractAddress>,
        token_created_at: Map<u64, u64>,
        token_chat_count: Map<u64, u64>,
        token_level: Map<u64, u64>,
        token_public: Map<u64, bool>,
        owner_balance: Map<ContractAddress, u64>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AgentMinted: AgentMinted,
        AgentLevelUp: AgentLevelUp,
        ChatRecorded: ChatRecorded,
        MintingFeeUpdated: MintingFeeUpdated,
        AgentVisibilityChanged: AgentVisibilityChanged,
        Transfer: Transfer,
    }

    #[derive(Drop, starknet::Event)]
    struct AgentMinted {
        token_id: u64,
        owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct AgentLevelUp {
        token_id: u64,
        new_level: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct ChatRecorded {
        token_id: u64,
        total_chats: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct MintingFeeUpdated {
        new_fee: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct AgentVisibilityChanged {
        token_id: u64,
        is_public: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        token_id: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        payment_token: ContractAddress,
        minting_fee: u128,
    ) {
        self.owner.write(owner);
        self.payment_token.write(payment_token);
        self.minting_fee.write(minting_fee);
        self.next_token_id.write(1);
        self.total_supply.write(0);
    }

    #[external(v0)]
    fn mint_agent(
        ref self: ContractState, name: ByteArray, token_uri: ByteArray, personality_hash: ByteArray,
    ) -> u64 {
        let caller = get_caller_address();
        let fee = self.minting_fee.read();

        if fee > 0 {
            let token = IERC20LikeDispatcher { contract_address: self.payment_token.read() };
            let fee_u256: u256 = fee.into();
            let paid = token.transfer_from(caller, self.owner.read(), fee_u256);
            assert(paid, 'MINT_FEE_PAYMENT_FAILED');
        }

        let token_id = self.next_token_id.read();
        self.next_token_id.write(token_id + 1);

        self.token_owner.write(token_id, caller);
        self.token_approval.write(token_id, zero_address());
        self.token_name.write(token_id, name);
        self.token_uri.write(token_id, token_uri);
        self.personality_hash.write(token_id, personality_hash);
        self.token_creator.write(token_id, caller);
        self.token_created_at.write(token_id, get_block_timestamp());
        self.token_chat_count.write(token_id, 0);
        self.token_level.write(token_id, 1);
        self.token_public.write(token_id, true);

        let owner_bal = self.owner_balance.read(caller);
        self.owner_balance.write(caller, owner_bal + 1);
        self.total_supply.write(self.total_supply.read() + 1);

        self.emit(AgentMinted { token_id, owner: caller });
        self.emit(Transfer { from: zero_address(), to: caller, token_id });
        token_id
    }

    #[external(v0)]
    fn record_chat(ref self: ContractState, token_id: u64) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_CONTRACT_OWNER');
        let owner = self.token_owner.read(token_id);
        assert(owner != zero_address(), 'TOKEN_NOT_FOUND');

        let chat_count = self.token_chat_count.read(token_id) + 1;
        self.token_chat_count.write(token_id, chat_count);

        let mut level = self.token_level.read(token_id);
        if chat_count % 100 == 0 {
            level = level + 1;
            self.token_level.write(token_id, level);
            self.emit(AgentLevelUp { token_id, new_level: level });
        }

        self.emit(ChatRecorded { token_id, total_chats: chat_count });
    }

    #[external(v0)]
    fn set_agent_public(ref self: ContractState, token_id: u64, is_public: bool) {
        let caller = get_caller_address();
        let owner = owner_of(@self, token_id);
        assert(caller == owner, 'NOT_TOKEN_OWNER');
        self.token_public.write(token_id, is_public);
        self.emit(AgentVisibilityChanged { token_id, is_public });
    }

    #[external(v0)]
    fn approve(ref self: ContractState, to: ContractAddress, token_id: u64) {
        let caller = get_caller_address();
        let owner = owner_of(@self, token_id);
        let operator_ok = self.operator_approval.read((owner, caller));
        assert(caller == owner || operator_ok, 'NOT_AUTHORIZED');
        self.token_approval.write(token_id, to);
    }

    #[external(v0)]
    fn set_approval_for_all(ref self: ContractState, operator: ContractAddress, approved: bool) {
        let caller = get_caller_address();
        self.operator_approval.write((caller, operator), approved);
    }

    #[external(v0)]
    fn transfer_from(
        ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u64,
    ) {
        let caller = get_caller_address();
        let owner = owner_of(@self, token_id);
        assert(owner == from, 'INVALID_FROM');

        let approved = self.token_approval.read(token_id);
        let operator_ok = self.operator_approval.read((owner, caller));
        let is_sender = caller == owner;
        let is_approved = caller == approved;
        assert(is_sender || is_approved || operator_ok, 'NOT_APPROVED');

        self.token_owner.write(token_id, to);
        self.token_approval.write(token_id, zero_address());

        let from_bal = self.owner_balance.read(from);
        let to_bal = self.owner_balance.read(to);
        self.owner_balance.write(from, from_bal - 1);
        self.owner_balance.write(to, to_bal + 1);

        self.emit(Transfer { from, to, token_id });
    }

    #[external(v0)]
    fn burn(ref self: ContractState, token_id: u64) {
        let caller = get_caller_address();
        let owner = owner_of(@self, token_id);
        assert(caller == owner, 'NOT_TOKEN_OWNER');

        self.token_owner.write(token_id, zero_address());
        self.token_approval.write(token_id, zero_address());
        self.token_public.write(token_id, false);

        let owner_bal = self.owner_balance.read(owner);
        self.owner_balance.write(owner, owner_bal - 1);
        self.total_supply.write(self.total_supply.read() - 1);

        self.emit(Transfer { from: owner, to: zero_address(), token_id });
    }

    #[external(v0)]
    fn set_minting_fee(ref self: ContractState, new_fee: u128) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.minting_fee.write(new_fee);
        self.emit(MintingFeeUpdated { new_fee });
    }

    #[external(v0)]
    fn owner_of(self: @ContractState, token_id: u64) -> ContractAddress {
        let owner = self.token_owner.read(token_id);
        assert(owner != zero_address(), 'TOKEN_NOT_FOUND');
        owner
    }

    #[external(v0)]
    fn get_approved(self: @ContractState, token_id: u64) -> ContractAddress {
        self.token_approval.read(token_id)
    }

    #[external(v0)]
    fn is_approved_for_all(
        self: @ContractState, owner: ContractAddress, operator: ContractAddress,
    ) -> bool {
        self.operator_approval.read((owner, operator))
    }

    #[external(v0)]
    fn exists(self: @ContractState, token_id: u64) -> bool {
        self.token_owner.read(token_id) != zero_address()
    }

    #[external(v0)]
    fn get_total_supply(self: @ContractState) -> u64 {
        self.total_supply.read()
    }

    #[external(v0)]
    fn get_minting_fee(self: @ContractState) -> u128 {
        self.minting_fee.read()
    }

    #[external(v0)]
    fn get_agent_creator(self: @ContractState, token_id: u64) -> ContractAddress {
        let owner = self.token_owner.read(token_id);
        assert(owner != zero_address(), 'TOKEN_NOT_FOUND');
        self.token_creator.read(token_id)
    }

    #[external(v0)]
    fn get_agent_public(self: @ContractState, token_id: u64) -> bool {
        let owner = self.token_owner.read(token_id);
        assert(owner != zero_address(), 'TOKEN_NOT_FOUND');
        self.token_public.read(token_id)
    }

    #[external(v0)]
    fn balance_of(self: @ContractState, owner: ContractAddress) -> u64 {
        self.owner_balance.read(owner)
    }

    #[external(v0)]
    fn get_agent_metadata(
        self: @ContractState, token_id: u64,
    ) -> (ByteArray, ByteArray, ByteArray, u64, ContractAddress, u64, u64, bool) {
        let owner = self.token_owner.read(token_id);
        assert(owner != zero_address(), 'TOKEN_NOT_FOUND');

        (
            self.token_name.read(token_id),
            self.token_uri.read(token_id),
            self.personality_hash.read(token_id),
            self.token_created_at.read(token_id),
            self.token_creator.read(token_id),
            self.token_chat_count.read(token_id),
            self.token_level.read(token_id),
            self.token_public.read(token_id),
        )
    }

    #[external(v0)]
    fn get_owner(self: @ContractState) -> ContractAddress {
        self.owner.read()
    }

    #[external(v0)]
    fn get_payment_token(self: @ContractState) -> ContractAddress {
        self.payment_token.read()
    }

    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        assert(new_owner != zero_address(), 'ZERO_OWNER');
        self.owner.write(new_owner);
    }

    #[external(v0)]
    fn contract_address(self: @ContractState) -> ContractAddress {
        get_contract_address()
    }

    #[external(v0)]
    fn get_next_token_id(self: @ContractState) -> u64 {
        self.next_token_id.read()
    }

    #[external(v0)]
    fn token_uri(self: @ContractState, token_id: u64) -> ByteArray {
        let owner = self.token_owner.read(token_id);
        assert(owner != zero_address(), 'TOKEN_NOT_FOUND');
        self.token_uri.read(token_id)
    }

    #[external(v0)]
    fn tokens_of_owner(self: @ContractState, owner: ContractAddress) -> Array<u64> {
        let mut result: Array<u64> = ArrayTrait::new();
        let next_id = self.next_token_id.read();
        let mut i: u64 = 1;
        while i < next_id {
            if self.token_owner.read(i) == owner {
                result.append(i);
            }
            i += 1;
        };
        result
    }

    #[external(v0)]
    fn get_top_agents_by_chats(self: @ContractState, limit: u64) -> Array<(u64, ByteArray, u64)> {
        let mut all: Array<(u64, u64)> = ArrayTrait::new();
        let next_id = self.next_token_id.read();
        let mut i: u64 = 1;
        while i < next_id {
            if self.token_owner.read(i) != zero_address() {
                all.append((i, self.token_chat_count.read(i)));
            }
            i += 1;
        };

        // Simple selection sort for top N
        let len = all.len();
        let cap = if limit < len.into() {
            limit
        } else {
            len.into()
        };

        let mut result: Array<(u64, ByteArray, u64)> = ArrayTrait::new();
        let mut used: Array<u32> = ArrayTrait::new();
        let mut picked: u64 = 0;

        while picked < cap {
            let mut best_idx: u32 = 0;
            let mut best_chats: u64 = 0;
            let mut found = false;
            let mut j: u32 = 0;
            while j < len {
                let mut is_used = false;
                let mut k: u32 = 0;
                while k < used.len() {
                    if *used.at(k) == j {
                        is_used = true;
                    }
                    k += 1;
                };
                if !is_used {
                    let (_, chats) = *all.at(j);
                    if !found || chats > best_chats {
                        best_idx = j;
                        best_chats = chats;
                        found = true;
                    }
                }
                j += 1;
            };
            if found {
                let (token_id, chat_count) = *all.at(best_idx);
                let name = self.token_name.read(token_id);
                result.append((token_id, name, chat_count));
                used.append(best_idx);
            }
            picked += 1;
        };
        result
    }
}
