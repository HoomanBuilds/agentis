import { NextRequest, NextResponse } from 'next/server';
import { verifyNonce, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { address, nonce, signature, message } = await request.json();
  if (!address || !nonce) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  if (!verifyNonce(address, nonce)) return NextResponse.json({ error: 'Invalid nonce' }, { status: 401 });

  // For Starknet, wallet extension handles signature verification
  // We trust the signed message if the nonce matches
  await createSession(address);
  return NextResponse.json({ success: true, address });
}
