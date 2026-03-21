'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bot, Sparkles, Users, Zap, ArrowRight, TrendingUp } from 'lucide-react';
import gsap from 'gsap';

interface HeroStats {
  agents: string;
  listings: string;
}

interface HeroSectionProps {
  featuredAgent?: {
    id: number;
    name: string;
    creator: string;
    price: string;
    level: number;
  };
  stats?: HeroStats;
}

export function HeroSection({ stats }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-content', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );

      gsap.fromTo('.hero-stats', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.3, ease: 'power3.out' }
      );

      gsap.fromTo('.hero-feature', 
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.5, ease: 'power2.out' }
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const displayStats = [
    { value: stats?.agents || '0', label: 'AI Agents' },
    { value: stats?.listings || '0', label: 'Listed' },
  ];

  const features = [
    { icon: Sparkles, text: 'Create unique AI personalities' },
    { icon: Zap, text: 'Trade on the marketplace' },
    { icon: Users, text: 'Earn from every interaction' },
  ];

  return (
    <section ref={heroRef} className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Main Content - Centered */}
        <div className="hero-content text-center space-y-8 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Live on Starknet</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
            Own & Trade
            <span className="block text-gradient mt-2">AI-Powered NFTs</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg lg:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Create unique AI agents with distinct personalities, trade them as NFTs, 
            and earn from every chat interaction. Built on Starknet for low fees and fast transactions.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/create"
              className="group px-8 py-4 bg-gradient-primary text-black font-semibold rounded-2xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-emerald-500/25"
            >
              <span className="flex items-center gap-2">
                Create Agent
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all duration-300"
            >
              Explore Marketplace
            </Link>
          </div>

          
        </div>

        {/* Stats Row */}
        <div className="hero-stats grid grid-cols-2 gap-4 max-w-sm mx-auto mt-16">
          {displayStats.map((stat) => (
            <div 
              key={stat.label} 
              className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5"
            >
              <div className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
