'use client';

import { useEffect, useRef } from 'react';
import { Check, ExternalLink, Loader2, AlertCircle, Wallet, Upload, X } from 'lucide-react';
import gsap from 'gsap';

type MintingStep = 'idle' | 'preparing' | 'signing' | 'submitting' | 'success' | 'error';

interface MintingProgressProps {
  step: MintingStep;
  deployHash?: string;
  explorerUrl?: string;
  errorMessage?: string;
  tokenId?: number;
  onClose: () => void;
  onRetry?: () => void;
}

const STEPS = [
  { id: 'preparing', label: 'Preparing Transaction', icon: Upload },
  { id: 'signing', label: 'Waiting for Signature', icon: Wallet },
  { id: 'submitting', label: 'Submitting to Network', icon: Loader2 },
];

export function MintingProgress({
  step,
  deployHash,
  explorerUrl,
  errorMessage,
  tokenId,
  onClose,
  onRetry,
}: MintingProgressProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      );
    });

    return () => ctx.revert();
  }, []);

  if (step === 'idle') return null;

  const isProcessing = ['preparing', 'signing', 'submitting'].includes(step);
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[#0a0f11] border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {step === 'success'
                ? '🎉 Agent Created!'
                : step === 'error'
                ? 'Minting Failed'
                : 'Creating Your Agent'}
            </h3>
            {(step === 'success' || step === 'error') && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Processing Steps */}
          {isProcessing && (
            <div className="space-y-4">
              {STEPS.map((s, index) => {
                const Icon = s.icon;
                const isActive = s.id === step;
                const isComplete = index < currentStepIndex;
                const isPending = index > currentStepIndex;

                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : isComplete
                        ? 'bg-emerald-500/5 border border-emerald-500/10'
                        : 'bg-white/5 border border-white/5'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isComplete
                          ? 'bg-emerald-500'
                          : isActive
                          ? 'bg-emerald-500/20'
                          : 'bg-white/10'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-5 h-5 text-black" />
                      ) : isActive ? (
                        <Icon className="w-5 h-5 text-emerald-400 animate-pulse" />
                      ) : (
                        <Icon className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          isActive
                            ? 'text-white'
                            : isComplete
                            ? 'text-emerald-300'
                            : 'text-gray-500'
                        }`}
                      >
                        {s.label}
                      </p>
                      {isActive && (
                        <p className="text-sm text-gray-400 mt-0.5">
                          {step === 'signing'
                            ? 'Please confirm in your wallet...'
                            : 'Processing...'}
                        </p>
                      )}
                    </div>
                    {isActive && (
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-black" />
              </div>
              <div>
                <p className="text-lg text-white mb-2">
                  Your AI Agent NFT has been minted successfully!
                </p>
                {tokenId !== undefined && (
                  <p className="text-emerald-400 font-semibold">
                    Token ID: #{tokenId}
                  </p>
                )}
              </div>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white transition-colors"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                Done
              </button>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <p className="text-lg text-white mb-2">
                  Something went wrong
                </p>
                <p className="text-sm text-gray-400">
                  {errorMessage || 'Failed to create your agent. Please try again.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/15 rounded-xl text-white transition-colors"
                >
                  Cancel
                </button>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-semibold rounded-xl hover:opacity-90 transition-all"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
