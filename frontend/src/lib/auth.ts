import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Session data stored in cookie
 */
interface SessionData {
  address: string;
  chainName: string;
  issuedAt: string;
  expiresAt: string;
}

const SESSION_COOKIE_NAME = 'starknet_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the authenticated wallet address from the session cookie.
 */
export async function getAuthenticatedAddress(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const sessionData: SessionData = JSON.parse(
      Buffer.from(sessionCookie, 'base64').toString('utf-8')
    );

    if (new Date(sessionData.expiresAt) < new Date()) return null;
    return sessionData.address;
  } catch {
    return null;
  }
}

/**
 * Get full session data from the session cookie.
 */
export async function getSessionData(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const sessionData: SessionData = JSON.parse(
      Buffer.from(sessionCookie, 'base64').toString('utf-8')
    );

    if (new Date(sessionData.expiresAt) < new Date()) return null;
    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Create a new session for an authenticated user
 */
export async function createSession(
  address: string,
  chainName: string = 'starknet-sepolia'
): Promise<void> {
  const cookieStore = await cookies();

  const now = new Date();
  const sessionData: SessionData = {
    address,
    chainName,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS).toISOString(),
  };

  const encodedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64');

  cookieStore.set(SESSION_COOKIE_NAME, encodedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });
}

/**
 * Destroy the current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Require authentication for an API route.
 */
export async function requireAuth(
  _req: NextRequest
): Promise<{ address: string } | NextResponse> {
  const address = await getAuthenticatedAddress();
  if (!address) {
    return NextResponse.json(
      { error: 'Authentication required. Please connect your wallet.' },
      { status: 401 }
    );
  }
  return { address };
}

/**
 * Type guard to check if requireAuth returned an error response
 */
export function isAuthError(
  result: { address: string } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Generate a nonce for wallet signature verification
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store nonce for verification (in-memory for now, use Redis in production)
 */
const nonceStore = new Map<string, { nonce: string; expires: number }>();

export function storeNonce(address: string, nonce: string): void {
  nonceStore.set(address.toLowerCase(), {
    nonce,
    expires: Date.now() + 5 * 60 * 1000,
  });
}

export function verifyNonce(address: string, nonce: string): boolean {
  const stored = nonceStore.get(address.toLowerCase());
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    nonceStore.delete(address.toLowerCase());
    return false;
  }
  if (stored.nonce !== nonce) return false;
  nonceStore.delete(address.toLowerCase());
  return true;
}
