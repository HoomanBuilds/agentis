'use client';

import { useState } from 'react';
import { X, Tag, DollarSign, Loader2, CheckCircle, ExternalLink, Shield, ArrowRight } from 'lucide-react';
import { useAgentMarketplace } from '@/hooks/useAgentMarketplace';

interface ListAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint;
  agentName: string;
  onSuccess?: () => void;
}

type Step = 'price' | 'approving' | 'approved' | 'listing' | 'success';

export function ListAgentModal({ isOpen, onClose, tokenId, agentName, onSuccess }: ListAgentModalProps) {
  const { approveForMarketplace, listAgent, isLoading, error } = useAgentMarketplace();
  const [price, setPrice] = useState('');
  const [step, setStep] = useState<Step>('price');
  const [txHash, setTxHash] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApproveAndList = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setLocalError('Please enter a valid price');
      return;
    }

    const priceInWei = BigInt(Math.floor(priceValue * 1e18));

    // Step 1: Approve marketplace
    setStep('approving');
    const approveResult = await approveForMarketplace(tokenId);
    
    if (!approveResult.success) {
      setLocalError(approveResult.errorMessage || 'Approval failed');
      setStep('price');
      return;
    }

    // Wait a bit for approval to be confirmed
    setStep('approved');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: List the agent
    setStep('listing');
    const listResult = await listAgent(tokenId, priceInWei);

    if (listResult.success) {
      setStep('success');
      setTxHash(listResult.transactionHash);
      setExplorerUrl(listResult.explorerUrl || '');
      onSuccess?.();
    } else {
      setLocalError(listResult.errorMessage || 'Listing failed');
      setStep('approved');
    }
  };

  const handleRetryList = async () => {
    setLocalError(null);

    const priceValue = parseFloat(price);
    const priceInWei = BigInt(Math.floor(priceValue * 1e18));

    setStep('listing');
    const listResult = await listAgent(tokenId, priceInWei);

    if (listResult.success) {
      setStep('success');
      setTxHash(listResult.transactionHash);
      setExplorerUrl(listResult.explorerUrl || '');
      onSuccess?.();
    } else {
      setLocalError(listResult.errorMessage || 'Listing failed');
      setStep('approved');
    }
  };

  const handleClose = () => {
    setPrice('');
    setStep('price');
    setTxHash('');
    setExplorerUrl('');
    setLocalError(null);
    onClose();
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">List for Sale</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'success' ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Listing Submitted!</h3>
              <p className="text-muted-foreground mb-4">
                Your agent will be listed once the transaction is confirmed.
              </p>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={handleClose}
                className="mt-6 w-full py-3 bg-muted hover:bg-secondary text-foreground rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          ) : step === 'approving' || step === 'listing' ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step === 'approving' ? 'Step 1: Approving Marketplace' : 'Step 2: Creating Listing'}
              </h3>
              <p className="text-muted-foreground">
                {step === 'approving' 
                  ? 'Please confirm the approval transaction in your wallet...'
                  : 'Please confirm the listing transaction in your wallet...'}
              </p>
            </div>
          ) : step === 'approved' ? (
            <div className="text-center py-4">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Approval Confirmed!</h3>
              <p className="text-muted-foreground mb-6">
                The marketplace is now approved. Proceeding to list your agent...
              </p>
              
              {displayError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{displayError}</p>
                </div>
              )}
              
              <button
                onClick={handleRetryList}
                disabled={isLoading}
                className="w-full py-3 bg-primary hover:opacity-90 text-foreground font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Listing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Continue to List
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleApproveAndList}>
              <div className="mb-6">
                <p className="text-muted-foreground mb-4">
                  You are listing <span className="text-foreground font-medium">{agentName}</span> for sale.
                </p>
                
                {/* Two-step notice */}
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    This requires <strong>two transactions</strong>: (1) Approve marketplace to transfer NFT, (2) Create listing.
                  </p>
                </div>
                
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Sale Price (STRK)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="100"
                    className="w-full pl-10 pr-16 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">STRK</span>
                </div>
              </div>

              {displayError && (
                <p className="text-red-400 text-sm mb-4">{displayError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 bg-muted hover:bg-secondary text-foreground rounded-xl transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !price}
                  className="flex-1 py-3 bg-primary hover:opacity-90 text-foreground font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Approve & List'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
