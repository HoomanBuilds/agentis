import { NextRequest, NextResponse } from 'next/server';
import { getContract, formatSTRK } from '@/lib/starknet-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 10);

    const marketplace = getContract('AgentMarketplace');
    const topCreators = await marketplace.call('get_top_creators', [limit]);

    const creators = Array.isArray(topCreators) ? topCreators : [];

    return NextResponse.json({
      success: true,
      creators: creators.map((creator: any, index: number) => ({
        rank: index + 1,
        address: String(creator[0] || ''),
        agentCount: Number(creator[1] || 0),
        totalRevenue: String(creator[2] || '0'),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching top creators:', error);
    return NextResponse.json({
      success: true,
      creators: [],
    });
  }
}
