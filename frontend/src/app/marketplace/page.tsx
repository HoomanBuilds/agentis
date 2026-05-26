'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { Layout } from '@/components';
import { BuyAgentModal, MarketplaceShimmer, MarketplaceAgentCard } from '@/components/marketplace';
import { Bot, Store, Search, Filter, Sparkles } from 'lucide-react';

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
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'recent'>('recent');

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
    },
  });

  const formatPrice = (wei: string) => (Number(wei) / 1e18).toFixed(2);

  const displayListings = listings
    .filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return Number(a.price) - Number(b.price);
        case 'price-desc': return Number(b.price) - Number(a.price);
        default: return b.listedAt - a.listedAt;
      }
    });

  const handleBuyClick = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setShowBuyModal(true);
  };

  if (isLoading) {
    return <Layout><MarketplaceShimmer /></Layout>;
  }

  return (
    <Layout>
      <div className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-display mb-3">
              Agent <span className="text-gradient-lime">Marketplace</span>
            </h1>
            <p className="text-muted-foreground">Browse and collect unique AI agent NFTs</p>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Listed', value: listings.length },
              {
                label: 'Floor Price',
                value: listings.length > 0
                  ? `${formatPrice(Math.min(...listings.map((l) => Number(l.price))).toString())} STRK`
                  : '— STRK',
              },
              {
                label: 'Ceiling Price',
                value: listings.length > 0
                  ? `${formatPrice(Math.max(...listings.map((l) => Number(l.price))).toString())} STRK`
                  : '— STRK',
              },
              { label: 'Unique Sellers', value: new Set(listings.map((l) => l.seller)).size },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <div className="text-muted-foreground text-sm mb-1">{stat.label}</div>
                <div className="text-xl font-bold text-foreground">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Search + filter row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 bg-card border border-border rounded-xl py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none pl-11 pr-10 bg-card border border-border rounded-xl py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              >
                <option value="recent">Most Recent</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Agent grid */}
          {displayListings.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No Listings Found</h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? 'No agents match your search.' : 'Be the first to list an agent!'}
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                Create Agent
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayListings.map((listing) => (
                <MarketplaceAgentCard key={listing.tokenId} listing={listing} onBuy={handleBuyClick} />
              ))}
            </div>
          )}

        </div>
      </div>

      {selectedListing && (
        <BuyAgentModal
          isOpen={showBuyModal}
          onClose={() => { setShowBuyModal(false); setSelectedListing(null); }}
          tokenId={BigInt(selectedListing.tokenId)}
          agentName={selectedListing.name}
          price={BigInt(selectedListing.price)}
          seller={selectedListing.seller}
          imageUrl={selectedListing.imageUrl}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] })}
        />
      )}
    </Layout>
  );
}
