import { NextRequest, NextResponse } from 'next/server';
import { storeMessage } from '@/lib/vectordb';

/**
 * POST /api/chat/save
 * Save a chat message to ChromaDB (called by client after streaming completes)
 * Used primarily for storing assistant responses
 */
export async function POST(req: NextRequest) {
  try {
    const { agentId, userAddress, role, content, sessionId } = await req.json();

    if (!agentId || !userAddress || !role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, userAddress, role, content' },
        { status: 400 }
      );
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { error: 'Role must be "user" or "assistant"' },
        { status: 400 }
      );
    }

    const result = await storeMessage(
      parseInt(agentId),
      userAddress,
      role,
      content,
      Date.now(),
      sessionId || 'default'
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to store message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json(
      { error: 'Failed to save chat message' },
      { status: 500 }
    );
  }
}
