import { NextRequest, NextResponse } from 'next/server';
import { getInteractedAgentIds } from '@/lib/vectordb';

/**
 * GET /api/chat/interacted-agents?userAddress=0x...
 * Get list of agents the user has chatted with
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'Missing userAddress' },
        { status: 400 }
      );
    }

    const agentIds = await getInteractedAgentIds(userAddress);

    return NextResponse.json({
      success: true,
      agentIds,
      count: agentIds.length,
    });
  } catch (error) {
    console.error('Error fetching interacted agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interacted agents' },
      { status: 500 }
    );
  }
}
