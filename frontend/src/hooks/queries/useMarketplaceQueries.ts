import { useQuery } from '@tanstack/react-query';


import { MarketplaceListing } from '@/components/marketplace';

export type { MarketplaceListing };

// Fetchers
const fetchActiveListings = async (): Promise<MarketplaceListing[]> => {
  const response = await fetch('/api/marketplace-listing');
  const data = await response.json();
  
  if (data.success && Array.isArray(data.listings)) {
    return data.listings;
  }
  return [];
};

// Hooks
export function useActiveListings() {
  return useQuery({
    queryKey: ['marketplace', 'activeListings'],
    queryFn: fetchActiveListings,
    staleTime: 1 * 60 * 1000, 
  });
}

export function useListing(tokenId: bigint | undefined) {
  return useQuery({
    queryKey: ['marketplace', 'listing', tokenId?.toString()],
    queryFn: async (): Promise<MarketplaceListing | null> => {
      if (!tokenId) return null;
      
      try {
        const response = await fetch('/api/marketplace-listing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId: Number(tokenId) }),
        });

        const data = await response.json();
        
        if (data.success && data.listing) {
          return data.listing;
        }
        return null;
      } catch (err) {
        console.error('Error fetching listing:', err);
        return null;
      }
    },
    enabled: !!tokenId,
    staleTime: 1 * 60 * 1000,
  });
}
