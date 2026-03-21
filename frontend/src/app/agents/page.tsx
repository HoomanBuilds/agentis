'use client';

import { useState, useMemo } from 'react';
import { Layout } from '@/components';
import { AgentCard, AnimatedSection } from '@/components/shared';
import { useAllAgents, useAgentsIPFSData } from '@/hooks/queries/useAgentQueries';
import { Agent } from '@/components/shared/AgentCard';
import { Search, Sparkles } from 'lucide-react';

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: agents, isLoading } = useAllAgents();
  
  const agentsWithIPFS = useAgentsIPFSData(agents);
  
  const allAgents: Agent[] = useMemo(() => {
    return (agentsWithIPFS || []).map(agent => ({
      id: Number(agent.id),
      name: agent.name,
      creator: agent.creator.length > 20 
        ? `${agent.creator.replace('account-hash-', '').slice(0, 8)}...` 
        : agent.creator,
      price: '—',
      likes: Number(agent.chat_count),
      level: Number(agent.level),
      image: agent.imageUrl,
    }));
  }, [agentsWithIPFS]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return allAgents;
    const query = searchQuery.toLowerCase();
    return allAgents.filter(agent =>
      agent.name.toLowerCase().includes(query) ||
      agent.creator.toLowerCase().includes(query)
    );
  }, [allAgents, searchQuery]);

  return (
    <Layout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[150px]" />
          <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-lime-500/6 rounded-full blur-[120px]" />
        </div>

        <div className="relative py-12">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <AnimatedSection animation="fadeInUp" className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-8 h-8 text-emerald-400" />
                <h1 className="text-3xl font-bold text-white">All AI Agents</h1>
              </div>
              <p className="text-gray-400">
                Explore the complete collection of AI Agents minted on Starknet.
              </p>
            </AnimatedSection>

            {/* Search */}
            <div className="mb-8">
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
            </div>

            {/* Agents Grid */}
            <AnimatedSection animation="fadeInUp" delay={0.2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {isLoading ? (
                [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                ))
              ) : filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    className="agent-grid-card"
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No agents found
                  </h3>
                  <p className="text-gray-400">
                    {searchQuery ? 'Try adjusting your search terms' : 'No agents have been minted yet'}
                  </p>
                </div>
              )}
            </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </Layout>
  );
}
