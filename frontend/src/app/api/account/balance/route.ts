import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/starknet-client';
import { CONTRACTS } from '@/constants/contracts';

export async function GET(request: NextRequest) {
  const address = new URL(request.url).searchParams.get('address');
  if (!address) return NextResponse.json({ balance: '0' });

  try {
    const provider = getProvider();
    const result = await provider.callContract({
      contractAddress: CONTRACTS.addresses.STRK,
      entrypoint: 'balance_of',
      calldata: [address],
    }, 'latest');
    // STRK balance_of returns u256: [low, high] as felt252 strings
    const low = BigInt(result[0] ?? 0);
    const high = BigInt(result[1] ?? 0);
    const balance = ((high << 128n) + low).toString();
    return NextResponse.json({ balance });
  } catch (e) {
    console.error('balance fetch error:', e);
    return NextResponse.json({ balance: '0' });
  }
}
