import { NextRequest, NextResponse } from 'next/server';
import { uploadJSONToPinata, getIPFSUri, resolveIPFS } from '@/lib/pinata';
import { getContract } from '@/lib/starknet-client';

interface AgentSettings {
  agentId: number;
  personality: {
    role?: string;
    tone?: string;
    style?: string;
    knowledge_focus?: string[];
    likes?: string[];
    dislikes?: string[];
    backstory?: string;
  };
  model?: {
    temperature?: number;
    model?: string;
  };
  knowledgeBaseId?: string;
}

/**
 * Fetch tokenURI from the AgentNFT contract
 */
async function getTokenUriFromContract(tokenId: number): Promise<string | null> {
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
 * GET /api/agent/settings?agentId=1
 * Get agent settings/personality from IPFS
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const tokenUri = searchParams.get('tokenUri');

    if (!agentId && !tokenUri) {
      return NextResponse.json(
        { error: 'Missing agentId or tokenUri' },
        { status: 400 }
      );
    }

    let resolvedTokenUri = tokenUri;

    if (!resolvedTokenUri && agentId) {
      resolvedTokenUri = await getTokenUriFromContract(parseInt(agentId, 10));
    }

    if (resolvedTokenUri) {
      const metadataUrl = resolveIPFS(resolvedTokenUri);
      const response = await fetch(metadataUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch metadata from IPFS');
      }

      const metadata = await response.json();

      return NextResponse.json({
        success: true,
        settings: {
          agentId: parseInt(agentId || '0', 10),
          personality: metadata.personality || {},
          model: metadata.model || {},
          knowledgeBaseId: metadata.knowledgeBaseId,
        },
      });
    }

    // No tokenURI found
    return NextResponse.json({
      success: true,
      settings: {
        agentId: parseInt(agentId!, 10),
        personality: {},
        model: {},
      },
      message: 'No tokenURI found for this agent',
    });
  } catch (error) {
    console.error('Error fetching agent settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/settings
 * Update agent settings (creates new IPFS metadata)
 */
export async function POST(request: NextRequest) {
  try {
    const body: AgentSettings = await request.json();
    const { agentId, personality, model, knowledgeBaseId } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Missing agentId' },
        { status: 400 }
      );
    }

    const updatedSettings = {
      personality,
      model,
      knowledgeBaseId,
      updatedAt: new Date().toISOString(),
    };

    const hash = await uploadJSONToPinata(
      updatedSettings,
      `agent-${agentId}-settings`
    );

    return NextResponse.json({
      success: true,
      settingsHash: hash,
      settingsUri: getIPFSUri(hash),
      message: 'Settings saved to IPFS. Update on-chain tokenURI to apply.',
    });
  } catch (error) {
    console.error('Error saving agent settings:', error);
    return NextResponse.json(
      { error: 'Failed to save agent settings' },
      { status: 500 }
    );
  }
}
