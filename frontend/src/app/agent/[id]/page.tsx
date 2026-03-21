'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components';
import { PageShimmer, ConfirmModal, AlertModal, AnimatedSection } from '@/components/shared';
import { ListAgentModal, BuyAgentModal } from '@/components/marketplace';
import { useAgentNFT } from '@/hooks/useAgentNFT';
import { useAgentMarketplace } from '@/hooks/useAgentMarketplace';
import { useAgentFullData, useAgentVisibility, useOwnedAgents } from '@/hooks/queries/useAgentQueries';
import { useListing } from '@/hooks/queries/useMarketplaceQueries';
import { useWallet } from '@/hooks/useWallet';
import { 
  Bot, ArrowLeft, MessageCircle, User, Calendar, Tag, ShoppingCart, Loader2, Globe, Lock, Wallet, Copy
} from 'lucide-react';

interface IPFSMetadata {
  name: string;
  description?: string;
  image?: string;
  traits?: string[];
}

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tokenId = params.id as string;
  const tokenIdBigInt = tokenId ? BigInt(tokenId) : undefined;

  // Hooks
  const { setAgentPublic, isLoading: nftLoading } = useAgentNFT();
  const { cancelListing, isLoading: marketplaceLoading } = useAgentMarketplace();
  const { activeKey } = useWallet();

  // Queries
  const { data: agentData, isLoading: isAgentLoading, error: agentError } = useAgentFullData(tokenIdBigInt);
  const { data: listing, isLoading: isListingLoading } = useListing(tokenIdBigInt);
  const { data: isPublic = true, isLoading: isVisibilityLoading } = useAgentVisibility(tokenIdBigInt);
  const { data: ownedTokens } = useOwnedAgents(activeKey || undefined);

  // Derived state
  const isOwner = ownedTokens?.some(t => t === tokenIdBigInt) || false;
  const isLoading = isAgentLoading || isListingLoading || isVisibilityLoading;
  const error = agentError ? 'Failed to load agent data' : null;
  const metadata = agentData ? {
    name: agentData.name,
    token_uri: agentData.token_uri,
    personality_hash: agentData.personality_hash,
    created_at: agentData.created_at,
    creator: agentData.creator,
    chat_count: agentData.chat_count,
    level: agentData.level,
  } : null;
  const ipfsData = agentData?.ipfsData || null;
  const imageUrl = agentData?.imageUrl || null;

  // Local state for mutations
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Modal states
  const [showListModal, setShowListModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  
  
  // Fetch agent wallet address
  const [agentWalletAddress, setAgentWalletAddress] = useState<string | undefined>(undefined);
  const [agentWalletBalance, setAgentWalletBalance] = useState<string | undefined>(undefined);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  
  // Modal states for custom dialogs
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error' | 'info';
  }>({ isOpen: false, title: '', message: '', variant: 'info' });
  const [copyToast, setCopyToast] = useState(false);
  const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState<boolean>(false);
  
  useEffect(() => {
    async function fetchWallet() {
      if (!tokenId) return;
      try {
        const response = await fetch(`/api/agent-wallet/info?tokenId=${tokenId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.address) {
            setAgentWalletAddress(data.address);
            setAgentWalletBalance(data.balance);
          }
        }
      } catch (e) {
        console.error('Error fetching agent wallet:', e);
      }
    }
    fetchWallet();
  }, [tokenId]);

  const handleCancelListing = async () => {
    if (!confirm('Are you sure you want to cancel this listing?')) return;
    
    setIsCancelling(true);
    try {
      const result = await cancelListing(tokenIdBigInt!);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['marketplace', 'listing', tokenId] });
        queryClient.invalidateQueries({ queryKey: ['marketplace', 'activeListings'] });
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleToggleVisibility = () => {
    const newVisibility = !isPublic;
    setPendingVisibility(newVisibility);
    setShowVisibilityConfirm(true);
  };

  const executeToggleVisibility = async () => {
    setShowVisibilityConfirm(false);
    const action = pendingVisibility ? 'public' : 'private';
    
    setIsTogglingVisibility(true);
    try {
      const result = await setAgentPublic(tokenIdBigInt!, pendingVisibility);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['agent', 'visibility', tokenId] });
        setAlertModal({
          isOpen: true,
          title: 'Visibility Changed',
          message: `Agent is now ${action}.\n\nTransaction: ${result.transactionHash.slice(0, 10)}...`,
          variant: 'success',
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Failed',
          message: result.errorMessage || 'Failed to change visibility',
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Error toggling visibility:', err);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to change visibility',
        variant: 'error',
      });
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // Format creator address
  const formatCreator = (creator: string) => {
    if (!creator) return 'Unknown';
    const hash = creator.replace('account-hash-', '');
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  // Format timestamp to date
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(2);
  };

  const handleWithdraw = () => {
    if (!agentWalletBalance || parseFloat(agentWalletBalance) < 3) {
      setAlertModal({
        isOpen: true,
        title: 'Insufficient Balance',
        message: 'Need at least 3 STRK for withdrawal.',
        variant: 'error',
      });
      return;
    }
    setShowWithdrawConfirm(true);
  };

  const executeWithdraw = async () => {
    setShowWithdrawConfirm(false);
    setIsWithdrawing(true);
    try {
      const response = await fetch('/api/agent-wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: tokenId,
          ownerAddress: activeKey,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAlertModal({
          isOpen: true,
          title: 'Withdrawal Successful',
          message: `Amount: ${result.withdrawAmount} STRK\n\nTx Hash: ${result.transactionHash}\n\nThe funds will arrive shortly.`,
          variant: 'success',
        });
        
        // Refresh wallet balance
        const walletResponse = await fetch(`/api/agent-wallet/info?tokenId=${tokenId}`);
        if (walletResponse.ok) {
          const data = await walletResponse.json();
          setAgentWalletBalance(data.balance);
        }
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Withdrawal Failed',
          message: result.error || 'Unknown error',
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Error withdrawing funds:', err);
      setAlertModal({
        isOpen: true,
        title: 'Withdrawal Failed',
        message: 'An error occurred. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <PageShimmer />
      </Layout>
    );
  }

  if (error || !metadata) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
          <Bot className="w-16 h-16 text-gray-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Agent Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'This agent does not exist.'}</p>
          <Link 
            href="/profile"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
          >
            Back to Profile
          </Link>
        </div>
      </Layout>
    );
  }

  const isListed = listing?.active === true;

  return (
    <Layout>
      <div className="min-h-screen relative overflow-hidden py-8">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-lime-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Image & Actions (2 cols) */}
            <AnimatedSection animation="fadeInLeft" className="lg:col-span-2 space-y-6">
              {/* Image Card */}
              <div className="bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/20">
                <div className="w-full aspect-square bg-gradient-to-br from-emerald-500/20 to-lime-500/20 rounded-xl mb-4 flex items-center justify-center border border-emerald-500/30 overflow-hidden relative">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={metadata.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Bot className="w-24 h-24 text-emerald-300/50" />
                  )}
                  
                  {/* Listed Badge */}
                  {isListed && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500 text-white text-sm font-medium rounded-full flex items-center gap-1 shadow-lg">
                      <Tag className="w-4 h-4" />
                      For Sale
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 p-3 rounded-lg text-center border border-emerald-500/10">
                    <div className="text-xs text-emerald-200/60 mb-1">Level</div>
                    <div className="text-lg font-bold text-emerald-300">{metadata.level.toString()}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg text-center border border-emerald-500/10">
                    <div className="text-xs text-emerald-200/60 mb-1">Chats</div>
                    <div className="text-lg font-bold text-emerald-300">{metadata.chat_count.toString()}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg text-center border border-emerald-500/10">
                    <div className="text-xs text-emerald-200/60 mb-1">ID</div>
                    <div className="text-lg font-bold text-emerald-300">#{tokenId}</div>
                  </div>
                </div>
              </div>

              {/* Chat Button - Primary Action */}
              <button
                onClick={() => router.push(`/agent/${tokenId}/chat`)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-emerald-500/25 transform hover:scale-[1.02]"
              >
                <MessageCircle className="w-5 h-5" />
                Chat with Agent
              </button>

              {/* Marketplace Actions */}
              {isListed ? (
                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-emerald-200/60 mb-1">Current Price</div>
                      <div className="text-2xl font-bold text-emerald-300">
                        {listing ? formatPrice(BigInt(listing.price)) : '0'} STRK
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-sm rounded-full border border-emerald-500/20">
                      Listed
                    </div>
                  </div>
                  
                  {isOwner ? (
                    <button 
                      onClick={handleCancelListing}
                      disabled={isCancelling || marketplaceLoading}
                      className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isCancelling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cancel Listing"}
                    </button>
                  ) : activeKey ? (
                    <button 
                      onClick={() => setShowBuyModal(true)}
                      className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Buy Now
                    </button>
                  ) : (
                    <div className="text-center text-sm text-gray-400 py-2">
                      Connect wallet to buy
                    </div>
                  )}
                </div>
              ) : isOwner ? (
                <button 
                  onClick={() => setShowListModal(true)}
                  className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Tag className="w-5 h-5" />
                  List for Sale
                </button>
              ) : null}
            </AnimatedSection>

            {/* Right Column - Info & Details (3 cols) */}
            <AnimatedSection animation="fadeInRight" delay={0.1} className="lg:col-span-3 space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 break-words">
                  {ipfsData?.name || metadata.name}
                </h1>
                <p className="text-emerald-200/70 text-lg">AI Agent NFT</p>
              </div>

              {/* Agent Wallet */}
              <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-emerald-200 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    Agent Wallet
                  </h3>
                  {agentWalletBalance && (
                    <div className="text-sm">
                      <span className="text-emerald-200/60">Balance: </span>
                      <span className="text-emerald-300 font-bold">{agentWalletBalance} STRK</span>
                    </div>
                  )}
                </div>
                
                {agentWalletAddress ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-black/40 rounded-lg border border-emerald-500/20 flex items-center justify-between group">
                      <code className="text-sm text-emerald-400/80 font-mono truncate mr-4 flex-1 min-w-0">
                        {agentWalletAddress}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(agentWalletAddress);
                          setCopyToast(true);
                          setTimeout(() => setCopyToast(false), 2000);
                        }}
                        className="p-1.5 hover:bg-emerald-500/20 rounded-md text-emerald-500/60 hover:text-emerald-400 transition-colors"
                        title="Copy Address"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-emerald-200/40">
                      This wallet receives revenue from chats and holds funds for auto-payments.
                    </p>

                    {/* Withdraw Button - Only for Owner */}
                    {isOwner && agentWalletBalance && parseFloat(agentWalletBalance) >= 3 && (
                      <button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500/20 to-lime-500/20 hover:from-emerald-500/30 hover:to-lime-500/30 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isWithdrawing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Withdrawing...
                          </>
                        ) : (
                          <>
                            <Wallet className="w-5 h-5" />
                            Withdraw Funds
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">
                    Wallet address not available
                  </div>
                )}
              </div>

              {/* Details Panel */}
              <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/20">
                <h2 className="text-xl font-bold text-emerald-200 mb-4">Details</h2>
                <div className="space-y-4">
                  {/* Visibility Toggle */}
                  {isOwner && (
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 mb-4">
                      <div className="flex items-center gap-2">
                        {isPublic ? (
                          <Globe className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Lock className="w-5 h-5 text-amber-400" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-emerald-200">
                            {isPublic ? "Public Chat" : "Private Chat"}
                          </div>
                          <div className="text-xs text-emerald-200/60">
                            {isTogglingVisibility ? "Updating..." : isPublic ? "Anyone can chat" : "Only you can chat"}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleToggleVisibility}
                        disabled={isTogglingVisibility || nftLoading}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          isPublic ? "bg-emerald-500" : "bg-gray-600"
                        } ${isTogglingVisibility ? "opacity-50" : ""}`}
                      >
                        <span className={`${isPublic ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-emerald-200/60 mb-0.5">Creator</div>
                      <div className="text-emerald-200 font-mono text-sm truncate flex items-center">
                        {formatCreator(metadata.creator)}
                        {metadata.creator === activeKey && (
                          <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs rounded">You</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-emerald-200/60 mb-0.5">Created</div>
                      <div className="text-emerald-200 text-sm">{formatDate(metadata.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Traits */}
              <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/20">
                <h2 className="text-xl font-bold text-emerald-200 mb-4">Personality</h2>
                
                {ipfsData?.description && (
                  <div className="mb-6">
                    <div className="text-xs text-emerald-200/60 mb-2">Backstory</div>
                    <div className="text-sm text-emerald-100/80 bg-black/20 p-4 rounded-xl border border-emerald-500/10 leading-relaxed">
                      {ipfsData.description}
                    </div>
                  </div>
                )}

                {ipfsData?.traits && ipfsData.traits.length > 0 && (
                  <div>
                    <div className="text-xs text-emerald-200/60 mb-2">Traits</div>
                    <div className="flex flex-wrap gap-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {ipfsData.traits.map((trait: any, index: number) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-full capitalize"
                        >
                          {typeof trait === 'string' ? trait : trait.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-emerald-500/10">
                  <div className="text-xs text-emerald-200/60 mb-2">Personality Hash</div>
                  <div className="text-xs text-emerald-200/50 font-mono break-all bg-black/20 p-2 rounded-lg">
                    {metadata.personality_hash}
                  </div>
                </div>
              </div>

            </AnimatedSection>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ListAgentModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        tokenId={BigInt(tokenId)}
        agentName={ipfsData?.name || metadata.name}
        onSuccess={() => {
          setShowListModal(false);
          queryClient.invalidateQueries({ queryKey: ['marketplace', 'listing', tokenId] });
          queryClient.invalidateQueries({ queryKey: ['marketplace', 'activeListings'] });
        }}
      />

      <BuyAgentModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        tokenId={BigInt(tokenId)}
        agentName={ipfsData?.name || metadata.name}
        price={listing?.price ? BigInt(listing.price) : BigInt(0)}
        seller={listing?.seller || ''}
        imageUrl={imageUrl || undefined}
        onSuccess={() => {
          setShowBuyModal(false);
          queryClient.invalidateQueries({ queryKey: ['marketplace', 'listing', tokenId] });
          queryClient.invalidateQueries({ queryKey: ['marketplace', 'activeListings'] });
          queryClient.invalidateQueries({ queryKey: ['agents', 'owned'] });
        }}
      />

      {/* Copy Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-emerald-500 to-lime-500 text-black font-medium px-4 py-2 rounded-xl shadow-lg animate-pulse">
          ✓ Address copied!
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      <ConfirmModal
        isOpen={showWithdrawConfirm}
        onClose={() => setShowWithdrawConfirm(false)}
        onConfirm={executeWithdraw}
        title="Withdraw Funds"
        message={`Withdraw approximately ${agentWalletBalance ? (parseFloat(agentWalletBalance) - 2.5).toFixed(4) : '0'} STRK to your wallet?\n\nNote: 2.5 STRK will remain for gas fees.`}
        confirmText="Withdraw"
        cancelText="Cancel"
        isLoading={isWithdrawing}
      />

      {/* Visibility Toggle Confirmation Modal */}
      <ConfirmModal
        isOpen={showVisibilityConfirm}
        onClose={() => setShowVisibilityConfirm(false)}
        onConfirm={executeToggleVisibility}
        title="Change Visibility"
        message={`Make this agent ${pendingVisibility ? 'public' : 'private'}?\n\n${pendingVisibility ? 'Anyone will be able to chat with your agent.' : 'Only you will be able to chat with this agent.'}`}
        confirmText={pendingVisibility ? 'Make Public' : 'Make Private'}
        cancelText="Cancel"
        isLoading={isTogglingVisibility}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
    </Layout>
  );
}
