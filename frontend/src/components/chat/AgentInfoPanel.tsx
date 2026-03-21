'use client';

import { Bot, User, Calendar, MessageCircle, Sparkles, Trash2, Loader2, Wallet, Copy } from 'lucide-react';

interface AgentInfoPanelProps {
  name: string;
  tokenId: string;
  image?: string;
  description?: string;
  traits?: string[];
  level: number;
  chatCount: number;
  creator: string;
  createdAt: bigint;
  onClearSession?: () => void;
  isClearing?: boolean;
  walletAddress?: string;
}

export function AgentInfoPanel({
  name,
  tokenId,
  image,
  description,
  traits,
  level,
  chatCount,
  creator,
  createdAt,
  onClearSession,
  isClearing,
  walletAddress,
}: AgentInfoPanelProps) {
  const formatCreator = (addr: string) => {
    const hash = addr.replace('account-hash-', '');
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="w-80 bg-black/20 border-r border-white/10 flex flex-col h-full">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Agent Image */}
        <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-lime-500/10 border border-white/10">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Bot className="w-20 h-20 text-emerald-400/30" />
            </div>
          )}
        </div>

        {/* Name & ID */}
        <div>
          <h2 className="text-xl font-bold text-white">{name}</h2>
          <p className="text-sm text-gray-400">Token #{tokenId}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-gray-400 mb-1">Level</div>
            <div className="text-xl font-bold text-emerald-400">{level}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              Chats
            </div>
            <div className="text-xl font-bold text-emerald-400">{chatCount}</div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">About</h4>
            <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Traits */}
        {traits && traits.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Personality
            </h4>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
          <h4 className="text-sm font-semibold text-gray-300">Details</h4>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Creator</div>
              <div className="text-sm text-gray-300 font-mono">{formatCreator(creator)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Created</div>
              <div className="text-sm text-gray-300">{formatDate(createdAt)}</div>
            </div>
          </div>

          {walletAddress && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Agent Wallet</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-300 font-mono truncate" title={walletAddress}>
                    {formatCreator(walletAddress)}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(walletAddress)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy Address"
                  >
                    <Copy className="w-3 h-3 text-gray-400 hover:text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear Session Button */}
      {onClearSession && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClearSession}
            disabled={isClearing}
            className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isClearing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Clear Session
          </button>
        </div>
      )}
    </div>
  );
}
