import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 10);

    const nft = getContract('AgentNFT');
    const topAgents = await nft.call('get_top_agents_by_chats', [limit]);

    const agents = Array.isArray(topAgents) ? topAgents : [];

    return NextResponse.json({
      success: true,
      agents: agents.map((agent: any, index: number) => ({
        rank: index + 1,
        tokenId: Number(agent[0] || 0),
        name: String(agent[1] || ''),
        chatCount: Number(agent[2] || 0),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching top agents:', error);
    return NextResponse.json({
      success: true,
      agents: [],
    });
  }
}
