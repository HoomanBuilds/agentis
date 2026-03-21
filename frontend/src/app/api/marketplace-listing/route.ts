import { NextRequest, NextResponse } from 'next/server';
import { getContract, formatSTRK } from '@/lib/starknet-client';
import { resolveIPFS } from '@/lib/pinata';
import { CONTRACTS } from '@/constants/contracts';

/**
 * Fetch agent metadata from IPFS
 */
async function fetchAgentMetadataFromIPFS(tokenUri: string): Promise<{
  name: string;
  imageUrl?: string;
  description?: string;
  attributes?: any[];
} | null> {
  try {
    const metadataUrl = resolveIPFS(tokenUri);
    const response = await fetch(metadataUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const metadata = await response.json();
    return {
      name: metadata.name || 'Unknown Agent',
      imageUrl: metadata.image ? resolveIPFS(metadata.image) : undefined,
      description: metadata.description || '',
      attributes: metadata.attributes || [],
    };
  } catch (error) {
    console.error('Error fetching IPFS metadata:', error);
    return null;
  }
}

/**
 * GET /api/marketplace-listing
 * Get all active marketplace listings
 */
export async function GET() {
  try {
    const marketplace = getContract('AgentMarketplace');
    const nft = getContract('AgentNFT');

    const activeListings = await marketplace.call('get_all_active_listings', []);
    const listings = Array.isArray(activeListings) ? activeListings : [];

    const enriched = await Promise.all(
      listings.map(async (listing: any) => {
        try {
          const tokenId = Number(listing.token_id || listing[0]);
          const price = String(listing.price || listing[1] || '0');
          const seller = String(listing.seller || listing[2] || '');

          let name = `Agent #${tokenId}`;
          let imageUrl: string | undefined;
          let description = '';
          let attributes: any[] = [];

          try {
            const tokenUri = await nft.call('token_uri', [tokenId, 0]);
            const ipfsData = await fetchAgentMetadataFromIPFS(String(tokenUri));
            if (ipfsData) {
              name = ipfsData.name || name;
              imageUrl = ipfsData.imageUrl;
              description = ipfsData.description || '';
              attributes = ipfsData.attributes || [];
            }
          } catch {}

          return {
            tokenId,
            price,
            priceFormatted: formatSTRK(price),
            seller,
            name,
            description,
            image: imageUrl || '',
            attributes,
            active: true,
          };
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      success: true,
      listings: enriched.filter(Boolean),
      count: enriched.filter(Boolean).length,
    });
  } catch (error: any) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch marketplace listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace-listing
 * Get details for a specific listing
 */
export async function POST(request: NextRequest) {
  try {
    const { tokenId } = await request.json();

    if (tokenId === undefined || tokenId === null) {
      return NextResponse.json({ error: 'Token ID required' }, { status: 400 });
    }

    const marketplace = getContract('AgentMarketplace');
    const nft = getContract('AgentNFT');

    const listing = await marketplace.call('get_listing', [CONTRACTS.addresses.AgentNFT, tokenId]);

    const price = String(listing.price || listing[1] || '0');
    const seller = String(listing.seller || listing[2] || '');
    const isActive = Boolean(listing.is_active ?? listing[3] ?? false);

    let name = `Agent #${tokenId}`;
    let imageUrl: string | undefined;
    let description = '';
    let attributes: any[] = [];

    try {
      const tokenUri = await nft.call('token_uri', [tokenId, 0]);
      const ipfsData = await fetchAgentMetadataFromIPFS(String(tokenUri));
      if (ipfsData) {
        name = ipfsData.name || name;
        imageUrl = ipfsData.imageUrl;
        description = ipfsData.description || '';
        attributes = ipfsData.attributes || [];
      }
    } catch {}

    return NextResponse.json({
      success: true,
      listing: {
        tokenId: Number(tokenId),
        price,
        priceFormatted: formatSTRK(price),
        seller,
        isActive,
        name,
        description,
        image: imageUrl || '',
        attributes,
      },
    });
  } catch (error: any) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}
