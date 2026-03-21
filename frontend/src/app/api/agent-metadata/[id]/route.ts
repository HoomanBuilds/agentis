import { NextRequest, NextResponse } from 'next/server';
import { resolveIPFS } from '@/lib/pinata';
import { getContract } from '@/lib/starknet-client';

interface AgentMetadataResponse {
  name: string;
  description: string;
  image: string;
  personality: Record<string, unknown>;
  attributes: Array<{ trait_type: string; value: string | number }>;
}

/**
 * Fetch tokenURI from the AgentNFT contract using token ID
 */
async function getTokenUriFromContract(tokenId: string): Promise<string | null> {
  try {
    const contract = getContract('AgentNFT');
    const result = await contract.call('token_uri', [tokenId]);
    if (result !== undefined && result !== null) {
      return String(result);
    }
    return null;
  } catch (error) {
    console.error('Error fetching tokenURI from contract:', error);
    return null;
  }
}

/**
 * GET /api/agent-metadata/[id]
 * Fetch agent metadata from IPFS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing agent ID' },
        { status: 400 }
      );
    }

    let metadataUrl: string | null = null;

    if (id.startsWith('ipfs://') || id.startsWith('Qm') || id.match(/^[a-zA-Z0-9]{46}$/)) {
      metadataUrl = resolveIPFS(id);
    } else if (/^\d+$/.test(id)) {
      metadataUrl = await getTokenUriFromContract(id);
      if (metadataUrl) {
        metadataUrl = resolveIPFS(metadataUrl);
      }
    } else {
      metadataUrl = id;
    }

    if (!metadataUrl) {
      return NextResponse.json(
        { error: 'Could not resolve metadata URL for this agent' },
        { status: 404 }
      );
    }

    const response = await fetch(metadataUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata = await response.json();

    if (metadata.image) {
      metadata.image = resolveIPFS(metadata.image);
    }

    return NextResponse.json({
      success: true,
      metadata: metadata as AgentMetadataResponse,
    });
  } catch (error) {
    console.error('Agent metadata API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent metadata' },
      { status: 500 }
    );
  }
}
