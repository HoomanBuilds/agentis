use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
    StoragePointerWriteAccess,
};
use starknet::{ContractAddress, get_caller_address};
use crate::interfaces::{
    IERC20LikeDispatcher, IERC20LikeDispatcherTrait, IRevenueShareDispatcher,
    IRevenueShareDispatcherTrait,
};

#[starknet::contract]
pub mod AgentCredits {
    use super::{
        ContractAddress, IERC20LikeDispatcher, IERC20LikeDispatcherTrait, IRevenueShareDispatcher,
        IRevenueShareDispatcherTrait, Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess, get_caller_address,
    };

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    #[storage]
    struct Storage {
        owner: ContractAddress,
        payment_token: ContractAddress,
        revenue_share_contract: ContractAddress,
        credit_price: u128,
        free_tier_credits: u128,
        total_supply: u128,
        balances: Map<ContractAddress, u128>,
        allowances: Map<(ContractAddress, ContractAddress), u128>,
        has_claimed_free_tier: Map<ContractAddress, bool>,
        authorized_spenders: Map<ContractAddress, bool>,
        plan_count: u64,
        plan_credits: Map<u64, u128>,
        plan_price: Map<u64, u128>,
        plan_discount_percent: Map<u64, u16>,
        plan_active: Map<u64, bool>,
        session_cost: u128,
        session_pack_credits: u64,
        session_credits: Map<(ContractAddress, ContractAddress, u64), u64>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CreditsPurchased: CreditsPurchased,
        CreditsSpent: CreditsSpent,
        PlanPurchased: PlanPurchased,
        FreeTierClaimed: FreeTierClaimed,
        PlanCreated: PlanCreated,
        PlanStatusUpdated: PlanStatusUpdated,
        CreditPriceUpdated: CreditPriceUpdated,
        FreeTierCreditsUpdated: FreeTierCreditsUpdated,
        AuthorizedSpenderUpdated: AuthorizedSpenderUpdated,
        SessionPurchased: SessionPurchased,
        SessionCreditUsed: SessionCreditUsed,
        Transfer: Transfer,
        Approval: Approval,
    }

    #[derive(Drop, starknet::Event)]
    struct CreditsPurchased {
        buyer: ContractAddress,
        amount: u128,
        cost: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct CreditsSpent {
        user: ContractAddress,
        amount: u128,
        reason: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct PlanPurchased {
        buyer: ContractAddress,
        plan_id: u64,
        credits: u128,
        price: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct FreeTierClaimed {
        user: ContractAddress,
        amount: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct PlanCreated {
        plan_id: u64,
        credits: u128,
        price: u128,
        discount_percent: u16,
    }

    #[derive(Drop, starknet::Event)]
    struct PlanStatusUpdated {
        plan_id: u64,
        active: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct CreditPriceUpdated {
        new_price: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct FreeTierCreditsUpdated {
        new_amount: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct AuthorizedSpenderUpdated {
        spender: ContractAddress,
        authorized: bool,
    }

    #[derive(Drop, starknet::Event)]
    struct SessionPurchased {
        user: ContractAddress,
        nft_contract: ContractAddress,
        agent_id: u64,
        credits: u64,
        cost: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct SessionCreditUsed {
        user: ContractAddress,
        nft_contract: ContractAddress,
        agent_id: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        amount: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct Approval {
        owner: ContractAddress,
        spender: ContractAddress,
        amount: u128,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        payment_token: ContractAddress,
        revenue_share_contract: ContractAddress,
    ) {
        self.owner.write(owner);
        self.payment_token.write(payment_token);
        self.revenue_share_contract.write(revenue_share_contract);
        self.credit_price.write(100_000_000_000_000_000); // 0.1 token with 18 decimals
        self.free_tier_credits.write(10);
        self.total_supply.write(0);
        self.plan_count.write(0);
        self.session_cost.write(5_000_000_000_000_000_000); // 5 token units
        self.session_pack_credits.write(50);

        _create_plan(ref self, 100, 9_000_000_000_000_000_000, 10);
        _create_plan(ref self, 500, 40_000_000_000_000_000_000, 20);
        _create_plan(ref self, 1000, 70_000_000_000_000_000_000, 30);
    }

    #[external(v0)]
    fn transfer(ref self: ContractState, to: ContractAddress, amount: u128) -> bool {
        let from = get_caller_address();
        _transfer(ref self, from, to, amount);
        true
    }

    #[external(v0)]
    fn approve(ref self: ContractState, spender: ContractAddress, amount: u128) -> bool {
        let owner = get_caller_address();
        self.allowances.write((owner, spender), amount);
        self.emit(Approval { owner, spender, amount });
        true
    }

    #[external(v0)]
    fn transfer_from(
        ref self: ContractState, from: ContractAddress, to: ContractAddress, amount: u128,
    ) -> bool {
        let spender = get_caller_address();
        let allowance = self.allowances.read((from, spender));
        assert(allowance >= amount, 'INSUFFICIENT_ALLOWANCE');
        self.allowances.write((from, spender), allowance - amount);
        _transfer(ref self, from, to, amount);
        true
    }

    #[external(v0)]
    fn purchase_credits(ref self: ContractState, amount: u128) {
        assert(amount > 0, 'AMOUNT_ZERO');
        let caller = get_caller_address();
        let cost = amount * self.credit_price.read();

        if cost > 0 {
            let token = IERC20LikeDispatcher { contract_address: self.payment_token.read() };
            let cost_u256: u256 = cost.into();
            let paid = token.transfer_from(caller, self.owner.read(), cost_u256);
            assert(paid, 'PAYMENT_FAILED');
        }

        _mint(ref self, caller, amount);
        self.emit(CreditsPurchased { buyer: caller, amount, cost });
    }

    #[external(v0)]
    fn purchase_plan(ref self: ContractState, plan_id: u64) {
        let active = self.plan_active.read(plan_id);
        assert(active, 'PLAN_NOT_ACTIVE');

        let caller = get_caller_address();
        let price = self.plan_price.read(plan_id);
        let credits = self.plan_credits.read(plan_id);

        let token = IERC20LikeDispatcher { contract_address: self.payment_token.read() };
        let price_u256: u256 = price.into();
        let paid = token.transfer_from(caller, self.owner.read(), price_u256);
        assert(paid, 'PAYMENT_FAILED');

        _mint(ref self, caller, credits);
        self.emit(PlanPurchased { buyer: caller, plan_id, credits, price });
    }

    #[external(v0)]
    fn claim_free_tier(ref self: ContractState) {
        let caller = get_caller_address();
        let claimed = self.has_claimed_free_tier.read(caller);
        assert(!claimed, 'ALREADY_CLAIMED');

        self.has_claimed_free_tier.write(caller, true);
        let amount = self.free_tier_credits.read();
        _mint(ref self, caller, amount);

        self.emit(FreeTierClaimed { user: caller, amount });
    }

    #[external(v0)]
    fn spend_credits(
        ref self: ContractState, user: ContractAddress, amount: u128, reason: felt252,
    ) {
        let caller = get_caller_address();
        let allowed = self.authorized_spenders.read(caller);
        assert(allowed, 'NOT_AUTHORIZED');
        _burn(ref self, user, amount);
        self.emit(CreditsSpent { user, amount, reason });
    }

    #[external(v0)]
    fn purchase_session(ref self: ContractState, nft_contract: ContractAddress, agent_id: u64) {
        let caller = get_caller_address();
        let cost = self.session_cost.read();
        let credits = self.session_pack_credits.read();

        let revenue_share = self.revenue_share_contract.read();
        assert(revenue_share != zero_address(), 'REVENUE_SHARE_NOT_SET');

        let token = IERC20LikeDispatcher { contract_address: self.payment_token.read() };
        let cost_u256: u256 = cost.into();
        let paid = token.transfer_from(caller, revenue_share, cost_u256);
        assert(paid, 'SESSION_PAYMENT_FAILED');

        let rev = IRevenueShareDispatcher { contract_address: revenue_share };
        rev.record_revenue(agent_id, cost, caller, 'SESSION');

        let key = (caller, nft_contract, agent_id);
        self.session_credits.write(key, self.session_credits.read(key) + credits);
        self.emit(SessionPurchased { user: caller, nft_contract, agent_id, credits, cost });
    }

    #[external(v0)]
    fn use_session_credit(
        ref self: ContractState,
        user: ContractAddress,
        nft_contract: ContractAddress,
        agent_id: u64,
    ) {
        let caller = get_caller_address();
        let allowed = self.authorized_spenders.read(caller);
        assert(allowed, 'NOT_AUTHORIZED');

        let key = (user, nft_contract, agent_id);
        let current = self.session_credits.read(key);
        assert(current > 0, 'NO_SESSION_CREDITS');
        self.session_credits.write(key, current - 1);
        self.emit(SessionCreditUsed { user, nft_contract, agent_id });
    }

    #[external(v0)]
    fn create_plan(ref self: ContractState, credits: u128, price: u128, discount_percent: u16) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        _create_plan(ref self, credits, price, discount_percent);
    }

    fn _create_plan(ref self: ContractState, credits: u128, price: u128, discount_percent: u16) {
        let plan_id = self.plan_count.read();
        self.plan_credits.write(plan_id, credits);
        self.plan_price.write(plan_id, price);
        self.plan_discount_percent.write(plan_id, discount_percent);
        self.plan_active.write(plan_id, true);
        self.plan_count.write(plan_id + 1);
        self.emit(PlanCreated { plan_id, credits, price, discount_percent });
    }

    #[external(v0)]
    fn update_plan_status(ref self: ContractState, plan_id: u64, active: bool) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.plan_active.write(plan_id, active);
        self.emit(PlanStatusUpdated { plan_id, active });
    }

    #[external(v0)]
    fn set_revenue_share_contract(ref self: ContractState, new_contract: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.revenue_share_contract.write(new_contract);
    }

    #[external(v0)]
    fn set_credit_price(ref self: ContractState, new_price: u128) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        assert(new_price > 0, 'PRICE_ZERO');
        self.credit_price.write(new_price);
        self.emit(CreditPriceUpdated { new_price });
    }

    #[external(v0)]
    fn set_free_tier_credits(ref self: ContractState, amount: u128) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.free_tier_credits.write(amount);
        self.emit(FreeTierCreditsUpdated { new_amount: amount });
    }

    #[external(v0)]
    fn set_authorized_spender(ref self: ContractState, spender: ContractAddress, authorized: bool) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        self.authorized_spenders.write(spender, authorized);
        self.emit(AuthorizedSpenderUpdated { spender, authorized });
    }

    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        assert(new_owner != zero_address(), 'ZERO_OWNER');
        self.owner.write(new_owner);
    }

    fn _transfer(
        ref self: ContractState, from: ContractAddress, to: ContractAddress, amount: u128,
    ) {
        assert(to != zero_address(), 'ZERO_TO');
        assert(amount > 0, 'AMOUNT_ZERO');

        let from_bal = self.balances.read(from);
        assert(from_bal >= amount, 'INSUFFICIENT_BALANCE');
        self.balances.write(from, from_bal - amount);
        self.balances.write(to, self.balances.read(to) + amount);

        self.emit(Transfer { from, to, amount });
    }

    fn _mint(ref self: ContractState, to: ContractAddress, amount: u128) {
        assert(to != zero_address(), 'ZERO_TO');
        assert(amount > 0, 'AMOUNT_ZERO');

        self.balances.write(to, self.balances.read(to) + amount);
        self.total_supply.write(self.total_supply.read() + amount);
        self.emit(Transfer { from: zero_address(), to, amount });
    }

    fn _burn(ref self: ContractState, from: ContractAddress, amount: u128) {
        assert(amount > 0, 'AMOUNT_ZERO');
        let bal = self.balances.read(from);
        assert(bal >= amount, 'INSUFFICIENT_BALANCE');

        self.balances.write(from, bal - amount);
        self.total_supply.write(self.total_supply.read() - amount);
        self.emit(Transfer { from, to: zero_address(), amount });
    }

    #[external(v0)]
    fn balance_of(self: @ContractState, owner: ContractAddress) -> u128 {
        self.balances.read(owner)
    }

    #[external(v0)]
    fn allowance(self: @ContractState, owner: ContractAddress, spender: ContractAddress) -> u128 {
        self.allowances.read((owner, spender))
    }

    #[external(v0)]
    fn get_user_credits(self: @ContractState, user: ContractAddress) -> u128 {
        self.balances.read(user)
    }

    #[external(v0)]
    fn get_session_credits(
        self: @ContractState, user: ContractAddress, nft_contract: ContractAddress, agent_id: u64,
    ) -> u64 {
        self.session_credits.read((user, nft_contract, agent_id))
    }

    #[external(v0)]
    fn get_plan(self: @ContractState, plan_id: u64) -> (u128, u128, u16, bool) {
        (
            self.plan_credits.read(plan_id),
            self.plan_price.read(plan_id),
            self.plan_discount_percent.read(plan_id),
            self.plan_active.read(plan_id),
        )
    }

    #[external(v0)]
    fn get_plan_count(self: @ContractState) -> u64 {
        self.plan_count.read()
    }

    #[external(v0)]
    fn get_credit_price(self: @ContractState) -> u128 {
        self.credit_price.read()
    }

    #[external(v0)]
    fn get_free_tier_credits(self: @ContractState) -> u128 {
        self.free_tier_credits.read()
    }

    #[external(v0)]
    fn has_user_claimed_free_tier(self: @ContractState, user: ContractAddress) -> bool {
        self.has_claimed_free_tier.read(user)
    }

    #[external(v0)]
    fn get_total_supply(self: @ContractState) -> u128 {
        self.total_supply.read()
    }
}
