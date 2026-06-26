import { NextRequest, NextResponse } from 'next/server';
import { Contract } from 'starknet';
import { getProvider } from '@/lib/starknet-client';
import { CONTRACTS } from '@/constants/contracts';
import AgentNFTAbi from '@/constants/abis/AgentNFT.json';
import { transferFromAgentWallet, getAgentBalance } from '@/lib/agent-wallet';

export async function POST(request: NextRequest) {
  try {
    const { agentId, ownerAddress } = await request.json();

    if (!agentId || !ownerAddress) {
      return NextResponse.json({ error: 'Missing agentId or ownerAddress' }, { status: 400 });
    }

    const provider = getProvider();
    const nftContract = new Contract(AgentNFTAbi, CONTRACTS.addresses.AgentNFT, provider);
    const onChainOwner = await nftContract.call('owner_of', [agentId]);
    const ownerHex = '0x' + BigInt(onChainOwner.toString()).toString(16);

    if (BigInt(ownerHex) !== BigInt(ownerAddress)) {
      return NextResponse.json({ error: 'Not the NFT owner' }, { status: 403 });
    }

    const balanceStr = await getAgentBalance(agentId);
    const balanceWei = BigInt(Math.floor(parseFloat(balanceStr) * 1e18));

    if (balanceWei === BigInt(0)) {
      return NextResponse.json({ error: 'No funds to withdraw' }, { status: 400 });
    }

    const result = await transferFromAgentWallet(Number(agentId), ownerAddress, balanceWei);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      amount: balanceStr,
    });
  } catch (error: any) {
    console.error('Error withdrawing from agent wallet:', error);
    return NextResponse.json(
      { error: error.message || 'Withdrawal failed' },
      { status: 500 }
    );
  }
}
