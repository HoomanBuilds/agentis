'use client';

import { X, Coins, CreditCard, Loader2, Wallet } from 'lucide-react';
import Link from 'next/link';

export interface PaymentRequiredInfo {
  type: 'owner-credits' | 'session-credits' | 'agent-wallet-empty';
  agentId?: number;
  cost?: string;
  currency?: string;
  description?: string;
  sessionCreditsAvailable?: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPayForMessage?: () => void;
  onBuySessionPack?: () => void;
  isProcessing: boolean;
  paymentInfo: PaymentRequiredInfo;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onPayForMessage,
  onBuySessionPack,
  isProcessing,
  paymentInfo,
}: PaymentModalProps) {
  if (!isOpen) return null;

  const isOwnerFlow = paymentInfo.type === 'owner-credits' || paymentInfo.type === 'agent-wallet-empty';
  const isSessionFlow = paymentInfo.type === 'session-credits';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a0f0f] border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-emerald-500/10 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-emerald-200 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" />
              {isSessionFlow ? 'Session Required' : 'Insufficient Credits'}
            </h3>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1 rounded-lg hover:bg-emerald-500/10 text-emerald-400/60 hover:text-emerald-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-gray-300">
            {paymentInfo.description || 
              (isSessionFlow 
                ? "You don't have session credits for this agent. Purchase a session pack to chat."
                : "You don't have enough credits to send this message."
              )
            }
          </p>

          {/* Agent Wallet Empty Warning */}
          {paymentInfo.type === 'agent-wallet-empty' && (
            <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <Wallet className="w-5 h-5 text-yellow-400 shrink-0" />
              <p className="text-sm text-yellow-200">
                Your agent wallet is also empty. No auto-pay available.
              </p>
            </div>
          )}

          <div className="grid gap-4">
            {/* Owner Flow: Pay for single message */}
            {isOwnerFlow && onPayForMessage && (
              <button
                onClick={onPayForMessage}
                disabled={isProcessing}
                className="group relative flex items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-emerald-200">Pay for Message</div>
                    <div className="text-xs text-gray-400">One-time payment</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-300">
                    {paymentInfo.cost || '0.1'} {paymentInfo.currency || 'STRK'}
                  </div>
                  {isProcessing && (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400 ml-auto mt-1" />
                  )}
                </div>
              </button>
            )}

            {/* Session Flow: Buy session pack */}
            {isSessionFlow && onBuySessionPack && (
              <button
                onClick={onBuySessionPack}
                disabled={isProcessing}
                className="group relative flex items-center justify-between p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-purple-200">Buy Session Pack</div>
                    <div className="text-xs text-gray-400">50 messages for this agent</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-300">5 STRK</div>
                  {isProcessing && (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400 ml-auto mt-1" />
                  )}
                </div>
              </button>
            )}

            {/* Go to Profile option */}
            {isOwnerFlow && (
              <Link
                href="/profile"
                className="group flex items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-emerald-200">Buy Credits</div>
                    <div className="text-xs text-gray-400">Save with credit packages</div>
                  </div>
                </div>
                <div className="text-emerald-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                  Go to Profile →
                </div>
              </Link>
            )}

            {/* Revenue Share Info for Session Purchase */}
            {isSessionFlow && (
              <div className="text-xs text-gray-500 text-center">
                80% goes to the agent owner • 20% platform fee
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
