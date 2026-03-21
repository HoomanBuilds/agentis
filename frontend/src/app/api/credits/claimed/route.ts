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
    const result = await contract.call('has_user_claimed_free_tier', [address]);
    const claimed = Boolean(result);
    return NextResponse.json({ success: true, claimed });
  } catch {
    return NextResponse.json({ success: true, claimed: false });
  }
}
