import { NextRequest, NextResponse } from 'next/server';
import { generateNonce, storeNonce } from '@/lib/auth';

/**
 * GET /api/auth/nonce?address=0x...
 * Generate a nonce for wallet signature verification
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    const nonce = generateNonce();
    storeNonce(address, nonce);

    // Build message to sign
    const message = `Sign this message to authenticate with Agentis on Starknet.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

    return NextResponse.json({
      success: true,
      nonce,
      message,
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    );
  }
}
