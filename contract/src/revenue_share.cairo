use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
    StoragePointerWriteAccess,
};
use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
use crate::interfaces::{
    IAgentNFTDispatcher, IAgentNFTDispatcherTrait, IERC20LikeDispatcher, IERC20LikeDispatcherTrait,
};

#[starknet::contract]
pub mod RevenueShare {
    use super::{
        ContractAddress, IAgentNFTDispatcher, IAgentNFTDispatcherTrait, IERC20LikeDispatcher,
        IERC20LikeDispatcherTrait, Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess, get_block_timestamp,
        get_caller_address,
    };

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    #[storage]
    struct Storage {
        owner: ContractAddress,
        payment_token: ContractAddress,
        agent_nft: ContractAddress,
        agent_share_bps: u16,
        platform_share_bps: u16,
        authorized_reporters: Map<ContractAddress, bool>,
        agent_wallet: Map<u64, ContractAddress>,
        agent_earnings: Map<u64, u128>,
        agent_withdrawn: Map<u64, u128>,
        platform_earnings: u128,
        platform_withdrawn: u128,
        revenue_count: u64,
        revenue_token_id: Map<u64, u64>,
        revenue_amount: Map<u64, u128>,
        revenue_payer: Map<u64, ContractAddress>,
        revenue_source: Map<u64, felt252>,
        revenue_timestamp: Map<u64, u64>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        RevenueReceived: RevenueReceived,
        EarningsClaimed: EarningsClaimed,
        PlatformEarningsWithdrawn: PlatformEarningsWithdrawn,
        RevenueSplitUpdated: RevenueSplitUpdated,
        AgentWalletUpdated: AgentWalletUpdated,
        AgentNFTUpdated: AgentNFTUpdated,
        AuthorizedReporterUpdated: AuthorizedReporterUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct RevenueReceived {
        token_id: u64,
        amount: u128,
        payer: ContractAddress,
        source: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct EarningsClaimed {
        token_id: u64,
        receiver: ContractAddress,
        amount: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct PlatformEarningsWithdrawn {
        receiver: ContractAddress,
        amount: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct RevenueSplitUpdated {
        agent_share_bps: u16,
        platform_share_bps: u16,
    }

    #[derive(Drop, starknet::Event)]
    struct AgentWalletUpdated {
        token_id: u64,
        wallet: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct AgentNFTUpdated {
        new_agent_nft: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct AuthorizedReporterUpdated {
        reporter: ContractAddress,
        authorized: bool,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        payment_token: ContractAddress,
        agent_nft: ContractAddress,
    ) {
        self.owner.write(owner);
        self.payment_token.write(payment_token);
        self.agent_nft.write(agent_nft);
        self.agent_share_bps.write(8000);
        self.platform_share_bps.write(2000);
        self.platform_earnings.write(0);
        self.platform_withdrawn.write(0);
        self.revenue_count.write(0);
        self.authorized_reporters.write(owner, true);
    }

    #[external(v0)]
    fn record_revenue(
        ref self: ContractState,
        token_id: u64,
        amount: u128,
        payer: ContractAddress,
        source: felt252,
    ) {
        let caller = get_caller_address();
        let authorized = self.authorized_reporters.read(caller) || caller == self.owner.read();
        assert(authorized, 'NOT_AUTHORIZED');
        assert(amount > 0, 'AMOUNT_ZERO');

        // Validate NFT existence via owner_of call.
        let nft = IAgentNFTDispatcher { contract_address: self.agent_nft.read() };
        let token_owner = nft.owner_of(token_id);
        assert(token_owner != zero_address(), 'TOKEN_NOT_FOUND');

        let agent_bps: u128 = self.agent_share_bps.read().into();
        let owner_amount = (amount * agent_bps) / 10_000;
        let platform_amount = amount - owner_amount;

        self.agent_earnings.write(token_id, self.agent_earnings.read(token_id) + owner_amount);
        self.platform_earnings.write(self.platform_earnings.read() + platform_amount);

        let idx = self.revenue_count.read();
        self.revenue_token_id.write(idx, token_id);
        self.revenue_amount.write(idx, amount);
        self.revenue_payer.write(idx, payer);
        self.revenue_source.write(idx, source);
        self.revenue_timestamp.write(idx, get_block_timestamp());
        self.revenue_count.write(idx + 1);

        self
            .emit(
                RevenueReceived {
                    token_id, amount, payer, source, timestamp: get_block_timestamp(),
                },
            );
    }

    #[external(v0)]
    fn withdraw_agent_earnings(ref self: ContractState, token_id: u64) -> u128 {
        let caller = get_caller_address();
        let nft = IAgentNFTDispatcher { contract_address: self.agent_nft.read() };
        let nft_owner = nft.owner_of(token_id);
        let configured_wallet = self.agent_wallet.read(token_id);

        let allowed = caller == nft_owner
            || (configured_wallet != zero_address() && caller == configured_wallet);
        assert(allowed, 'NOT_ALLOWED');

        let total = self.agent_earnings.read(token_id);
        let withdrawn = self.agent_withdrawn.read(token_id);
        assert(total > withdrawn, 'NO_EARNINGS');

        let pending: u128 = total - withdrawn;
        self.agent_withdrawn.write(token_id, total);

        let receiver = if configured_wallet != zero_address() {
            configured_wallet
        } else {
            nft_owner
        };

        let token = IERC20LikeDispatcher { contract_address: self.payment_token.read() };
        let pending_u256: u256 = pending.into();
        let sent = token.transfer(receiver, pending_u256);
        assert(sent, 'TOKEN_TRANSFER_FAILED');

        self.emit(EarningsClaimed { token_id, receiver, amount: pending });
        pending
    }

    #[external(v0)]
    fn withdraw_platform_earnings(ref self: ContractState, receiver: ContractAddress) -> u128 {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        assert(receiver != zero_address(), 'ZERO_RECEIVER');

        let total = self.platform_earnings.read();
        let withdrawn = self.platform_withdrawn.read();
        assert(total > withdrawn, 'NO_EARNINGS');

        let pending: u128 = total - withdrawn;
        self.platform_withdrawn.write(total);

        let token = IERC20LikeDispatcher { contract_address: self.payment_token.read() };
        let pending_u256: u256 = pending.into();
        let sent = token.transfer(receiver, pending_u256);
        assert(sent, 'TOKEN_TRANSFER_FAILED');

        self.emit(PlatformEarningsWithdrawn { receiver, amount: pending });
        pending
    }

    #[external(v0)]
    fn update_revenue_split(
        ref self: ContractState, new_agent_share_bps: u16, new_platform_share_bps: u16,
    ) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        assert(new_agent_share_bps + new_platform_share_bps == 10000, 'INVALID_SPLIT');
        assert(new_agent_share_bps >= 5000, 'AGENT_SHARE_TOO_LOW');

        self.agent_share_bps.write(new_agent_share_bps);
        self.platform_share_bps.write(new_platform_share_bps);

        self
            .emit(
                RevenueSplitUpdated {
                    agent_share_bps: new_agent_share_bps,
                    platform_share_bps: new_platform_share_bps,
                },
            );
    }

    #[external(v0)]
    fn set_agent_wallet(ref self: ContractState, token_id: u64, wallet: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.agent_wallet.write(token_id, wallet);
        self.emit(AgentWalletUpdated { token_id, wallet });
    }

    #[external(v0)]
    fn set_agent_nft(ref self: ContractState, new_agent_nft: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.agent_nft.write(new_agent_nft);
        self.emit(AgentNFTUpdated { new_agent_nft });
    }

    #[external(v0)]
    fn set_authorized_reporter(
        ref self: ContractState, reporter: ContractAddress, authorized: bool,
    ) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.authorized_reporters.write(reporter, authorized);
        self.emit(AuthorizedReporterUpdated { reporter, authorized });
    }

    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        assert(new_owner != zero_address(), 'ZERO_OWNER');
        self.owner.write(new_owner);
    }

    #[external(v0)]
    fn get_agent_stats(self: @ContractState, token_id: u64) -> (u128, u128, u128) {
        let total = self.agent_earnings.read(token_id);
        let withdrawn = self.agent_withdrawn.read(token_id);
        (total, withdrawn, total - withdrawn)
    }

    #[external(v0)]
    fn get_platform_stats(self: @ContractState) -> (u128, u128, u128) {
        let total = self.platform_earnings.read();
        let withdrawn = self.platform_withdrawn.read();
        (total, withdrawn, total - withdrawn)
    }

    #[external(v0)]
    fn get_revenue_split(self: @ContractState) -> (u16, u16) {
        (self.agent_share_bps.read(), self.platform_share_bps.read())
    }

    #[external(v0)]
    fn get_agent_wallet(self: @ContractState, token_id: u64) -> ContractAddress {
        self.agent_wallet.read(token_id)
    }

    #[external(v0)]
    fn get_revenue_record(
        self: @ContractState, idx: u64,
    ) -> (u64, u128, ContractAddress, felt252, u64) {
        (
            self.revenue_token_id.read(idx),
            self.revenue_amount.read(idx),
            self.revenue_payer.read(idx),
            self.revenue_source.read(idx),
            self.revenue_timestamp.read(idx),
        )
    }

    #[external(v0)]
    fn get_revenue_count(self: @ContractState) -> u64 {
        self.revenue_count.read()
    }
}
