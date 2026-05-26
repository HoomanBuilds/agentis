'use client';

import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Layout } from '@/components';
import { AgentCard } from '@/components/shared';
import { useAllAgents, useAgentsIPFSData } from '@/hooks/queries/useAgentQueries';
import { Agent } from '@/components/shared/AgentCard';
import { Search } from 'lucide-react';

export default function AgentsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: agents, isLoading } = useAllAgents();

  const agentsWithIPFS = useAgentsIPFSData(agents);

  const allAgents: Agent[] = useMemo(() => {
    return (agentsWithIPFS || []).map((agent) => ({
      id: Number(agent.id),
      name: agent.name,
      creator: agent.creator.length > 20 ? `${agent.creator.slice(0, 8)}...` : agent.creator,
      price: '—',
      likes: Number(agent.chat_count),
      level: Number(agent.level),
      image: agent.imageUrl,
    }));
  }, [agentsWithIPFS]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return allAgents;
    const query = searchQuery.toLowerCase();
    return allAgents.filter(
      (agent) => agent.name.toLowerCase().includes(query) || agent.creator.toLowerCase().includes(query)
    );
  }, [allAgents, searchQuery]);

  return (
    <Layout>
      <div className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-display mb-3">
              Browse <span className="text-gradient-lime">Agents</span>
            </h1>
            <p className="text-muted-foreground">Discover and chat with unique AI agent personalities</p>
          </motion.div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 bg-card border border-border rounded-xl py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Agent grid */}
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {isLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
              ))
            ) : filteredAgents.length > 0 ? (
              filteredAgents.map((agent) => <AgentCard key={agent.id} agent={agent} />)
            ) : (
              <div className="col-span-full text-center py-20 bg-card rounded-2xl border border-border">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No agents found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms' : 'No agents have been minted yet'}
                </p>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </Layout>
  );
}
