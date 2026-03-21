import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const address =
    request.nextUrl.searchParams.get('address') ||
    request.nextUrl.searchParams.get('publicKey');

  if (!address) {
    return NextResponse.json({ error: 'Missing address' }, { status: 400 });
  }

  try {
    const contract = getContract('AgentCredits');
    const result = await contract.call('get_user_credits', [address]);
    return NextResponse.json({ success: true, balance: result.toString() });
  } catch {
    return NextResponse.json({ success: true, balance: '0' });
  }
}
