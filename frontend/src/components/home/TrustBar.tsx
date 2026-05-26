"use client"

import { motion, useReducedMotion } from "framer-motion"

const trustBadges = ['Starknet', 'Cairo', 'OpenAI', 'IPFS', 'Voyager']

export function TrustBar() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-8 sm:py-10 border-y border-border/30 bg-background/80 backdrop-blur-sm"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs text-muted-foreground/50 mb-5 text-center uppercase tracking-widest">
          Built on trusted technology
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-14 gap-y-3">
          {trustBadges.map((badge) => (
            <span
              key={badge}
              className="text-base sm:text-lg font-semibold text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
