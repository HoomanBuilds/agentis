import { NextRequest, NextResponse } from 'next/server';
import { getContract } from '@/lib/starknet-client';

export async function GET(request: NextRequest) {
  const address = new URL(request.url).searchParams.get('address');
  if (!address) return NextResponse.json({ balance: '0' });

  try {
    const strk = getContract('STRK');
    const result = await strk.call('balance_of', [address]);
    const balance = result.toString();
    return NextResponse.json({ balance });
  } catch {
    return NextResponse.json({ balance: '0' });
  }
}
