import { NextRequest, NextResponse } from 'next/server';
import { deleteAgentMemories } from '@/lib/vectordb';

/**
 * POST /api/memory/clear
 * Clear chat memories for an agent/user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, userAddress, sessionId } = body;

    if (!agentId || !userAddress) {
      return NextResponse.json(
        { error: 'Missing agentId or userAddress' },
        { status: 400 }
      );
    }

    const result = await deleteAgentMemories(
      agentId,
      userAddress,
      sessionId
    );

    if (!result.success) {
      throw new Error(result.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Memories cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing memories:', error);
    return NextResponse.json(
      { error: 'Failed to clear memories' },
      { status: 500 }
    );
  }
}
