import { NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';

let statsCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET() {
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
    return NextResponse.json({ success: true, ...statsCache.data, cached: true });
  }

  try {
    const nft = getContract('AgentNFT');
    const marketplace = getContract('AgentMarketplace');

    const [totalSupplyResult, statsResult] = await Promise.allSettled([
      nft.call('get_total_supply', []),
      marketplace.call('get_stats', []),
    ]);

    const totalAgents = totalSupplyResult.status === 'fulfilled' ? Number(totalSupplyResult.value) : 0;

    let totalListings = 0, totalSales = 0, totalVolume = '0';
    if (statsResult.status === 'fulfilled') {
      const r: any = statsResult.value;
      if (typeof r === 'object' && r !== null) {
        totalListings = Number(r.total_listings || r[0] || 0);
        totalSales = Number(r.total_sales || r[1] || 0);
        totalVolume = String(r.total_volume || r[2] || '0');
      }
    }

    statsCache = { data: { totalAgents, totalListings, totalSales, totalVolume }, timestamp: Date.now() };
    return NextResponse.json({ success: true, totalAgents, totalListings, totalSales, totalVolume });
  } catch {
    return NextResponse.json({ success: true, totalAgents: 0, totalListings: 0, totalSales: 0, totalVolume: '0' });
  }
}
