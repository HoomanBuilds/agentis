import { NextRequest, NextResponse } from 'next/server';
import { getContract, formatSTRK } from '@/lib/starknet-client';
import { resolveIPFS } from '@/lib/pinata';
import { CONTRACTS } from '@/constants/contracts';

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
  } catch {
    return null;
  }
}

async function enrichWithIPFS(tokenId: number): Promise<{ name: string; imageUrl?: string; description: string; attributes: any[] }> {
  const defaultMeta = { name: `Agent #${tokenId}`, imageUrl: undefined, description: '', attributes: [] };
  try {
    const nft = getContract('AgentNFT');
    // get_agent_metadata returns anonymous tuple: (name, token_uri, personality_hash, created_at, creator, chat_count, level, is_public)
    const meta = await nft.call('get_agent_metadata', [tokenId]);
    const r = Array.isArray(meta) ? meta : Object.values(meta as object);
    const tokenUri = String(r[1] ?? '');
    if (!tokenUri) return defaultMeta;
    const ipfsData = await fetchAgentMetadataFromIPFS(tokenUri);
    if (!ipfsData) return defaultMeta;
    return {
      name: ipfsData.name || defaultMeta.name,
      imageUrl: ipfsData.imageUrl,
      description: ipfsData.description || '',
      attributes: ipfsData.attributes || [],
    };
  } catch {
    return defaultMeta;
  }
}

/**
 * GET /api/marketplace-listing
 * Enumerate active listings by iterating all minted tokens (get_all_active_listings doesn't exist in ABI)
 */
export async function GET() {
  try {
    const nft = getContract('AgentNFT');
    const marketplace = getContract('AgentMarketplace');

    const totalSupplyRaw = await nft.call('get_total_supply', []);
    const totalSupply = Number(totalSupplyRaw ?? 0);

    if (totalSupply === 0) {
      return NextResponse.json({ success: true, listings: [], count: 0 });
    }

    const results = await Promise.allSettled(
      Array.from({ length: totalSupply }, (_, i) => i + 1).map(async (tokenId) => {
        const listing: any = await marketplace.call('get_listing', [CONTRACTS.addresses.AgentNFT, tokenId]);
        const r = Array.isArray(listing) ? listing : Object.values(listing as object);
        // tuple: (seller: ContractAddress, price: u128, is_active: bool, listed_at: u64)
        const isActive = Boolean(r[2]);
        if (!isActive) return null;

        const seller = String(r[0] ?? '');
        const price = String(r[1] ?? '0');
        const listedAt = Number(r[3] ?? 0);

        const ipfs = await enrichWithIPFS(tokenId);

        return {
          tokenId,
          price,
          priceFormatted: formatSTRK(BigInt(price)),
          seller,
          listedAt,
          name: ipfs.name,
          description: ipfs.description,
          image: ipfs.imageUrl || '',
          attributes: ipfs.attributes,
          active: true,
        };
      })
    );

    const listings = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);

    return NextResponse.json({ success: true, listings, count: listings.length });
  } catch (error: any) {
    console.error('Error fetching marketplace listings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    const listing: any = await marketplace.call('get_listing', [CONTRACTS.addresses.AgentNFT, tokenId]);
    const r = Array.isArray(listing) ? listing : Object.values(listing as object);
    // tuple: (seller: ContractAddress, price: u128, is_active: bool, listed_at: u64)
    const seller = String(r[0] ?? '');
    const price = String(r[1] ?? '0');
    const isActive = Boolean(r[2]);
    const listedAt = Number(r[3] ?? 0);

    const ipfs = await enrichWithIPFS(Number(tokenId));

    return NextResponse.json({
      success: true,
      listing: {
        tokenId: Number(tokenId),
        price,
        priceFormatted: formatSTRK(BigInt(price)),
        seller,
        listedAt,
        isActive,
        active: isActive,
        name: ipfs.name,
        description: ipfs.description,
        image: ipfs.imageUrl || '',
        attributes: ipfs.attributes,
      },
    });
  } catch (error: any) {
    console.error('Error fetching listing:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
