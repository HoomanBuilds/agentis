import { NextRequest, NextResponse } from 'next/server';
import { ensureAgentWallet } from '@/lib/agent-wallet';

export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const walletAddress = await ensureAgentWallet(Number(agentId));

    return NextResponse.json({
      success: true,
      agentId: Number(agentId),
      walletAddress,
    });
  } catch (error: any) {
    console.error('Error registering agent wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register wallet' },
      { status: 500 }
    );
  }
}
