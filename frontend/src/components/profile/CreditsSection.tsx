'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Gift, ShoppingCart, Loader2, Check, ExternalLink, Package } from 'lucide-react';
import { AnimatedSection } from '@/components/shared';
import { useAgentCredits, CreditPlan } from '@/hooks/useAgentCredits';
import { useCreditBalance, useHasClaimedFreeTier } from '@/hooks/queries/useCreditQueries';
import { useQueryClient } from '@tanstack/react-query';

interface CreditsSectionProps {
  userKey: string;
  className?: string;
}

export function CreditsSection({ userKey, className = '' }: CreditsSectionProps) {
  const queryClient = useQueryClient();
  
  const {
    claimFreeTier,
    purchaseCredits,
    purchasePlan,
    getCreditPrice,
    getFreeTierAmount,
    getPlans,
    isLoading,
    lastResult,
  } = useAgentCredits();

  // Use React Query for credit balance and claim status (auto-syncs with ProfileStats)
  const { balance: creditBalance, invalidate: invalidateBalance } = useCreditBalance(userKey);
  const { data: hasClaimed, refetch: refetchClaimed } = useHasClaimedFreeTier(userKey);

  const [creditPrice, setCreditPrice] = useState<bigint>(BigInt('100000000000000000'));
  const [freeTierAmount, setFreeTierAmount] = useState<bigint>(BigInt(10));
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('100');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch non-user-specific data (prices, plans)
  const fetchStaticData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [price, freeAmount, allPlans] = await Promise.all([
        getCreditPrice(),
        getFreeTierAmount(),
        getPlans(),
      ]);
      setCreditPrice(price);
      setFreeTierAmount(freeAmount);
      setPlans(allPlans);
    } catch (error) {
      console.error('Error fetching credits data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [getCreditPrice, getFreeTierAmount, getPlans]);

  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  // Invalidate React Query caches after successful transactions
  const invalidateCaches = useCallback(() => {
    invalidateBalance();
    refetchClaimed();
  }, [invalidateBalance, refetchClaimed]);

  const handleClaimFreeTier = async () => {
    const result = await claimFreeTier();
    if (result.success) {
      setTimeout(invalidateCaches, 5000);
    }
  };

  const handlePurchase = async () => {
    const amount = BigInt(purchaseAmount);
    const cost = amount * creditPrice;
    const result = await purchaseCredits(amount, cost);
    if (result.success) {
      setTimeout(invalidateCaches, 5000);
    }
  };

  const handlePurchasePlan = async (plan: CreditPlan) => {
    const result = await purchasePlan(plan.id, plan.price);
    if (result.success) {
      setTimeout(invalidateCaches, 5000);
    }
  };

  const pricePerCredit = Number(creditPrice) / 1e18;
  const purchaseCost = parseInt(purchaseAmount) * pricePerCredit;

  return (
    <AnimatedSection animation="fadeInUp" delay={0.3} className={className}>
      <div className="glass-panel p-6 rounded-xl border border-primary/20">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
          <Coins className="w-5 h-5 text-primary" />
          Credits
        </h2>

        {/* Balance Display */}
        <div className="mb-6 p-4 bg-input rounded-xl border border-primary/10">
          <div className="text-sm text-muted-foreground mb-1">Current Balance</div>
          <div className="text-3xl font-bold text-gradient-lime">
            {isLoadingData ? '...' : creditBalance.toString()}
            <span className="text-lg text-muted-foreground ml-2">credits</span>
          </div>
          <div className="text-xs text-muted-foreground/60 mt-1">
            1 credit = {pricePerCredit.toFixed(2)} STRK
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Free Tier Claim */}
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Free Credits</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Claim {freeTierAmount.toString()} free credits to get started!
            </p>
            <button
              onClick={handleClaimFreeTier}
              disabled={isLoading || hasClaimed || isLoadingData}
              className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : hasClaimed ? (
                <>
                  <Check className="w-4 h-4" />
                  Already Claimed
                </>
              ) : (
                'Claim Free Credits'
              )}
            </button>
          </div>

          {/* Purchase Credits */}
          <div className="p-4 bg-primary/5 rounded-xl border border-lime-500/20">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Buy Credits</span>
            </div>
            <div className="mb-3">
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                min="1"
                className="w-full px-4 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="Amount"
              />
              <div className="text-xs text-muted-foreground/60 mt-1">
                Cost: ~{purchaseCost.toFixed(2)} STRK
              </div>
            </div>
            <button
              onClick={handlePurchase}
              disabled={isLoading || !purchaseAmount || parseInt(purchaseAmount) <= 0}
              className="w-full px-4 py-3 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Purchase Credits'
              )}
            </button>
          </div>
        </div>

        {/* Credit Plans */}
        {plans.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Credit Plans</span>
              <span className="text-xs text-muted-foreground/60">(Discounted bundles)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plans.map((plan) => {
                const planPriceSTRK = Number(plan.price) / 1e18;
                const normalPrice = Number(plan.credits) * pricePerCredit;
                const savings = normalPrice - planPriceSTRK;

                return (
                  <div
                    key={plan.id.toString()}
                    className="p-4 bg-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-colors"
                  >
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {plan.credits.toString()}
                      <span className="text-sm text-muted-foreground ml-1">credits</span>
                    </div>
                    <div className="text-lg font-semibold text-primary mb-1">
                      {planPriceSTRK.toFixed(0)} STRK
                    </div>
                    {plan.discountPercent > 0 && (
                      <div className="text-xs text-primary mb-3">
                        Save {plan.discountPercent.toString()}% ({savings.toFixed(1)} STRK)
                      </div>
                    )}
                    <button
                      onClick={() => handlePurchasePlan(plan)}
                      disabled={isLoading}
                      className="w-full px-3 py-2 bg-primary/20 border border-primary/30 text-primary font-medium rounded-lg hover:bg-primary/30 transition-all disabled:opacity-50 text-sm"
                    >
                      {isLoading ? 'Processing...' : 'Buy Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction Result */}
        {lastResult?.success && lastResult.explorerUrl && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
            <span className="text-sm text-primary">Transaction submitted!</span>
            <a
              href={lastResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:text-foreground"
            >
              View <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}
