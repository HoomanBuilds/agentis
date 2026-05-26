'use client';

import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { AnimatedSection } from '@/components/shared';

interface ProfileHeaderProps {
  address: string;
  balance: string;
  className?: string;
}

// Generate a deterministic color from address for identicon
function generateIdenticon(address: string): string[] {
  const hash = address.slice(2, 10);
  const colors = [
    'from-primary to-primary',
    'from-primary to-primary',
    'from-primary to-primary',
    'from-primary/80 to-primary',
  ];
  const index = parseInt(hash, 16) % colors.length;
  return [colors[index], colors[(index + 1) % colors.length]];
}

export function ProfileHeader({ address, balance, className = '' }: ProfileHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [gradient] = generateIdenticon(address);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedAddress = `${address.slice(0, 8)}...${address.slice(-6)}`;
  const explorerUrl = `https://sepolia.voyager.online/contract/${address}`;

  return (
    <AnimatedSection animation="fadeInUp" className={className}>
      <div className="glass-panel p-8 rounded-2xl border border-primary/20">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Identicon Avatar */}
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-primary/20`}>
            <span className="text-3xl font-bold text-primary-foreground/80">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-foreground mb-2">My Profile</h1>
            
            {/* Address Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
              <code className="px-3 py-1.5 bg-input rounded-lg text-primary text-sm font-mono">
                {truncatedAddress}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Balance */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
              <span className="text-muted-foreground text-sm">Balance:</span>
              <span className="text-lg font-bold text-gradient-lime">{balance} STRK</span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
