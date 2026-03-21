'use client';

import { useEffect, useRef } from 'react';
import { MessageSquare, Trophy, TrendingUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface TopAgent {
  tokenId: string;
  chatCount: string;
  name?: string;
  image?: string;
}

interface TopAgentsProps {
  agents: TopAgent[];
  isLoading?: boolean;
}

export function TopAgents({ agents, isLoading = false }: TopAgentsProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.agent-row', 
        { opacity: 0, x: 20 },
        {
          opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [agents]);

  if (isLoading) {
    return (
      <div ref={sectionRef} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 p-6 h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Top Agents</h3>
            <p className="text-xs text-gray-500">By chat activity</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-white/10" />
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-24 mb-1" />
                <div className="h-3 bg-white/5 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Top Agents</h3>
            <p className="text-xs text-gray-500">By chat activity</p>
          </div>
        </div>
        <TrendingUp className="w-4 h-4 text-emerald-400" />
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No agent activity yet</p>
          <p className="text-gray-600 text-xs mt-1">Chat with agents to see rankings</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent, index) => (
            <Link
              key={agent.tokenId}
              href={`/agent/${agent.tokenId}`}
              className="agent-row flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 hover:bg-white/8 transition-all cursor-pointer group"
            >
              {/* Rank Badge */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black' :
                index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-200 text-black' :
                index === 2 ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-black' :
                'bg-white/10 text-gray-400'
              }`}>
                {index + 1}
              </div>

              {/* Agent Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate group-hover:text-amber-400 transition-colors">
                  {agent.name || `Agent #${agent.tokenId}`}
                </div>
                <div className="text-xs text-gray-500">ID: {agent.tokenId}</div>
              </div>

              {/* Chat Count */}
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-400 font-semibold text-sm">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {parseInt(agent.chatCount).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">chats</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
