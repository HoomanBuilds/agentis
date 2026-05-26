'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components';
import { ConnectWalletState, LoadingPage } from '@/components/shared';
import { ProfileHeader, ProfileStats, MyNFTsSection, CreditsSection } from '@/components/profile';
import { useWallet } from '@/hooks/useWallet';
import { useOwnedAgents, useAgentsMetadata, useAgentsIPFSData } from '@/hooks/queries/useAgentQueries';
import { useCreditBalance } from '@/hooks/queries/useCreditQueries';
import { Agent } from '@/components/shared/AgentCard';

export default function ProfilePage() {
  const { isConnected, activeKey, formattedBalance, isLoading: walletLoading } = useWallet();
  const { data: tokenIds, isLoading: isLoadingIds } = useOwnedAgents(activeKey || undefined);
  const { balance: creditBalance } = useCreditBalance(activeKey || undefined);
  const { data: agentsMetadata, isLoading: isLoadingMetadata } = useAgentsMetadata(tokenIds);
  const agentsWithImages = useAgentsIPFSData(agentsMetadata);

  const agents: Agent[] = (agentsWithImages || []).map((agent) => ({
    id: Number(agent.id),
    name: agent.name,
    creator: agent.creator ? `${agent.creator.slice(0, 6)}...${agent.creator.slice(-4)}` : 'Unknown',
    price: '—',
    likes: Number(agent.chat_count || 0),
    level: Number(agent.level || 1),
    image: agent.imageUrl,
  }));

  const isLoadingData = isLoadingIds || isLoadingMetadata;
  const [totalChats, setTotalChats] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'nfts' | 'credits'>('nfts');

  useEffect(() => {
    const chats = agents.reduce((sum, agent) => sum + (agent.likes || 0), 0);
    setTotalChats(chats);
  }, [agents]);

  if (walletLoading) return <Layout><LoadingPage /></Layout>;
  if (!isConnected || !activeKey) {
    return <Layout><div className="min-h-[80vh] flex items-center justify-center px-4"><ConnectWalletState /></div></Layout>;
  }

  return (
    <Layout>
      <div className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ProfileHeader address={activeKey} balance={formattedBalance} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <ProfileStats agentCount={agents.length} creditBalance={creditBalance} totalChats={totalChats} />
          </motion.div>

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex gap-6">
              {[
                { id: 'nfts', label: 'My Agents' },
                { id: 'credits', label: 'Credits & Packages' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'nfts' | 'credits')}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-[400px]"
          >
            {activeTab === 'nfts' ? (
              <MyNFTsSection agents={agents} isLoading={isLoadingData} />
            ) : (
              <CreditsSection userKey={activeKey} />
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
