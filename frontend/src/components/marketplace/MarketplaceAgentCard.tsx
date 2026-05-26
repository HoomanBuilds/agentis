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
  onBuy,
}: MarketplaceAgentCardProps) {
  const { activeKey } = useWallet();

  const formatPrice = (wei: string) => (Number(wei) / 1e18).toFixed(2);
  const formatAddress = (addr: string) => (!addr ? 'Unknown' : `${addr.slice(0, 6)}...${addr.slice(-4)}`);

  const linkDestination = variant === 'home' ? '/marketplace' : `/agent/${listing.tokenId}`;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group">
      {/* Image */}
      <Link href={linkDestination}>
        <div className="aspect-square bg-secondary flex items-center justify-center relative overflow-hidden">
          {listing.imageUrl ? (
            <img
              src={listing.imageUrl}
              alt={listing.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Bot className="w-20 h-20 text-muted-foreground/30" />
          )}

          {/* Price Badge */}
          <div className="absolute top-3 right-3 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full border border-border flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground text-sm font-medium">{formatPrice(listing.price)} STRK</span>
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link href={linkDestination}>
          <h3 className="text-base font-semibold text-foreground mb-1 hover:text-primary transition-colors">
            {listing.name}
          </h3>
        </Link>

        <div className="flex items-center gap-3 text-muted-foreground text-sm mb-3">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {listing.chatCount}
          </span>
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full border border-primary/20">
            Lvl {listing.level}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground/60 text-xs">by {formatAddress(listing.seller)}</span>

          {variant === 'default' && (
            activeKey ? (
              <button
                onClick={() => onBuy?.(listing)}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg flex items-center gap-1 hover:opacity-90 transition-opacity"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Buy
              </button>
            ) : (
              <Link
                href={`/agent/${listing.tokenId}`}
                className="px-3 py-1.5 bg-secondary border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
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
