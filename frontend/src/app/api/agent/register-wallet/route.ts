import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';
import { registerAgentWallet } from '@/lib/backend-wallet';

export async function POST(request: NextRequest) {
  try {
    const { agentId, walletAddress } = await request.json();

    if (!agentId || !walletAddress) {
      return NextResponse.json({ error: 'Missing agentId or walletAddress' }, { status: 400 });
    }

    // Check if already registered on-chain
    try {
      const revenueShare = getContract('RevenueShare');
      const existing = await revenueShare.call('get_agent_wallet', [agentId]);
      if (existing && String(existing) !== '0x0') {
        console.log(`[register-wallet] Agent ${agentId} already registered`);
        return NextResponse.json({
          success: true,
          alreadyRegistered: true,
          walletAddress: String(existing),
        });
      }
    } catch {
      // Not registered yet, proceed
      console.log(`[register-wallet] Agent ${agentId} not yet registered`);
    }

    // Register via backend account
    console.log(`[register-wallet] Registering wallet ${walletAddress} for agent ${agentId}...`);
    const txHash = await registerAgentWallet(agentId, walletAddress);

    console.log(`[register-wallet] Success! Tx hash: ${txHash}`);
    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      agentId,
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
