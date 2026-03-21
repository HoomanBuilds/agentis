import Link from 'next/link';
import { Bot, Tag, MessageCircle, ShoppingCart } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

export interface MarketplaceListing {
  tokenId: number;
  name: string;
  level: number;
  chatCount: number;
  creator: string;
  seller: string;
  price: string;
  listedAt: number;
  imageUrl?: string;
  active: boolean;
}

interface MarketplaceAgentCardProps {
  listing: MarketplaceListing;
  variant?: 'default' | 'home';
  onBuy?: (listing: MarketplaceListing) => void;
}

export function MarketplaceAgentCard({ 
  listing, 
  variant = 'default',
  onBuy 
}: MarketplaceAgentCardProps) {
  const { activeKey } = useWallet();

  // Format price from wei to STRK
  const formatPrice = (wei: string) => {
    return (Number(wei) / 1e18).toFixed(2);
  };

  // Format address
  const formatAddress = (addr: string) => {
    if (!addr) return 'Unknown';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Determine link destination based on variant
  const linkDestination = variant === 'home' ? '/marketplace' : `/agent/${listing.tokenId}`;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all group">
      {/* Image */}
      <Link href={linkDestination}>
        <div className="aspect-square bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-lime-500/15 flex items-center justify-center relative overflow-hidden">
          {listing.imageUrl ? (
            <img 
              src={listing.imageUrl} 
              alt={listing.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Bot className="w-20 h-20 text-emerald-400/40" />
          )}
          
          {/* Price Badge */}
          <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1">
            <Tag className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-medium">{formatPrice(listing.price)} STRK</span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={linkDestination}>
          <h3 className="text-lg font-semibold text-white mb-1 hover:text-emerald-400 transition-colors">
            {listing.name}
          </h3>
        </Link>
        
        <div className="flex items-center gap-3 text-gray-400 text-sm mb-3">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {listing.chatCount}
          </span>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
            Lvl {listing.level}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">
            by {formatAddress(listing.seller)}
          </span>
          
          {variant === 'default' && (
            activeKey ? (
              <button
                onClick={() => onBuy?.(listing)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg flex items-center gap-1 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Buy
              </button>
            ) : (
              <Link
                href={`/agent/${listing.tokenId}`}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
              >
                View
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
