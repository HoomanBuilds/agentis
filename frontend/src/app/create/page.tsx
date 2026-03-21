'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components';
import { AnimatedSection, ConnectWalletState, LoadingPage } from '@/components/shared';
import { CreateAgentForm, AgentPreview, MintingProgress, AgentFormData } from '@/components/create';
import { useWallet } from '@/hooks/useWallet';
import { useAgentNFT } from '@/hooks/useAgentNFT';
import { Sparkles } from 'lucide-react';

type MintingStep = 'idle' | 'preparing' | 'signing' | 'submitting' | 'success' | 'error';

export default function CreatePage() {
  const router = useRouter();
  const { isConnected, activeKey, isLoading: walletLoading } = useWallet();
  const { mintAgent, lastResult } = useAgentNFT();

  const [formData, setFormData] = useState<Partial<AgentFormData>>({});
  const [mintingStep, setMintingStep] = useState<MintingStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mintedTokenId, setMintedTokenId] = useState<number | undefined>();

  const handleFormChange = useCallback((data: Partial<AgentFormData>) => {
    setFormData(data);
  }, []);

  const handleSubmit = async (data: AgentFormData) => {
    if (!activeKey) return;

    setMintingStep('preparing');
    setErrorMessage('');

    try {
      // Create personality hash from traits and description
      const personalityData = {
        traits: data.traits,
        description: data.description,
        hasKnowledgeBase: !!data.knowledgeBase,
      };
      const personalityHash = btoa(JSON.stringify(personalityData)).slice(0, 64);

      // Upload image to IPFS first (if provided)
      let imageUrl = '';
      console.log('=== NFT CREATION DEBUG ===');
      console.log('data.image:', data.image ? `File: ${data.image.name}, ${data.image.size} bytes` : 'null/undefined');
      console.log('data.name:', data.name);
      console.log('data.traits:', data.traits);
      
      if (data.image) {
        console.log('Uploading image to IPFS...');
        try {
          const imageFormData = new FormData();
          imageFormData.append('file', data.image);
          
          const imageResponse = await fetch('/api/ipfs/upload-image', {
            method: 'POST',
            body: imageFormData,
          });
          
          const imageData = await imageResponse.json();
          
          if (imageData.success && imageData.ipfsUrl) {
            imageUrl = imageData.ipfsUrl;
            console.log('Image uploaded to IPFS:', imageUrl);
          } else {
            console.warn('Image upload failed:', imageData.error);
          }
        } catch (imageError) {
          console.warn('Image upload error:', imageError);
        }
      }

      // Create metadata to upload to IPFS
      const metadata = {
        name: data.name,
        description: data.description,
        traits: data.traits,
        ...(imageUrl && { image: imageUrl }),
        ...(data.knowledgeBase && { knowledgeBase: data.knowledgeBase.name }),
      };

      // Upload metadata to IPFS
      console.log('Uploading metadata to IPFS...');
      let tokenUri = '';
      
      try {
        const ipfsResponse = await fetch('/api/ipfs/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata }),
        });
        
        const ipfsData = await ipfsResponse.json();
        
        if (ipfsData.success && ipfsData.ipfsUrl) {
          tokenUri = ipfsData.ipfsUrl;
          console.log('Metadata uploaded to IPFS:', tokenUri);
        } else {
          throw new Error(ipfsData.error || 'IPFS upload failed');
        }
      } catch (ipfsError) {
        // Fallback to base64 data URI if IPFS fails
        console.warn('IPFS upload failed, falling back to base64:', ipfsError);
        tokenUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      }

      setMintingStep('signing');

      const result = await mintAgent(data.name, tokenUri, personalityHash);

      if (result.success) {
        setMintingStep('submitting');
        // Small delay to show submitting step
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setMintedTokenId(parseInt(result.transactionHash.slice(0, 8), 16) % 10000);
        setMintingStep('success');
      } else {
        setErrorMessage(result.errorMessage || 'Minting failed');
        setMintingStep('error');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setMintingStep('error');
    }
  };

  const handleCloseMinting = () => {
    setMintingStep('idle');
    if (mintingStep === 'success') {
      router.push('/profile');
    }
  };

  const handleRetry = () => {
    setMintingStep('idle');
    setErrorMessage('');
  };

  // Show loading while wallet is connecting
  if (walletLoading) {
    return (
      <Layout>
        <LoadingPage />
      </Layout>
    );
  }

  // Show connect wallet prompt if not connected
  if (!isConnected || !activeKey) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <ConnectWalletState />
        </div>
      </Layout>
    );
  }

  const isSubmitting = ['preparing', 'signing', 'submitting'].includes(mintingStep);

  return (
    <Layout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[150px]" />
          <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-lime-500/6 rounded-full blur-[120px]" />
        </div>

        {/* Content */}
        <div className="relative py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <AnimatedSection animation="fadeInUp" className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-emerald-400" />
                Create AI Agent
              </h1>
              <p className="text-gray-400 mt-2 max-w-2xl">
                Design your unique AI agent with custom personality traits. 
                Your agent will be minted as an NFT on Starknet.
              </p>
            </AnimatedSection>

            {/* Form and Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Form Section */}
              <AnimatedSection 
                animation="fadeInLeft" 
                delay={0.1}
                className="lg:col-span-3"
              >
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-emerald-500/20">
                  <CreateAgentForm
                    onChange={handleFormChange}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                </div>
              </AnimatedSection>

              {/* Preview Section */}
              <div className="lg:col-span-2">
                <AnimatedSection animation="fadeInRight" delay={0.2}>
                  <AgentPreview data={formData} />
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minting Progress Modal */}
      <MintingProgress
        step={mintingStep}
        deployHash={lastResult?.transactionHash}
        explorerUrl={lastResult?.explorerUrl}
        errorMessage={errorMessage}
        tokenId={mintedTokenId}
        onClose={handleCloseMinting}
        onRetry={handleRetry}
      />
    </Layout>
  );
}
