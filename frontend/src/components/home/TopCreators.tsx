'use client';

import { useEffect, useRef } from 'react';
import { Users, Coins, Shield, Zap } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Creator {
  name: string;
  agents: number;
  volume: string;
}

interface TopCreatorsProps {
  creators: Creator[];
}

const whyStarknetFeatures = [
  { icon: Coins, title: 'Low Fees', desc: 'Minimal gas costs' },
  { icon: Shield, title: 'Secure', desc: 'Zero-knowledge proofs' },
  { icon: Zap, title: 'Fast', desc: 'Quick finality' },
];

export function TopCreators({ creators }: TopCreatorsProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.creator-row', 
        { opacity: 0, x: -20 },
        {
          opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Creators */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Top Creators</h2>
                <p className="text-sm text-gray-500">This month&apos;s leaders</p>
              </div>
            </div>

            <div className="space-y-3">
              {creators.map((creator, index) => (
                <div 
                  key={creator.name}
                  className="creator-row flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-emerald-500/20 hover:bg-white/8 transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold text-gray-400">
                    {index + 1}
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/25 to-lime-500/15 flex items-center justify-center">
                    <span className="text-base font-bold text-emerald-400">{creator.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{creator.name}</div>
                    <div className="text-xs text-gray-500">{creator.agents} agents</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gradient">{creator.volume}</div>
                    <div className="text-xs text-gray-500">STRK</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Starknet */}
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/5 p-6 h-fit">
            <h3 className="text-lg font-bold mb-5">Why Starknet?</h3>
            <div className="space-y-5">
              {whyStarknetFeatures.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
