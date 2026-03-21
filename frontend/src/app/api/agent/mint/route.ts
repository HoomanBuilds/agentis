import { NextRequest, NextResponse } from 'next/server';
import { getContract, waitForTx, getTxExplorerUrl } from '@/lib/starknet-client';
import { executeBackendCall, transferNFTToUser } from '@/lib/backend-wallet';
import { CONTRACTS } from '@/constants/contracts';

export async function POST(request: NextRequest) {
  try {
    const { name, tokenUri, personalityHash, recipientAddress } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required and cannot be empty' }, { status: 400 });
    }
    if (!tokenUri || typeof tokenUri !== 'string') {
      return NextResponse.json({ error: 'Token URI is required' }, { status: 400 });
    }
    if (!personalityHash || typeof personalityHash !== 'string') {
      return NextResponse.json({ error: 'Personality hash is required' }, { status: 400 });
    }
    if (!recipientAddress || typeof recipientAddress !== 'string') {
      return NextResponse.json({ error: 'Recipient address is required' }, { status: 400 });
    }

    console.log('=== Backend Mint Agent ===');
    console.log('Name:', name);
    console.log('Token URI:', tokenUri.substring(0, 50) + '...');
    console.log('Recipient:', recipientAddress);

    // Get next token ID
    const nft = getContract('AgentNFT');
    const tokenId = Number(await nft.call('get_next_token_id', []));
    console.log('Next token ID:', tokenId);

    // Mint via backend account
    const txHash = await executeBackendCall(
      CONTRACTS.addresses.AgentNFT,
      'mint_agent',
      [name.trim(), tokenUri, personalityHash]
    );
    console.log('Mint tx submitted:', txHash);

    // Wait for confirmation
    await waitForTx(txHash);
    console.log('Mint confirmed, transferring to user...');

    // Transfer NFT to recipient
    await transferNFTToUser(tokenId, recipientAddress);
    console.log('Transfer complete');

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      tokenId,
      explorerUrl: getTxExplorerUrl(txHash),
    });
  } catch (error) {
    console.error('Backend mint error:', error);
    return NextResponse.json(
      { error: `Failed to mint agent: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
