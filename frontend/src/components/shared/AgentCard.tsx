'use client';

import Link from 'next/link';
import { Bot, MessageSquare } from 'lucide-react';

export interface Agent {
  id: number;
  name: string;
  creator: string;
  price?: string;
  level?: number;
  likes?: number;
  image?: string;
}

interface AgentCardProps {
  agent: Agent;
  showPrice?: boolean;
  className?: string;
}

export function AgentCard({ agent, showPrice = false, className = '' }: AgentCardProps) {
  return (
    <Link 
      href={`/agent/${agent.id}`}
      className={`group bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer ${className}`}
    >
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-lime-500/15 flex items-center justify-center relative overflow-hidden group-hover:from-emerald-500/30 group-hover:to-lime-500/20 transition-colors duration-300">
        {agent.image ? (
          <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
        ) : (
          <Bot className="w-20 h-20 text-emerald-400/40 group-hover:text-emerald-400/60 group-hover:scale-110 transition-all duration-300" />
        )}
        
        {/* Level badge */}
        {agent.level && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg">
            <span className="text-emerald-400 text-xs font-semibold">Lvl {agent.level}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">{agent.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">by {agent.creator}</p>
          </div>
          {agent.likes !== undefined && agent.likes > 0 && (
            <div className="flex items-center gap-1 text-gray-400 text-xs ml-2">
              <MessageSquare className="w-3.5 h-3.5" />
              {agent.likes}
            </div>
          )}
        </div>
        
        {/* Price - only shown when showPrice is true */}
        {showPrice && agent.price && agent.price !== '—' && (
          <div className="pt-3 border-t border-white/5">
            <div className="text-xs text-gray-500">Price</div>
            <div className="text-sm font-semibold text-gradient">{agent.price} STRK</div>
          </div>
        )}
      </div>
    </Link>
  );
}
