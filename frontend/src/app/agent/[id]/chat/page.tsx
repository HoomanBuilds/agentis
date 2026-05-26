'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Layout } from '@/components';
import { PageShimmer } from '@/components/shared';
import { 
  ChatMessages, 
  ChatInput, 
  AgentIconBar, 
  AgentInfoPanel, 
  PaymentModal,
  ChatHistorySlider,
  FloatingCredits,
} from '@/components/chat';
import { useAgentChat } from '@/hooks/useAgentChat';
import { AgentMetadata } from '@/hooks/useAgentNFT';
import { useWallet } from '@/hooks/useWallet';
import { useOwnedAgents, useAgentVisibility, fetchAgentMetadata, fetchIPFSData } from '@/hooks/queries/useAgentQueries';
import { useAgentCredits } from '@/hooks/useAgentCredits';
import { Bot, ArrowLeft, Lock, Menu } from 'lucide-react';
import Link from 'next/link';

interface IPFSMetadata {
  name: string;
  description?: string;
  image?: string;
  traits?: string[];
}

interface AgentWithImage {
  id: number;
  name: string;
  image?: string;
  metadata?: AgentMetadata | null;
  ipfsData?: IPFSMetadata;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { activeKey } = useWallet();
  const tokenId = params.id as string;
  const tokenIdNum = parseInt(tokenId);

  // Fetch the CURRENT agent from URL (works for any agent, owned or not)
  const { data: currentAgentData, isLoading: isLoadingCurrentAgent } = useQuery({
    queryKey: ['agent', 'full', tokenId],
    queryFn: async () => {
      const metadata = await fetchAgentMetadata(BigInt(tokenId));
      if (!metadata) return null;
      
      let ipfsData = undefined;
      let imageUrl = undefined;
      
      if (metadata.token_uri) {
        const cid = metadata.token_uri.replace('ipfs://', '');
        ipfsData = await fetchIPFSData(cid);
        
        if (ipfsData?.image) {
          let gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
          if (!gateway.endsWith('/ipfs/')) {
            gateway = gateway.replace(/\/$/, '') + '/ipfs/';
          }
          imageUrl = ipfsData.image.replace('ipfs://', gateway);
        }
      }
      
      return {
        id: tokenIdNum,
        name: ipfsData?.name || metadata.name || `Agent #${tokenId}`,
        image: imageUrl,
        metadata,
        ipfsData,
      } as AgentWithImage;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!tokenId,
  });

  // Fetch owned agents (for sidebar - only owners need this)
  const { data: tokenIds, isLoading: isLoadingIds } = useOwnedAgents(activeKey || undefined);

  // Fetch agent IDs that user has chatted with (from ChromaDB)
  const { data: chattedAgentIds, isLoading: isLoadingChattedIds } = useQuery({
    queryKey: ['chat', 'agents', activeKey],
    queryFn: async () => {
      if (!activeKey) return [];
      const response = await fetch(`/api/chat/agents?userAddress=${encodeURIComponent(activeKey)}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.agentIds || [];
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!activeKey,
  });

  // Combine owned agent IDs and chatted agent IDs (removing duplicates)
  const allAgentIds = (() => {
    const ownedIds = (tokenIds || []).map(id => Number(id));
    const chattedIds = chattedAgentIds || [];
    const combined = new Set([...ownedIds, ...chattedIds]);
    return Array.from(combined).map(id => BigInt(id));
  })();

  // Fetch full data for all agents (owned + chatted)
  const agentQueries = useQueries({
    queries: allAgentIds.map(id => ({
      queryKey: ['agent', 'full', id.toString()],
      queryFn: async () => {
        const metadata = await fetchAgentMetadata(id);
        if (!metadata) return null;
        
        let ipfsData = undefined;
        let imageUrl = undefined;
        
        if (metadata.token_uri) {
          const cid = metadata.token_uri.replace('ipfs://', '');
          ipfsData = await fetchIPFSData(cid);
          
          if (ipfsData?.image) {
            let gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';
            if (!gateway.endsWith('/ipfs/')) {
              gateway = gateway.replace(/\/$/, '') + '/ipfs/';
            }
            imageUrl = ipfsData.image.replace('ipfs://', gateway);
          }
        }
        
        return {
          id: Number(id),
          name: ipfsData?.name || metadata.name || `Agent #${id}`,
          image: imageUrl,
          metadata,
          ipfsData,
        } as AgentWithImage;
      },
      staleTime: 10 * 60 * 1000,
    }))
  });

  const myAgents = agentQueries
    .map(q => q.data)
    .filter((a): a is AgentWithImage => a !== null && a !== undefined);

  const isLoading = isLoadingCurrentAgent || (isLoadingIds && isLoadingChattedIds && agentQueries.some(q => q.isLoading));

  const [input, setInput] = useState('');

  // Use current agent from URL, or fall back to owned agent
  const selectedAgent = currentAgentData || myAgents.find(a => a.id === tokenIdNum) || null;
  
  // Check if user is the owner of this agent
  const isOwner = tokenIds?.some(id => Number(id) === tokenIdNum) || false;
  
  // Check agent visibility (public/private)
  const { data: isPublic = true, isLoading: isVisibilityLoading } = useAgentVisibility(
    tokenId ? BigInt(tokenId) : undefined
  );
  
  // Non-owners can only access public agents
  const isAccessBlocked = !isOwner && !isPublic;

  // Chat hook - uses selected agent
  const { 
    messages, 
    isLoading: isSending, 
    error: chatError, 
    paymentRequired, 
    sendMessage, 
    startNewSession,
    retryAfterPayment,
    dismissPaymentModal,
    sessionId,
    switchSession,
  } = useAgentChat({
    agentId: selectedAgent?.id || parseInt(tokenId),
    tokenUri: selectedAgent?.metadata?.token_uri,
    userPublicKey: activeKey || undefined,
    isOwner,
  });
  
  // Session slider state
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [sessions, setSessions] = useState<Array<{
    sessionId: string;
    lastMessage: string;
    timestamp: number;
    messageCount: number;
  }>>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  
  // Credits hook for session purchase
  const { purchaseSession } = useAgentCredits();
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Fetch agent wallet address
  const [agentWalletAddress, setAgentWalletAddress] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    async function fetchWallet() {
      if (!selectedAgent) return;
      try {
        const response = await fetch(`/api/agent-wallet/info?tokenId=${selectedAgent.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.address) {
            setAgentWalletAddress(data.address);
          }
        }
      } catch (e) {
        console.error('Error fetching agent wallet:', e);
      }
    }
    fetchWallet();
  }, [selectedAgent?.id]);

  // Scroll to bottom on new messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat sessions when slider opens
  const loadSessions = async () => {
    if (!activeKey || !selectedAgent) return;
    
    setIsLoadingSessions(true);
    try {
      const params = new URLSearchParams({
        agentId: String(selectedAgent.id),
        userAddress: activeKey,
      });
      
      const response = await fetch(`/api/chat/sessions?${params}`, {
        credentials: 'include',  // Ensure cookies are sent for auth
      });
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Sessions API error:', data.error);
        return;
      }
      
      if (data.success && data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load sessions when slider opens
  useEffect(() => {
    if (isSliderOpen) {
      loadSessions();
    }
  }, [isSliderOpen]);

  // Handle agent selection
  const handleSelectAgent = (id: number) => {
    const agent = myAgents.find(a => a.id === id);
    if (agent) {
      startNewSession();
      router.push(`/agent/${id}/chat`);
    }
  };

  // Handle send
  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };
  
  // Handle payment for message (owner flow)
  const handlePayForMessage = async () => {
    setIsPaymentProcessing(true);
    try {
      // For now, redirect to profile for credit purchase
      // TODO: Implement inline credit purchase
      router.push('/profile');
    } finally {
      setIsPaymentProcessing(false);
    }
  };
  
  // Handle session purchase (non-owner flow)
  const handleBuySessionPack = async () => {
    if (!selectedAgent) return;
    
    setIsPaymentProcessing(true);
    try {
      const result = await purchaseSession(selectedAgent.id, agentWalletAddress);
      
      if (result.success) {
        console.log('Session purchased successfully:', result.transactionHash);
        // Wait for transaction to be confirmed, then retry the message
        setTimeout(() => {
          dismissPaymentModal();
          retryAfterPayment();
        }, 5000);
      } else {
        console.error('Session purchase failed:', result.errorMessage);
        alert(`Purchase failed: ${result.errorMessage}`);
      }
    } catch (err) {
      console.error('Session purchase error:', err);
      alert('Failed to purchase session. Please try again.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Handle clear session
  const handleClearSession = () => {
    if (confirm('Clear this chat session?')) {
      startNewSession();
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <PageShimmer />
      </Layout>
    );
  }

  if (!activeKey) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Bot className="w-16 h-16 text-muted-foreground/60 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground">Please connect your wallet to chat with AI agents</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Block access to private agents for non-owners
  if (isAccessBlocked && !isVisibilityLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Private Agent</h2>
            <p className="text-muted-foreground mb-6">
              This agent is private and can only be accessed by its owner. 
              Contact the owner to request access or browse public agents.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary/20 text-primary hover:bg-primary/30 rounded-xl font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Browse Public Agents
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter>
      <div className="flex h-[calc(100vh-88px)]">
        {/* Left: Agent Icon Bar */}
        <AgentIconBar
          agents={myAgents}
          selectedId={selectedAgent?.id || parseInt(tokenId)}
          onSelect={handleSelectAgent}
          isLoading={isLoading}
        />


        {/* Middle: Agent Info Panel */}
        {selectedAgent && selectedAgent.metadata && (
          <AgentInfoPanel
            name={selectedAgent.name}
            tokenId={String(selectedAgent.id)}
            image={selectedAgent.image}
            description={selectedAgent.ipfsData?.description}
            traits={selectedAgent.ipfsData?.traits}
            level={Number(selectedAgent.metadata.level)}
            chatCount={Number(selectedAgent.metadata.chat_count)}
            creator={selectedAgent.metadata.creator}
            createdAt={selectedAgent.metadata.created_at}
            onClearSession={handleClearSession}
            walletAddress={agentWalletAddress}
          />
        )}

        {/* Right: Chat Area */}
        <div className="flex-1 flex flex-col bg-background relative">
          {/* Session History Slider */}
          <ChatHistorySlider
            isOpen={isSliderOpen}
            onClose={() => setIsSliderOpen(false)}
            sessions={sessions}
            currentSessionId={sessionId}
            onSelectSession={switchSession}
            onNewChat={startNewSession}
            isLoading={isLoadingSessions}
          />
          
          {selectedAgent ? (
            <>
              {/* Chat Header with hamburger and credits */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSliderOpen(true)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Chat History"
                  >
                    <Menu className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedAgent.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {isOwner ? 'Your Agent' : 'Session Chat'}
                    </p>
                  </div>
                </div>
                <FloatingCredits
                  agentId={selectedAgent.id}
                  isOwner={isOwner}
                  userPublicKey={activeKey || undefined}
                  messageCount={messages.length}
                />
              </div>

              {/* Messages */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ChatMessages
                  messages={messages}
                  agentName={selectedAgent.name}
                  isThinking={isSending && messages.length > 0 && messages[messages.length - 1]?.role === 'user'}
                />
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                isSending={isSending}
                agentName={selectedAgent.name}
                disabled={!!paymentRequired}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bot className="w-16 h-16 text-muted-foreground/60 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Select an Agent</h2>
                <p className="text-muted-foreground">Choose an agent from the left to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Modal */}
      {paymentRequired && (
        <PaymentModal
          isOpen={!!paymentRequired}
          onClose={dismissPaymentModal}
          onPayForMessage={isOwner ? handlePayForMessage : undefined}
          onBuySessionPack={!isOwner ? handleBuySessionPack : undefined}
          isProcessing={isPaymentProcessing}
          paymentInfo={paymentRequired}
        />
      )}
    </Layout>
  );
}
