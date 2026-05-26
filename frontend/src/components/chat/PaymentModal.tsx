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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-primary/10 bg-primary/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              {isSessionFlow ? 'Session Required' : 'Insufficient Credits'}
            </h3>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1 rounded-lg hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <p className="text-foreground/80">
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
                className="group relative flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-foreground">Pay for Message</div>
                    <div className="text-xs text-muted-foreground">One-time payment</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {paymentInfo.cost || '0.1'} {paymentInfo.currency || 'STRK'}
                  </div>
                  {isProcessing && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto mt-1" />
                  )}
                </div>
              </button>
            )}

            {/* Session Flow: Buy session pack */}
            {isSessionFlow && onBuySessionPack && (
              <button
                onClick={onBuySessionPack}
                disabled={isProcessing}
                className="group relative flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-foreground">Buy Session Pack</div>
                    <div className="text-xs text-muted-foreground">50 messages for this agent</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">5 STRK</div>
                  {isProcessing && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto mt-1" />
                  )}
                </div>
              </button>
            )}

            {/* Go to Profile option */}
            {isOwnerFlow && (
              <Link
                href="/profile"
                className="group flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-foreground">Buy Credits</div>
                    <div className="text-xs text-muted-foreground">Save with credit packages</div>
                  </div>
                </div>
                <div className="text-primary text-sm font-bold group-hover:translate-x-1 transition-transform">
                  Go to Profile →
                </div>
              </Link>
            )}

            {/* Revenue Share Info for Session Purchase */}
            {isSessionFlow && (
              <div className="text-xs text-muted-foreground/60 text-center">
                80% goes to the agent owner • 20% platform fee
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
