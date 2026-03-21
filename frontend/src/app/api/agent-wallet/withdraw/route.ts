import { NextRequest, NextResponse } from 'next/server';
import { getContract, waitForTx, getTxExplorerUrl } from '@/lib/starknet-client';
import { executeBackendCall } from '@/lib/backend-wallet';
import { CONTRACTS } from '@/constants/contracts';

export async function POST(request: NextRequest) {
  try {
    const { tokenId, ownerAddress } = await request.json();

    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 });
    }
    if (!ownerAddress) {
      return NextResponse.json({ error: 'Missing ownerAddress' }, { status: 400 });
    }

    // Verify ownership (u256 represented as [low, high])
    const nft = getContract('AgentNFT');
    const owner = await nft.call('owner_of', [tokenId, 0]);

    if (String(owner).toLowerCase() !== ownerAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Not the owner of this agent. Only the on-chain owner can withdraw.' },
        { status: 403 }
      );
    }

    // Withdraw earnings via backend account
    const txHash = await executeBackendCall(
      CONTRACTS.addresses.RevenueShare,
      'withdraw_agent_earnings',
      [tokenId, ownerAddress]
    );

    await waitForTx(txHash);

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      explorerUrl: getTxExplorerUrl(txHash),
      message: `STRK withdrawal initiated for agent ${tokenId}`,
    });
  } catch (error: any) {
    console.error('[withdraw] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to withdraw STRK' },
      { status: 500 }
    );
  }
}
