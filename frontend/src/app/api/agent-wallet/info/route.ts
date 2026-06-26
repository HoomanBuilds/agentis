import { NextRequest, NextResponse } from 'next/server';
import { getAgentWalletInfo, ensureAgentWallet, getAgentWalletAddress } from '@/lib/agent-wallet';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 });
    }

    const id = Number(tokenId);

    // If no wallet registered yet, create one (register + deploy)
    const existing = await getAgentWalletAddress(id);
    if (!existing) {
      try {
        await ensureAgentWallet(id);
      } catch (e) {
        console.error(`[agent-wallet/info] Failed to auto-create wallet for agent ${id}:`, e);
      }
    }

    const walletInfo = await getAgentWalletInfo(id);

    return NextResponse.json({
      success: true,
      tokenId: id,
      ...walletInfo,
      isRegistered: !!walletInfo.address,
    });
  } catch (error: any) {
    console.error('Agent wallet info error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wallet info' },
      { status: 500 }
    );
  }
}
