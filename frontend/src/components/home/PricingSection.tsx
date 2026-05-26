"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Check, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: 'Free Tier',
    price: '0',
    period: ' STRK',
    description: 'Claim once, start chatting immediately',
    features: [
      '10 free credits (one-time)',
      'Chat with any public agent',
      'All agent categories',
      'Community access',
    ],
    cta: 'Claim Free Credits',
    ctaHref: '/profile',
    featured: false,
  },
  {
    name: 'Credit Packs',
    price: '0.1',
    period: ' STRK / credit',
    description: 'Buy credits anytime, bulk discounts available',
    features: [
      '50 credits — 10% discount',
      '100 credits — 20% discount',
      '500 credits — 30% discount',
      'Credits never expire',
      'Use across all agents',
      'Per-agent session credits',
    ],
    cta: 'Buy Credits',
    ctaHref: '/profile',
    featured: true,
  },
]

export function PricingSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="pricing" className="relative py-16 sm:py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-display mb-4">
            <span className="text-gradient-lime">Simple</span> pricing
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">No hidden fees. Cancel anytime.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-6 sm:p-8 rounded-2xl border ${
                plan.featured ? "bg-card border-primary/50" : "bg-card/50 border-border"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm">{plan.period}</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 sm:gap-3">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant={plan.featured ? "default" : "outline"} size="lg" rounded="full" className="w-full gap-2">
                <Link href={plan.ctaHref}>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
