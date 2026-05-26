import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 20);

    const nft = getContract('AgentNFT');
    const totalSupplyRaw = await nft.call('get_total_supply', []);
    const totalSupply = Number(totalSupplyRaw ?? 0);

    if (totalSupply === 0) {
      return NextResponse.json({ success: true, agents: [] });
    }

    // Fetch metadata for all tokens and sort by chat_count (tuple index 5)
    const results = await Promise.allSettled(
      Array.from({ length: totalSupply }, (_, i) => i + 1).map(async (tokenId) => {
        const meta: any = await nft.call('get_agent_metadata', [tokenId]);
        const r = Array.isArray(meta) ? meta : Object.values(meta as object);
        // tuple: (name[0], token_uri[1], personality_hash[2], created_at[3], creator[4], chat_count[5], level[6], is_public[7])
        return {
          tokenId,
          name: String(r[0] ?? `Agent #${tokenId}`),
          chatCount: Number(r[5] ?? 0),
          level: Number(r[6] ?? 0),
        };
      })
    );

    const agents = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => b.chatCount - a.chatCount)
      .slice(0, limit)
      .map((agent, index) => ({ rank: index + 1, ...agent }));

    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    console.error('Error fetching top agents:', error);
    return NextResponse.json({ success: true, agents: [] });
  }
}
