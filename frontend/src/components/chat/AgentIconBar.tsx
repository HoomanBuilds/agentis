'use client';

import { Bot } from 'lucide-react';

interface Agent {
  id: number;
  name: string;
  image?: string;
}

interface AgentIconBarProps {
  agents: Agent[];
  selectedId: number;
  onSelect: (id: number) => void;
  isLoading?: boolean;
}

export function AgentIconBar({ agents, selectedId, onSelect, isLoading }: AgentIconBarProps) {
  if (isLoading) {
    return (
      <div className="w-20 bg-black/30 border-r border-white/10 flex flex-col items-center py-4">
        <div className="w-12 h-12 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-20 bg-black/30 border-r border-white/10 flex flex-col items-center py-4 gap-3 overflow-y-auto">
      {/* Section Label */}
      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
        Agents
      </div>

      {/* Agent Avatars */}
      {agents.map((agent) => (
        <button
          key={agent.id}
          onClick={() => onSelect(agent.id)}
          className={`w-12 h-12 rounded-xl overflow-hidden transition-all ${
            selectedId === agent.id
              ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-black/50'
              : 'opacity-60 hover:opacity-100'
          }`}
          title={agent.name}
        >
          {agent.image ? (
            <img
              src={agent.image}
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
          )}
        </button>
      ))}

      {agents.length === 0 && (
        <div className="text-xs text-gray-500 text-center px-2">
          No agents
        </div>
      )}
    </div>
  );
}
