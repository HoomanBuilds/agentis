'use client';

import { useState } from 'react';
import { X, ShoppingCart, Loader2, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAgentMarketplace } from '@/hooks/useAgentMarketplace';

interface BuyAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tokenId: bigint;
  agentName: string;
  price: bigint;
  seller: string;
  imageUrl?: string;
  onSuccess?: () => void;
}

export function BuyAgentModal({ 
  isOpen, 
  onClose, 
  tokenId, 
  agentName, 
  price, 
  seller,
  imageUrl,
  onSuccess 
}: BuyAgentModalProps) {
  const { buyAgent, isLoading, error } = useAgentMarketplace();
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');

  if (!isOpen) return null;

  // Format price from wei to STRK
  const priceInSTRK = Number(price) / 1e18;

  const formatSeller = (addr: string) => {
    if (!addr) return 'Unknown';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const handleBuy = async () => {
    const result = await buyAgent(tokenId, price);

    if (result.success) {
      setSuccess(true);
      setTxHash(result.transactionHash);
      setExplorerUrl(result.explorerUrl || '');
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setTxHash('');
    setExplorerUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Buy Agent</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Purchase Submitted!</h3>
              <p className="text-gray-400 mb-4">
                The agent will be transferred to you once the transaction is confirmed.
              </p>
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={handleClose}
                className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div>
              {/* Agent Preview */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                <div className="w-16 h-16 rounded-lg bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                  {imageUrl ? (
                    <img src={imageUrl} alt={agentName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🤖</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{agentName}</h3>
                  <p className="text-gray-400 text-sm">Sold by {formatSeller(seller)}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Price</span>
                  <span className="text-2xl font-bold text-white">{priceInSTRK.toFixed(2)} STRK</span>
                </div>
              </div>

              {/* Warning */}
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200/80">
                  This transaction is irreversible. Make sure you have enough STRK in your wallet to complete the purchase.
                </p>
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuy}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
