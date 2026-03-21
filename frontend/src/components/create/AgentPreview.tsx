'use client';

import { Bot, Sparkles, Brain, MessageSquare, Shield, Zap } from 'lucide-react';
import { AgentFormData } from './CreateAgentForm';

interface AgentPreviewProps {
  data: Partial<AgentFormData>;
  className?: string;
}

const TRAIT_ICONS: Record<string, typeof Bot> = {
  friendly: MessageSquare,
  creative: Sparkles,
  analytical: Brain,
  protective: Shield,
  energetic: Zap,
};

const TRAIT_LABELS: Record<string, string> = {
  friendly: 'Friendly',
  creative: 'Creative',
  analytical: 'Analytical',
  protective: 'Protective',
  energetic: 'Energetic',
};

export function AgentPreview({ data, className = '' }: AgentPreviewProps) {
  const hasData = data.name || data.traits?.length;

  return (
    <div className={`sticky top-24 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-emerald-400" />
        Live Preview
      </h3>

      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl shadow-black/20 hover:border-emerald-500/30 transition-all duration-300">
        {/* Image Area */}
        <div className="aspect-square bg-gradient-to-br from-emerald-500/30 via-emerald-600/20 to-lime-500/20 flex items-center justify-center relative overflow-hidden">
          {data.image ? (
            <img 
              src={URL.createObjectURL(data.image)} 
              alt="Agent preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <Bot className="w-24 h-24 text-emerald-300/60" />
          )}
          
          {/* Trait badges */}
          {data.traits && data.traits.length > 0 && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
              {data.traits.slice(0, 3).map((trait) => {
                const Icon = TRAIT_ICONS[trait] || Bot;
                return (
                  <span
                    key={trait}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-emerald-300"
                  >
                    <Icon className="w-3 h-3" />
                    {TRAIT_LABELS[trait]}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-xl font-semibold text-white truncate">
                {data.name || 'Your Agent Name'}
              </h4>
              <p className="text-sm text-gray-400 mt-0.5">by You</p>
            </div>
            <div className="px-2.5 py-1 bg-emerald-500/15 rounded-lg flex-shrink-0">
              <span className="text-emerald-400 text-xs font-semibold">Lvl 1</span>
            </div>
          </div>

          {/* Description Preview */}
          {data.description && (
            <p className="text-sm text-gray-400 line-clamp-2">
              {data.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div>
              <div className="text-xs text-gray-500 mb-0.5">Minting Cost</div>
              <div className="text-lg font-bold text-gradient">10 STRK</div>
            </div>
            <div className="text-xs text-gray-500">
              {data.knowledgeBase ? '📚 With Knowledge' : '🤖 Base Agent'}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Tips */}
      <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/5">
        <p className="text-xs text-gray-500">
          {!hasData
            ? '💡 Fill out the form to see your agent preview'
            : '✨ This is how your agent will appear on the marketplace'}
        </p>
      </div>
    </div>
  );
}
