'use client';

import { Bot, Plus } from 'lucide-react';
import { AnimatedSection, AgentCard, LoadingCard, EmptyState } from '@/components/shared';
import { Agent } from '@/components/shared/AgentCard';

interface MyNFTsSectionProps {
  agents: Agent[];
  isLoading: boolean;
  className?: string;
}

export function MyNFTsSection({ agents, isLoading, className = '' }: MyNFTsSectionProps) {
  return (
    <AnimatedSection animation="fadeInUp" delay={0.2} className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-emerald-400" />
          My AI Agents
        </h2>
        <span className="text-sm text-gray-400">
          {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      ) : agents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bot}
          title="No Agents Yet"
          description="You haven't created any AI agents yet. Create your first agent to get started!"
          action={{
            label: 'Create Agent',
            href: '/create',
          }}
        />
      )}
    </AnimatedSection>
  );
}
