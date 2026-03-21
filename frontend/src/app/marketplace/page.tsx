'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components';
import { AnimatedSection } from '@/components/shared';
import { BuyAgentModal, MarketplaceShimmer, MarketplaceAgentCard } from '@/components/marketplace';
import { useWallet } from '@/hooks/useWallet';
import { 
  Bot, Store, Search, Filter, Tag, MessageCircle, Sparkles,
  TrendingUp, ShoppingCart
} from 'lucide-react';

interface MarketplaceListing {
  tokenId: number;
  name: string;
  level: number;
  chatCount: number;
  creator: string;
  seller: string;
  price: string;
  listedAt: number;
  imageUrl?: string;
  active: boolean;
}

export default function MarketplacePage() {
  const { activeKey } = useWallet();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'recent'>('recent');
  
  // Buy modal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketplace', 'listings'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace-listing');
      const data = await response.json();
      if (data.success && Array.isArray(data.listings)) {
        return data.listings as MarketplaceListing[];
      }
      return [];
    }
  });

  // Format price from wei to STRK
  const formatPrice = (wei: string) => {
    return (Number(wei) / 1e18).toFixed(2);
  };

  // Format address
  const formatAddress = (addr: string) => {
    if (!addr) return 'Unknown';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Filter and sort listings
  const displayListings = listings
    .filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return Number(a.price) - Number(b.price);
        case 'price-desc':
          return Number(b.price) - Number(a.price);
        case 'recent':
        default:
          return b.listedAt - a.listedAt;
      }
    });

  const handleBuyClick = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setShowBuyModal(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <MarketplaceShimmer />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-lime-500/6 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative py-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <AnimatedSection animation="fadeInUp" className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Store className="w-8 h-8 text-emerald-400" />
                <h1 className="text-3xl font-bold text-white">Marketplace</h1>
              </div>
              <p className="text-gray-400">
                Discover and purchase AI agents created by the community
              </p>
            </AnimatedSection>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                >
                  <option value="recent">Most Recent</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Stats Grid */}
            <AnimatedSection animation="fadeInUp" delay={0.2}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Total Listed</div>
                <div className="text-2xl font-bold text-white">{listings.length}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Floor Price</div>
                <div className="text-2xl font-bold text-white">
                  {listings.length > 0 
                    ? formatPrice(Math.min(...listings.map(l => Number(l.price))).toString())
                    : '0'
                  } STRK
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Ceiling Price</div>
                <div className="text-2xl font-bold text-white">
                  {listings.length > 0 
                    ? formatPrice(Math.max(...listings.map(l => Number(l.price))).toString())
                    : '0'
                  } STRK
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-gray-400 text-sm mb-1">Unique Sellers</div>
                <div className="text-2xl font-bold text-white">
                  {new Set(listings.map(l => l.seller)).size}
                </div>
              </div>
            </div>
            </AnimatedSection>

            {/* Listings Grid */}
            {displayListings.length === 0 ? (
              <div className="text-center py-16">
                <Bot className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No Listings Found</h2>
                <p className="text-gray-400 mb-6">
                  {searchQuery 
                    ? 'No agents match your search criteria.' 
                    : 'Be the first to list an agent for sale!'}
                </p>
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Agent
                </Link>
              </div>
            ) : (
              <AnimatedSection animation="fadeInUp" delay={0.3}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayListings.map((listing) => (
                  <MarketplaceAgentCard
                    key={listing.tokenId}
                    listing={listing}
                    onBuy={handleBuyClick}
                  />
                ))}
              </div>
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      {selectedListing && (
        <BuyAgentModal
          isOpen={showBuyModal}
          onClose={() => {
            setShowBuyModal(false);
            setSelectedListing(null);
          }}
          tokenId={BigInt(selectedListing.tokenId)}
          agentName={selectedListing.name}
          price={BigInt(selectedListing.price)}
          seller={selectedListing.seller}
          imageUrl={selectedListing.imageUrl}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
          }}
        />
      )}
    </Layout>
  );
}
