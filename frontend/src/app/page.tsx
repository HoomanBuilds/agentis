'use client';

import { useMemo } from 'react';
import { Sparkles, Store } from 'lucide-react';
import { Layout } from '@/components';
import { 
  HeroSection, 
  AgentGrid,
  CTASection 
} from '@/components/home';
import { MarketplaceAgentCard, MarketplaceListing } from '@/components/marketplace';
import { Agent } from '@/components/shared/AgentCard';
import { useRecentAgents, useAgentsIPFSData } from '@/hooks/queries/useAgentQueries';
import { useActiveListings } from '@/hooks/queries/useMarketplaceQueries';
import { useStats } from '@/hooks/useStats';

// Fetch IPFS data for an agent
async function fetchIPFSImage(tokenUri: string): Promise<string | undefined> {
  try {
    const cid = tokenUri.replace('ipfs://', '');
    let gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
    if (!gateway.endsWith('/ipfs/')) {
      gateway = gateway.replace(/\/$/, '') + '/ipfs/';
    }
    
    const response = await fetch(`${gateway}${cid}`);
    if (response.ok) {
      const data = await response.json();
      if (data.image) {
        return data.image.replace('ipfs://', gateway);
      }
    }
  } catch (e) {
    console.error('Error fetching IPFS data:', e);
  }
  return undefined;
}

export default function Home() {
  // React Query Hooks with caching
  const { data: stats } = useStats();
  const { data: recentAgents, isLoading: recentLoading } = useRecentAgents(8);
  const { data: activeListings, isLoading: listingsLoading } = useActiveListings();

  // Fetch IPFS data for recent agents using cached hook
  const agentsWithImages = useAgentsIPFSData(recentAgents);

  const newAgentsWithImages: Agent[] = (agentsWithImages || []).map(agent => ({
    id: Number(agent.id),
    name: agent.name,
    creator: agent.creator.length > 10 ? `${agent.creator.slice(0, 6)}...` : agent.creator,
    price: '—',
    likes: Number(agent.chat_count),
    level: Number(agent.level),
    image: agent.imageUrl,
  }));

  // Featured agent
  const featuredAgent = recentAgents && recentAgents.length > 0 ? {
    id: Number(recentAgents[0].id),
    name: recentAgents[0].name,
    creator: recentAgents[0].creator,
    price: '—',
    level: Number(recentAgents[0].level),
  } : {
    id: 1,
    name: 'Create Your First Agent',
    creator: 'You',
    price: '10',
    level: 1,
  };

  // Map active listings to Agent format
  const marketplaceListings = (activeListings || []).slice(0, 8);

  // Format stats for hero
  const heroStats = stats ? {
    agents: stats.totalAgents > 0 ? stats.totalAgents.toLocaleString() : '0',
    listings: stats.totalListings > 0 ? stats.totalListings.toLocaleString() : '0',
  } : undefined;

  return (
    <Layout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Blurs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-lime-500/6 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 right-1/3 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>

        <HeroSection featuredAgent={featuredAgent} stats={heroStats} />
        
        {/* Recently Minted Section */}
        <section className="py-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Recently Minted</h2>
                <p className="text-sm text-gray-500">Newest AI agents on the platform</p>
              </div>
            </div>
          </div>
          {recentLoading ? (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : newAgentsWithImages.length > 0 ? (
            <AgentGrid agents={newAgentsWithImages} />
          ) : (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No agents minted yet</p>
                <p className="text-gray-500 text-sm mt-1">Be the first to create an AI agent!</p>
              </div>
            </div>
          )}
        </section>

        {/* Marketplace Listings Section */}
        <section className="py-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Store className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Marketplace Listings</h2>
                <p className="text-sm text-gray-500">Agents available for purchase</p>
              </div>
            </div>
          </div>
          {listingsLoading ? (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ) : marketplaceListings.length > 0 ? (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {marketplaceListings.map((listing) => (
                  <MarketplaceAgentCard
                    key={listing.tokenId}
                    listing={listing}
                    variant="home"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <Store className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No agents listed for sale yet</p>
                <p className="text-gray-500 text-sm mt-1">List your agent on the marketplace to appear here</p>
              </div>
            </div>
          )}
        </section>
        
        <CTASection />
      </div>
    </Layout>
  );
}
