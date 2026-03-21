import { NextRequest, NextResponse } from 'next/server';
import { getRecentMessages } from '@/lib/vectordb';

/**
 * GET /api/chat/history?agentId=1&userAddress=0x...&limit=50&sessionId=xxx
 * Fetch chat history for an agent
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const userAddress = searchParams.get('userAddress');
    const sessionId = searchParams.get('sessionId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!agentId || !userAddress) {
      return NextResponse.json(
        { error: 'Missing agentId or userAddress' },
        { status: 400 }
      );
    }

    const messages = await getRecentMessages(
      parseInt(agentId),
      userAddress,
      limit,
      sessionId
    );

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}
