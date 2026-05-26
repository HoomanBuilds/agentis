import { NextRequest, NextResponse } from 'next/server';
import { getContract, formatSTRK } from '@/lib/starknet-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 20);

    const nft = getContract('AgentNFT');
    const revenue = getContract('RevenueShare');

    const totalSupplyRaw = await nft.call('get_total_supply', []);
    const totalSupply = Number(totalSupplyRaw ?? 0);

    if (totalSupply === 0) {
      return NextResponse.json({ success: true, creators: [] });
    }

    // Aggregate creators from agent metadata (tuple index 4 = creator address)
    const results = await Promise.allSettled(
      Array.from({ length: totalSupply }, (_, i) => i + 1).map(async (tokenId) => {
        const meta: any = await nft.call('get_agent_metadata', [tokenId]);
        const r = Array.isArray(meta) ? meta : Object.values(meta as object);
        const creator = String(r[4] ?? '');

        let earned = BigInt(0);
        try {
          const stats: any = await revenue.call('get_agent_stats', [tokenId]);
          const s = Array.isArray(stats) ? stats : Object.values(stats as object);
          // tuple: (total_earned[0], total_withdrawn[1], pending_balance[2])
          earned = BigInt(String(s[0] ?? 0));
        } catch {}

        return { tokenId, creator };
      })
    );

    // Group by creator
    const creatorMap = new Map<string, { agentCount: number; tokenIds: number[] }>();
    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value.creator || r.value.creator === '0x0') continue;
      const key = r.value.creator.toLowerCase();
      const existing = creatorMap.get(key) ?? { agentCount: 0, tokenIds: [] };
      existing.agentCount++;
      existing.tokenIds.push(r.value.tokenId);
      creatorMap.set(key, existing);
    }

    const creators = Array.from(creatorMap.entries())
      .map(([address, data], index) => ({
        rank: index + 1,
        address,
        agentCount: data.agentCount,
      }))
      .sort((a, b) => b.agentCount - a.agentCount)
      .slice(0, limit)
      .map((c, i) => ({ ...c, rank: i + 1 }));

    return NextResponse.json({ success: true, creators });
  } catch (error: any) {
    console.error('Error fetching top creators:', error);
    return NextResponse.json({ success: true, creators: [] });
  }
}
