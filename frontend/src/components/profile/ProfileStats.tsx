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
      gradient: 'from-primary to-primary',
    },
    {
      label: 'Credits',
      value: creditBalance.toString(),
      icon: Coins,
      gradient: 'from-primary to-primary',
    },
    {
      label: 'Total Chats',
      value: totalChats.toLocaleString(),
      icon: MessageCircle,
      gradient: 'from-primary/80 to-primary',
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
          className="glass-panel p-6 rounded-xl border border-primary/20 group hover:border-primary/40 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-shadow`}>
              <stat.icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </AnimatedSection>
  );
}
