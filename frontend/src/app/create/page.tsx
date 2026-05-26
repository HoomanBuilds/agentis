'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layout } from '@/components';
import { ConnectWalletState, LoadingPage } from '@/components/shared';
import { CreateAgentForm, AgentPreview, MintingProgress, AgentFormData } from '@/components/create';
import { useWallet } from '@/hooks/useWallet';
import { useAgentNFT } from '@/hooks/useAgentNFT';

type MintingStep = 'idle' | 'preparing' | 'signing' | 'submitting' | 'success' | 'error';

export default function CreatePage() {
  const router = useRouter();
  const { isConnected, activeKey, isLoading: walletLoading } = useWallet();
  const { mintAgent, lastResult } = useAgentNFT();

  const [formData, setFormData] = useState<Partial<AgentFormData>>({});
  const [mintingStep, setMintingStep] = useState<MintingStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [mintedTokenId, setMintedTokenId] = useState<number | undefined>(undefined);

  const handleFormChange = useCallback((data: Partial<AgentFormData>) => {
    setFormData(data);
  }, []);

  const handleSubmit = async (data: AgentFormData) => {
    if (!activeKey) return;
    setMintingStep('preparing');
    setErrorMessage('');

    try {
      const personalityData = { traits: data.traits, description: data.description, hasKnowledgeBase: !!data.knowledgeBase };
      const personalityHash = btoa(JSON.stringify(personalityData)).slice(0, 64);

      let imageUrl = '';
      if (data.image) {
        try {
          const imageFormData = new FormData();
          imageFormData.append('file', data.image);
          const imageResponse = await fetch('/api/ipfs/upload-image', { method: 'POST', body: imageFormData });
          const imageData = await imageResponse.json();
          if (imageData.success && imageData.ipfsUrl) imageUrl = imageData.ipfsUrl;
        } catch {}
      }

      const metadata = { name: data.name, description: data.description, traits: data.traits, ...(imageUrl && { image: imageUrl }) };
      let tokenUri = '';

      try {
        const ipfsResponse = await fetch('/api/ipfs/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metadata }) });
        const ipfsData = await ipfsResponse.json();
        if (ipfsData.success && ipfsData.ipfsUrl) tokenUri = ipfsData.ipfsUrl;
        else throw new Error(ipfsData.error || 'IPFS upload failed');
      } catch {
        tokenUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
      }

      setMintingStep('signing');
      const result = await mintAgent(data.name, tokenUri, personalityHash);

      if (result.success) {
        setMintingStep('submitting');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setMintedTokenId(undefined);
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
    if (mintingStep === 'success') router.push('/profile');
  };

  const handleRetry = () => { setMintingStep('idle'); setErrorMessage(''); };

  if (walletLoading) return <Layout><LoadingPage /></Layout>;
  if (!isConnected || !activeKey) {
    return <Layout><div className="min-h-[80vh] flex items-center justify-center px-4"><ConnectWalletState /></div></Layout>;
  }

  const isSubmitting = ['preparing', 'signing', 'submitting'].includes(mintingStep);

  return (
    <Layout>
      <div className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold tracking-display mb-3">
              Create an <span className="text-gradient-lime">Agent NFT</span>
            </h1>
            <p className="text-muted-foreground">Define your agent&apos;s personality and mint it on Starknet</p>
          </motion.div>

          {/* Form and Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
                <CreateAgentForm onChange={handleFormChange} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <AgentPreview data={formData} />
            </motion.div>
          </div>

          {/* Cost notice */}
          <p className="text-sm text-muted-foreground text-center mt-6">
            Minting fee: <span className="text-primary font-medium">10 STRK</span>
          </p>

        </div>
      </div>

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
