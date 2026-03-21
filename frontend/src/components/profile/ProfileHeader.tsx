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
    'from-emerald-500 to-lime-500',
    'from-emerald-400 to-teal-500',
    'from-lime-400 to-emerald-500',
    'from-teal-400 to-emerald-400',
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
      <div className="glass-panel p-8 rounded-2xl border border-emerald-500/20">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Identicon Avatar */}
          <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-emerald-500/20`}>
            <span className="text-3xl font-bold text-black/80">
              {address.slice(2, 4).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white mb-2">My Profile</h1>
            
            {/* Address Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
              <code className="px-3 py-1.5 bg-black/40 rounded-lg text-emerald-400 text-sm font-mono">
                {truncatedAddress}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-emerald-500/10 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-emerald-500/10 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Balance */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <span className="text-gray-400 text-sm">Balance:</span>
              <span className="text-lg font-bold text-gradient">{balance} STRK</span>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
