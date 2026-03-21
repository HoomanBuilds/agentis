/**
 * Session credit management (Starknet)
 * Server-side functions for checking and using session credits.
 */

import { checkSessionCredits, useSessionCredit } from './credits';

export { checkSessionCredits, useSessionCredit };

/**
 * Get session credit info for display
 */
export async function getSessionCreditInfo(
  userAddress: string,
  agentId: number
): Promise<{ credits: bigint; hasCredits: boolean }> {
  const { hasCredits, balance } = await checkSessionCredits(userAddress, agentId);
  return { credits: balance, hasCredits };
}
