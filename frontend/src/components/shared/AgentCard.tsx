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
      className={`group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer ${className}`}
    >
      {/* Image */}
      <div className="aspect-square bg-secondary flex items-center justify-center relative overflow-hidden group-hover:bg-muted transition-colors duration-300">
        {agent.image ? (
          <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
        ) : (
          <Bot className="w-20 h-20 text-muted-foreground/30 group-hover:text-primary/40 group-hover:scale-110 transition-all duration-300" />
        )}

        {/* Level badge */}
        {agent.level && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-background/70 backdrop-blur-sm rounded-lg border border-border">
            <span className="text-primary text-xs font-semibold">Lvl {agent.level}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{agent.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">by {agent.creator}</p>
          </div>
          {agent.likes !== undefined && agent.likes > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs ml-2">
              <MessageSquare className="w-3.5 h-3.5" />
              {agent.likes}
            </div>
          )}
        </div>

        {showPrice && agent.price && agent.price !== '—' && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-sm font-semibold text-gradient-lime">{agent.price} STRK</div>
          </div>
        )}
      </div>
    </Link>
  );
}
