import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';
import { getAgentWalletInfo } from '@/lib/agent-wallet';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 });
    }

    const walletInfo = await getAgentWalletInfo(Number(tokenId));

    let onChainWallet: string | null = null;
    try {
      const revenueShare = getContract('RevenueShare');
      const result = await revenueShare.call('get_agent_wallet', [Number(tokenId)]);
      onChainWallet = result ? String(result) : null;
    } catch {
      // Not registered on-chain
    }

    return NextResponse.json({
      success: true,
      tokenId: Number(tokenId),
      ...walletInfo,
      onChainWallet,
      isRegistered: !!onChainWallet && onChainWallet !== '0x0',
    });
  } catch (error: any) {
    console.error('Agent wallet info error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wallet info' },
      { status: 500 }
    );
  }
}
