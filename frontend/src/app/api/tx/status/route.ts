import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/starknet-client';

export async function GET(request: NextRequest) {
  const hash = new URL(request.url).searchParams.get('hash');
  if (!hash) return NextResponse.json({ status: 'failed' });

  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(hash);

    if (!receipt) return NextResponse.json({ status: 'pending' });

    const status = (receipt as any).execution_status || (receipt as any).finality_status;

    if (status === 'SUCCEEDED' || status === 'ACCEPTED_ON_L2' || status === 'ACCEPTED_ON_L1') {
      return NextResponse.json({ status: 'success', receipt });
    }
    if (status === 'REVERTED' || status === 'REJECTED') {
      return NextResponse.json({ status: 'failed', receipt });
    }

    return NextResponse.json({ status: 'pending' });
  } catch {
    return NextResponse.json({ status: 'pending' });
  }
}
