'use client';

import { useState, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Layout } from '@/components';
import { AnimatedSection, ConnectWalletState, LoadingPage } from '@/components/shared';
import { ProfileHeader, ProfileStats, MyNFTsSection, CreditsSection } from '@/components/profile';
import { useWallet } from '@/hooks/useWallet';
import { useOwnedAgents, useAgentsMetadata, useAgentsIPFSData } from '@/hooks/queries/useAgentQueries';
import { useCreditBalance } from '@/hooks/queries/useCreditQueries';
import { Agent } from '@/components/shared/AgentCard';
import { CONTRACTS } from '@/constants/contracts';

export default function ProfilePage() {
  const { isConnected, activeKey, formattedBalance, isLoading: walletLoading } = useWallet();

  const { data: tokenIds, isLoading: isLoadingIds } = useOwnedAgents(activeKey || undefined);
  
  const { balance: creditBalance } = useCreditBalance(activeKey || undefined);
  
  // Fetch metadata for all owned agents
  const { data: agentsMetadata, isLoading: isLoadingMetadata } = useAgentsMetadata(tokenIds);
  
  // Fetch IPFS data for all owned agents
  const agentsWithImages = useAgentsIPFSData(agentsMetadata);

  const agents: Agent[] = (agentsWithImages || []).map(agent => ({
    id: Number(agent.id),
    name: agent.name,
    creator: agent.creator 
      ? `${agent.creator.slice(0, 6)}...${agent.creator.slice(-4)}`
      : 'Unknown',
    price: '—',
    likes: Number(agent.chat_count || 0),
    level: Number(agent.level || 1),
    image: agent.imageUrl,
  }));

  const isLoadingData = isLoadingIds || isLoadingMetadata || (agentsWithImages && agentsWithImages.some(a => a.isLoading));

  // Local state for total chats (derived from agents)
  const [totalChats, setTotalChats] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'nfts' | 'credits'>('nfts');

  // Calculate total chats
  useEffect(() => {
    const chats = agents.reduce((sum, agent) => sum + (agent.likes || 0), 0);
    setTotalChats(chats);
  }, [agents]);

  // Show loading while wallet is connecting
  if (walletLoading) {
    return (
      <Layout>
        <LoadingPage />
      </Layout>
    );
  }

  // Show connect wallet prompt if not connected
  if (!isConnected || !activeKey) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <ConnectWalletState />
        </div>
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
        </div>

        {/* Content */}
        <div className="relative py-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <AnimatedSection animation="fadeInUp">
              <ProfileHeader 
                address={activeKey} 
                balance={formattedBalance}
              />
            </AnimatedSection>

            <AnimatedSection animation="fadeInUp" delay={0.1}>
              <ProfileStats
                agentCount={agents.length}
                creditBalance={creditBalance}
                totalChats={totalChats}
              />
            </AnimatedSection>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-white/10">
              <button
                onClick={() => setActiveTab('nfts')}
                className={`pb-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'nfts' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                My Agents
                {activeTab === 'nfts' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`pb-4 text-sm font-medium transition-colors relative ${
                  activeTab === 'credits' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                Credits & Packages
                {activeTab === 'credits' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Tab Content */}
            <AnimatedSection animation="fadeInUp" delay={0.3}>
            <div className="min-h-[400px]">
              {activeTab === 'nfts' ? (
                <MyNFTsSection 
                  agents={agents} 
                  isLoading={isLoadingData}
                />
              ) : (
                <CreditsSection userKey={activeKey} />
              )}
            </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </Layout>
  );
}
