import { NextRequest, NextResponse } from 'next/server';
import { getProvider, getTxExplorerUrl } from '@/lib/starknet-client';

export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get('hash');

  if (!hash) {
    return NextResponse.json({ error: 'Missing transaction hash' }, { status: 400 });
  }

  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(hash);

    const status = receipt.execution_status;
    const success = status === 'SUCCEEDED';
    const failed = status === 'REVERTED';
    const pending = !success && !failed;

    return NextResponse.json({
      success: true,
      status: pending ? 'pending' : success ? 'success' : 'failed',
      execution_status: status,
      explorerUrl: getTxExplorerUrl(hash),
      ...(failed && 'revert_reason' in receipt
        ? { revert_reason: (receipt as Record<string, unknown>).revert_reason }
        : {}),
    });
  } catch (error: unknown) {
    // Transaction not yet indexed
    if (
      error instanceof Error &&
      error.message.includes('Transaction hash not found')
    ) {
      return NextResponse.json({
        success: true,
        status: 'pending',
        explorerUrl: getTxExplorerUrl(hash),
      });
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
