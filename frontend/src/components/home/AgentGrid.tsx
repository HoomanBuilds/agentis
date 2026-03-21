'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { AgentCard, Agent } from '@/components/shared/AgentCard';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AgentGridProps {
  agents: Agent[];
  showPrice?: boolean;
}

export function AgentGrid({ agents, showPrice = false }: AgentGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.agent-grid-card', 
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: gridRef.current, start: 'top 85%' }
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [agents]);

  return (
    <div ref={gridRef} className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {agents.map((agent) => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            showPrice={showPrice}
            className="agent-grid-card"
          />
        ))}
      </div>
    </div>
  );
}
