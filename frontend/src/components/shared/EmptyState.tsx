'use client';

import { ReactNode } from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
  className = '',
  children,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-primary/60" />
      </div>
      
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      )}
      
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg shadow-primary/25"
          >
            {action.label}
          </button>
        )
      )}
      
      {children}
    </div>
  );
}

export function ConnectWalletState() {
  return (
    <EmptyState
      title="Connect Your Wallet"
      description="Please connect your Starknet wallet to view your profile and manage your AI agents."
    />
  );
}
