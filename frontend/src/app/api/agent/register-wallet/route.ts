import { NextRequest, NextResponse } from 'next/server';
import { ensureAgentWallet, forceRegisterAgentWallet } from '@/lib/agent-wallet';

export async function POST(request: NextRequest) {
  try {
    const { agentId, force } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const walletAddress = force
      ? await forceRegisterAgentWallet(Number(agentId))
      : await ensureAgentWallet(Number(agentId));

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
