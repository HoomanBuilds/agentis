"use client"

import { motion, useReducedMotion } from "framer-motion"

const mockAgents = [
  { id: 1, name: 'CryptoSage', level: 12, category: 'Finance', price: '50' },
  { id: 2, name: 'NarratorX', level: 8, category: 'Storytelling', price: '25' },
  { id: 3, name: 'CodeBuddy', level: 23, category: 'Dev', price: '75' },
  { id: 4, name: 'PhiloBot', level: 5, category: 'Philosophy', price: '15' },
  { id: 5, name: 'TradeMind', level: 17, category: 'Trading', price: '100' },
  { id: 6, name: 'ArtMuse', level: 9, category: 'Creative', price: '30' },
  { id: 7, name: 'LegalEagle', level: 14, category: 'Legal', price: '80' },
  { id: 8, name: 'ScienceBot', level: 6, category: 'Science', price: '20' },
]

const allAgents = [...mockAgents, ...mockAgents]

export function AgentMarquee() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="agents" className="relative py-12 sm:py-20 overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-primary/25"
        style={{
          maskImage: "radial-gradient(ellipse 55% 55%, rgb(0 0 0 / 0.75), transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 55% 55%, rgb(0 0 0 / 0.75), transparent)",
        }}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/grade.png')" }} />
      </div>

      <div className="text-center mb-8 sm:mb-12 px-4">
        <motion.h2
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4"
        >
          Meet the <span className="text-gradient-lime">Agents</span>
        </motion.h2>
        <motion.p
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto"
        >
          Hundreds of unique AI personalities, ready to chat
        </motion.p>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* First row - scrolls left */}
        <div className="mb-4">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex gap-3 sm:gap-4 animate-marquee"
            style={{ width: "fit-content" }}
          >
            {allAgents.map((agent, i) => (
              <AgentNFTCard key={`row1-${i}`} agent={agent} />
            ))}
          </motion.div>
        </div>

        {/* Second row - scrolls right (reversed) */}
        <div>
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex gap-3 sm:gap-4 animate-marquee"
            style={{
              width: "fit-content",
              animationDirection: "reverse",
              animationDuration: "70s",
            }}
          >
            {[...allAgents].reverse().map((agent, i) => (
              <AgentNFTCard key={`row2-${i}`} agent={agent} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function AgentNFTCard({ agent }: { agent: typeof mockAgents[0] }) {
  return (
    <div className="group relative flex-shrink-0 w-48 sm:w-56 p-4 bg-card border border-border rounded-xl transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_0_30px_-5px_oklch(0.92_0.16_125_/_0.2)]">
      <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-3">
        <span className="text-3xl font-bold text-primary/60">{agent.name[0]}</span>
      </div>
      <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{agent.category}</div>
      <div className="text-sm font-semibold text-foreground mb-1">{agent.name}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Lvl {agent.level}</span>
        <span className="text-xs font-medium text-gradient-lime">{agent.price} STRK</span>
      </div>
    </div>
  )
}
