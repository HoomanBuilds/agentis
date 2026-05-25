use starknet::storage::{
    Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
    StoragePointerWriteAccess,
};
use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_contract_address};
use crate::interfaces::{
    IAgentNFTDispatcher, IAgentNFTDispatcherTrait, IERC20LikeDispatcher, IERC20LikeDispatcherTrait,
};

#[starknet::contract]
pub mod AgentMarketplace {
    use super::{
        ContractAddress, IAgentNFTDispatcher, IAgentNFTDispatcherTrait, IERC20LikeDispatcher,
        IERC20LikeDispatcherTrait, Map, StorageMapReadAccess, StorageMapWriteAccess,
        StoragePointerReadAccess, StoragePointerWriteAccess, get_block_timestamp,
        get_caller_address, get_contract_address,
    };

    fn zero_address() -> ContractAddress {
        0.try_into().unwrap()
    }

    #[storage]
    struct Storage {
        owner: ContractAddress,
        payment_token: ContractAddress,
        marketplace_fee_bps: u16,
        listing_seller: Map<(ContractAddress, u64), ContractAddress>,
        listing_price: Map<(ContractAddress, u64), u128>,
        listing_active: Map<(ContractAddress, u64), bool>,
        listing_listed_at: Map<(ContractAddress, u64), u64>,
        total_listings: u64,
        total_sales: u64,
        total_volume: u128,
        creator_volume: Map<ContractAddress, u128>,
        creator_sales: Map<ContractAddress, u64>,
        listing_count: u64,
        listing_nft_contract: Map<u64, ContractAddress>,
        listing_token_id: Map<u64, u64>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AgentListed: AgentListed,
        AgentSold: AgentSold,
        ListingCancelled: ListingCancelled,
        PriceUpdated: PriceUpdated,
        MarketplaceFeeUpdated: MarketplaceFeeUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct AgentListed {
        nft_contract: ContractAddress,
        token_id: u64,
        seller: ContractAddress,
        price: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct AgentSold {
        nft_contract: ContractAddress,
        token_id: u64,
        seller: ContractAddress,
        buyer: ContractAddress,
        price: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct ListingCancelled {
        nft_contract: ContractAddress,
        token_id: u64,
        seller: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct PriceUpdated {
        nft_contract: ContractAddress,
        token_id: u64,
        old_price: u128,
        new_price: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct MarketplaceFeeUpdated {
        new_fee_bps: u16,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, owner: ContractAddress, payment_token: ContractAddress,
    ) {
        self.owner.write(owner);
        self.payment_token.write(payment_token);
        self.marketplace_fee_bps.write(500);
        self.total_listings.write(0);
        self.total_sales.write(0);
        self.total_volume.write(0);
        self.listing_count.write(0);
    }

    #[external(v0)]
    fn list_agent(
        ref self: ContractState, nft_contract: ContractAddress, token_id: u64, price: u128,
    ) {
        assert(price > 0, 'PRICE_ZERO');
        let caller = get_caller_address();
        let key = (nft_contract, token_id);

        let nft = IAgentNFTDispatcher { contract_address: nft_contract };
        let owner = nft.owner_of(token_id);
        assert(owner == caller, 'NOT_TOKEN_OWNER');

        let market_address = get_contract_address();

        let approved_for_all = nft.is_approved_for_all(caller, market_address);
        let approved = nft.get_approved(token_id);
        assert(approved_for_all || approved == market_address, 'MARKET_NOT_APPROVED');

        let already_active = self.listing_active.read(key);
        assert(!already_active, 'ALREADY_LISTED');

        self.listing_seller.write(key, caller);
        self.listing_price.write(key, price);
        self.listing_active.write(key, true);
        self.listing_listed_at.write(key, get_block_timestamp());
        self.total_listings.write(self.total_listings.read() + 1);

        let idx = self.listing_count.read();
        self.listing_nft_contract.write(idx, nft_contract);
        self.listing_token_id.write(idx, token_id);
        self.listing_count.write(idx + 1);

        self.emit(AgentListed { nft_contract, token_id, seller: caller, price });
    }

    #[external(v0)]
    fn buy_agent(ref self: ContractState, nft_contract: ContractAddress, token_id: u64) {
        let key = (nft_contract, token_id);
        let active = self.listing_active.read(key);
        assert(active, 'NOT_LISTED');

        let caller = get_caller_address();
        let seller = self.listing_seller.read(key);
        assert(caller != seller, 'CANNOT_BUY_OWN');

        let nft = IAgentNFTDispatcher { contract_address: nft_contract };
        let current_owner = nft.owner_of(token_id);
        assert(current_owner == seller, 'SELLER_NOT_OWNER');

        let price = self.listing_price.read(key);
        let fee_bps: u128 = self.marketplace_fee_bps.read().into();
        let fee = (price * fee_bps) / 10_000;
        let seller_amount = price - fee;

        let token = IERC20LikeDispatcher { contract_address: self.payment_token.read() };
        let paid_seller = token.transfer_from(caller, seller, seller_amount);
        assert(paid_seller, 'PAY_SELLER_FAILED');

        if fee > 0 {
            let paid_fee = token.transfer_from(caller, self.owner.read(), fee);
            assert(paid_fee, 'PAY_FEE_FAILED');
        }

        nft.transfer_from(seller, caller, token_id);

        self.listing_active.write(key, false);
        self.total_sales.write(self.total_sales.read() + 1);
        self.total_volume.write(self.total_volume.read() + price);

        let creator = nft.get_agent_creator(token_id);
        self.creator_volume.write(creator, self.creator_volume.read(creator) + price);
        self.creator_sales.write(creator, self.creator_sales.read(creator) + 1);

        self.emit(AgentSold { nft_contract, token_id, seller, buyer: caller, price });
    }

    #[external(v0)]
    fn cancel_listing(ref self: ContractState, nft_contract: ContractAddress, token_id: u64) {
        let key = (nft_contract, token_id);
        let active = self.listing_active.read(key);
        assert(active, 'NOT_LISTED');

        let caller = get_caller_address();
        let seller = self.listing_seller.read(key);
        assert(caller == seller, 'NOT_SELLER');

        self.listing_active.write(key, false);
        self.emit(ListingCancelled { nft_contract, token_id, seller: caller });
    }

    #[external(v0)]
    fn update_price(
        ref self: ContractState, nft_contract: ContractAddress, token_id: u64, new_price: u128,
    ) {
        assert(new_price > 0, 'PRICE_ZERO');

        let key = (nft_contract, token_id);
        let active = self.listing_active.read(key);
        assert(active, 'NOT_LISTED');

        let caller = get_caller_address();
        let seller = self.listing_seller.read(key);
        assert(caller == seller, 'NOT_SELLER');

        let old_price = self.listing_price.read(key);
        self.listing_price.write(key, new_price);
        self.emit(PriceUpdated { nft_contract, token_id, old_price, new_price });
    }

    #[external(v0)]
    fn set_marketplace_fee(ref self: ContractState, new_fee_bps: u16) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        assert(new_fee_bps <= 1000, 'FEE_TOO_HIGH');
        self.marketplace_fee_bps.write(new_fee_bps);
        self.emit(MarketplaceFeeUpdated { new_fee_bps });
    }

    #[external(v0)]
    fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
        assert(new_owner != zero_address(), 'ZERO_OWNER');
        self.owner.write(new_owner);
    }

    #[external(v0)]
    fn get_listing(
        self: @ContractState, nft_contract: ContractAddress, token_id: u64,
    ) -> (ContractAddress, u128, bool, u64) {
        let key = (nft_contract, token_id);
        (
            self.listing_seller.read(key),
            self.listing_price.read(key),
            self.listing_active.read(key),
            self.listing_listed_at.read(key),
        )
    }

    #[external(v0)]
    fn get_marketplace_fee(self: @ContractState) -> u16 {
        self.marketplace_fee_bps.read()
    }

    #[external(v0)]
    fn get_stats(self: @ContractState) -> (u64, u64, u128) {
        (self.total_listings.read(), self.total_sales.read(), self.total_volume.read())
    }

    #[external(v0)]
    fn get_creator_stats(self: @ContractState, creator: ContractAddress) -> (u128, u64) {
        (self.creator_volume.read(creator), self.creator_sales.read(creator))
    }

    #[external(v0)]
    fn get_all_active_listings(
        self: @ContractState,
    ) -> Array<(ContractAddress, u64, ContractAddress, u128)> {
        let mut result: Array<(ContractAddress, u64, ContractAddress, u128)> = ArrayTrait::new();
        let count = self.listing_count.read();
        let mut i: u64 = 0;
        while i < count {
            let nft_contract = self.listing_nft_contract.read(i);
            let token_id = self.listing_token_id.read(i);
            let key = (nft_contract, token_id);
            if self.listing_active.read(key) {
                let seller = self.listing_seller.read(key);
                let price = self.listing_price.read(key);
                result.append((nft_contract, token_id, seller, price));
            }
            i += 1;
        };
        result
    }

    #[external(v0)]
    fn get_top_creators(self: @ContractState, limit: u64) -> Array<(ContractAddress, u64, u128)> {
        // Collect unique creators from listing history
        let mut creators: Array<ContractAddress> = ArrayTrait::new();
        let count = self.listing_count.read();
        let mut i: u64 = 0;
        while i < count {
            let nft_contract = self.listing_nft_contract.read(i);
            let token_id = self.listing_token_id.read(i);
            let seller = self.listing_seller.read((nft_contract, token_id));
            let mut found = false;
            let mut k: u32 = 0;
            while k < creators.len() {
                if *creators.at(k) == seller {
                    found = true;
                }
                k += 1;
            };
            if !found {
                creators.append(seller);
            }
            i += 1;
        };

        // Selection sort by volume
        let len = creators.len();
        let cap = if limit < len.into() {
            limit
        } else {
            len.into()
        };

        let mut result: Array<(ContractAddress, u64, u128)> = ArrayTrait::new();
        let mut used: Array<u32> = ArrayTrait::new();
        let mut picked: u64 = 0;

        while picked < cap {
            let mut best_idx: u32 = 0;
            let mut best_vol: u128 = 0;
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
                    let creator = *creators.at(j);
                    let vol = self.creator_volume.read(creator);
                    if !found || vol > best_vol {
                        best_idx = j;
                        best_vol = vol;
                        found = true;
                    }
                }
                j += 1;
            };
            if found {
                let creator = *creators.at(best_idx);
                let sales = self.creator_sales.read(creator);
                let volume = self.creator_volume.read(creator);
                result.append((creator, sales, volume));
                used.append(best_idx);
            }
            picked += 1;
        };
        result
    }
}
