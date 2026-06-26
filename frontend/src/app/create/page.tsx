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
    console.log('[create] handleSubmit started', { name: data.name, traits: data.traits });

    try {
      // btoa only handles Latin-1; use encodeURIComponent to handle any Unicode in description
      const personalityData = { traits: data.traits, description: data.description, hasKnowledgeBase: !!data.knowledgeBase };
      const personalityHash = btoa(encodeURIComponent(JSON.stringify(personalityData))).slice(0, 64);
      console.log('[create] personalityHash:', personalityHash);

      let imageUrl = '';
      if (data.image) {
        console.log('[create] uploading image to IPFS...');
        try {
          const imageFormData = new FormData();
          imageFormData.append('file', data.image);
          const imageResponse = await fetch('/api/ipfs/upload-image', { method: 'POST', body: imageFormData });
          const imageData = await imageResponse.json();
          if (imageData.success && imageData.ipfsUrl) {
            imageUrl = imageData.ipfsUrl;
            console.log('[create] image IPFS:', imageUrl);
          }
        } catch (e) {
          console.warn('[create] image upload failed (non-fatal):', e);
        }
      }

      const metadata = { name: data.name, description: data.description, traits: data.traits, ...(imageUrl && { image: imageUrl }), ...(data.knowledgeBase && { hasKnowledgeBase: true }) };
      let tokenUri = '';

      console.log('[create] uploading metadata to IPFS...');
      try {
        const ipfsResponse = await fetch('/api/ipfs/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metadata }) });
        const ipfsData = await ipfsResponse.json();
        if (ipfsData.success && ipfsData.ipfsUrl) {
          tokenUri = ipfsData.ipfsUrl;
          console.log('[create] metadata IPFS:', tokenUri);
        } else {
          throw new Error(ipfsData.error || 'IPFS upload returned no URL');
        }
      } catch (e) {
        console.warn('[create] IPFS upload failed, using data URI fallback:', e);
        // Fallback: use encodeURIComponent so non-ASCII in metadata is safe
        tokenUri = `data:application/json;base64,${btoa(encodeURIComponent(JSON.stringify(metadata)))}`;
        console.log('[create] fallback tokenUri length:', tokenUri.length);
      }

      console.log('[create] calling mintAgent...');
      setMintingStep('signing');
      const result = await mintAgent(data.name, tokenUri, personalityHash);

      if (result.success) {
        console.log('[create] mint success, txHash:', result.transactionHash);
        setMintingStep('submitting');

        // Get the newly minted token ID (total supply = last token ID)
        let mintedId: number | undefined;
        try {
          const statsRes = await fetch('/api/stats?bust=true');
          const stats = await statsRes.json();
          if (stats.totalAgents) mintedId = Number(stats.totalAgents);
        } catch (e) {
          console.warn('[create] could not fetch token ID:', e);
        }
        setMintedTokenId(mintedId);

        // Register a deterministic agent wallet for revenue sharing
        if (mintedId) {
          try {
            await fetch('/api/agent/register-wallet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ agentId: mintedId }),
            });
            console.log('[create] agent wallet registered for agent', mintedId);
          } catch (e) {
            console.warn('[create] wallet registration failed (non-fatal):', e);
          }
        }

        // Upload knowledge base document if provided
        if (data.knowledgeBase && mintedId) {
          try {
            const text = await data.knowledgeBase.text();
            await fetch('/api/knowledge-base/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ knowledgeBaseId: String(mintedId), documents: [text] }),
            });
            console.log('[create] knowledge base uploaded for agent', mintedId);
          } catch (e) {
            console.warn('[create] knowledge base upload failed (non-fatal):', e);
          }
        }

        setMintingStep('success');
      } else {
        console.error('[create] mintAgent returned failure:', result.errorMessage);
        setErrorMessage(result.errorMessage || 'Minting failed');
        setMintingStep('error');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[create] unhandled error:', msg, error);
      setErrorMessage(msg);
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
