import { NextRequest, NextResponse } from 'next/server';
import { Contract } from 'starknet';
import { getProvider } from '@/lib/starknet-client';
import { CONTRACTS } from '@/constants/contracts';
import AgentNFTAbi from '@/constants/abis/AgentNFT.json';
import { ensureAgentWallet, forceRegisterAgentWallet } from '@/lib/agent-wallet';

export async function POST(request: NextRequest) {
  try {
    const { agentId, force } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Missing agentId' }, { status: 400 });
    }

    const id = Number(agentId);

    // Verify the agent actually exists on-chain before spending gas
    const provider = getProvider();
    const nftContract = new Contract(AgentNFTAbi, CONTRACTS.addresses.AgentNFT, provider);
    try {
      await nftContract.call('owner_of', [id]);
    } catch {
      return NextResponse.json({ error: 'Agent does not exist' }, { status: 404 });
    }

    const walletAddress = force
      ? await forceRegisterAgentWallet(id)
      : await ensureAgentWallet(id);

    return NextResponse.json({
      success: true,
      agentId: id,
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
