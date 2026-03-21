'use client';

import { Bot, Coins, MessageCircle } from 'lucide-react';
import { AnimatedSection } from '@/components/shared';

interface ProfileStatsProps {
  agentCount: number;
  creditBalance: bigint;
  totalChats: number;
  className?: string;
}

export function ProfileStats({ 
  agentCount, 
  creditBalance, 
  totalChats,
  className = '' 
}: ProfileStatsProps) {
  const stats = [
    {
      label: 'Agents Owned',
      value: agentCount.toString(),
      icon: Bot,
      gradient: 'from-emerald-500 to-lime-500',
    },
    {
      label: 'Credits',
      value: creditBalance.toString(),
      icon: Coins,
      gradient: 'from-lime-500 to-emerald-500',
    },
    {
      label: 'Total Chats',
      value: totalChats.toLocaleString(),
      icon: MessageCircle,
      gradient: 'from-teal-500 to-emerald-500',
    },
  ];

  return (
    <AnimatedSection 
      animation="fadeInUp" 
      delay={0.1}
      staggerChildren
      className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass-panel p-6 rounded-xl border border-emerald-500/20 group hover:border-emerald-500/40 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/20 transition-shadow`}>
              <stat.icon className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </AnimatedSection>
  );
}
