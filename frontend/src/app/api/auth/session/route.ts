import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth';

/**
 * GET /api/auth/session
 * Get current session information
 */
export async function GET() {
  try {
    const session = await getSessionData();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        address: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      address: session.address,
      chainName: session.chainName,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
