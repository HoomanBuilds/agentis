'use client';

import { useState, useEffect } from 'react';
import { Coins, Wallet, Loader2 } from 'lucide-react';

interface FloatingCreditsProps {
  agentId: number;
  isOwner: boolean;
  userPublicKey?: string;
  messageCount?: number;
}

/**
 * Floating credits badge showing user/session credits
 * - Owners see their credit balance + agent wallet status
 * - Non-owners see their session credits for this agent
 */
export default function FloatingCredits({ 
  agentId, 
  isOwner, 
  userPublicKey,
  messageCount = 0 
}: FloatingCreditsProps) {
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [sessionCredits, setSessionCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agentWalletActive, setAgentWalletActive] = useState(false);

  useEffect(() => {
    async function fetchCredits() {
      if (!userPublicKey) {
        setIsLoading(false);
        return;
      }

      try {
        if (isOwner) {
          // Fetch owner credits
          const response = await fetch(`/api/credits/balance?address=${encodeURIComponent(userPublicKey)}`);
          const data = await response.json();
          
          if (data.success && data.balance) {
            setUserCredits(Number(data.balance));
          } else {
            setUserCredits(0);
          }

          // Check agent wallet balance
          try {
            const walletResponse = await fetch(`/api/agent-wallet/info?tokenId=${agentId}`);
            if (walletResponse.ok) {
              const walletData = await walletResponse.json();
              setAgentWalletActive(parseFloat(walletData.balance || '0') >= 0.1);
            }
          } catch (e) {
            console.error('Error fetching agent wallet:', e);
          }
        } else {
          // Fetch session credits for non-owners from the contract
          const response = await fetch('/api/contract/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contract: 'AgentCredits',
              entryPoint: 'get_session_credits',
              args: {
                user: userPublicKey,
                nft_contract: 'AgentNFT',
                agent_id: agentId.toString(),
              },
            }),
          });
          
          const data = await response.json();
          if (data.success && data.result !== undefined) {
            setSessionCredits(Number(data.result));
          } else {
            setSessionCredits(0);
          }
        }
      } catch (error) {
        console.error('Error fetching credits:', error);
        if (isOwner) {
          setUserCredits(0);
        } else {
          setSessionCredits(0);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchCredits();
  }, [userPublicKey, agentId, isOwner, messageCount]);

  if (!userPublicKey) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (isOwner) {
    return (
      <div className="flex items-center gap-2">
        {/* Owner Credits */}
        <div 
          className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-emerald-500/30 rounded-xl"
          title="Your Credits Balance"
        >
          <Coins className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-200">
            {userCredits ?? 0} credits
          </span>
        </div>

        {/* Agent Wallet Badge */}
        {userCredits === 0 && agentWalletActive && (
          <div 
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl"
            title="Agent paying from its own wallet"
          >
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-200">
              Auto-Pay
            </span>
          </div>
        )}
      </div>
    );
  }

  // Non-owner: Show session credits
  return (
    <div 
      className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl"
      title="Session Credits for this Agent"
    >
      <Coins className="w-4 h-4 text-amber-400" />
      <span className="text-sm font-medium text-amber-200">
        {sessionCredits ?? 0} session credits
      </span>
    </div>
  );
}
