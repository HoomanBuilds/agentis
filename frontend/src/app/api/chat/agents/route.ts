import { NextRequest, NextResponse } from 'next/server';
import { getChattedAgentIds } from '@/lib/vectordb';

/**
 * GET /api/chat/agents?userAddress=0x...
 * Get all unique agent IDs that a user has chatted with
 * NOTE: No authentication required - data is filtered by userAddress parameter
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

    const agentIds = await getChattedAgentIds(userAddress);

    return NextResponse.json({
      success: true,
      agentIds,
      count: agentIds.length,
    });
  } catch (error: unknown) {
    console.error('Error fetching chatted agents:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch chatted agents';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
