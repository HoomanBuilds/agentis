"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { fetchAgentMetadata, fetchIPFSData } from "@/hooks/queries/useAgentQueries"

interface AgentCard {
  id: number
  name: string
  image?: string
  level: number
  category?: string
}

const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud'

function resolveIpfs(uri: string): string {
  if (!uri) return ''
  const gateway = PINATA_GATEWAY.replace(/\/$/, '') + '/ipfs/'
  return uri.replace('ipfs://', gateway)
}

export function AgentMarquee() {
  const shouldReduceMotion = useReducedMotion()
  const [agents, setAgents] = useState<AgentCard[]>([])

  useEffect(() => {
    let cancelled = false
    async function loadAgents() {
      // Try to fetch up to 20 agents (token IDs 1..20) in parallel, collect those that exist
      const ids = Array.from({ length: 20 }, (_, i) => BigInt(i + 1))
      const results = await Promise.allSettled(ids.map(async (id) => {
        const meta = await fetchAgentMetadata(id)
        if (!meta) return null
        let image: string | undefined
        let category: string | undefined
        if (meta.token_uri) {
          const cid = meta.token_uri.replace('ipfs://', '')
          const ipfs = await fetchIPFSData(cid)
          if (ipfs?.image) image = resolveIpfs(ipfs.image)
          category = ipfs?.attributes?.find((a: any) => a.trait_type === 'Category')?.value
            || ipfs?.traits?.[0]
        }
        return { id: Number(id), name: meta.name || `Agent #${id}`, image, level: Number(meta.level), category } as AgentCard
      }))
      if (cancelled) return
      const valid = results
        .filter((r): r is PromiseFulfilledResult<AgentCard | null> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value!)
      if (valid.length > 0) setAgents(valid)
    }
    loadAgents()
    return () => { cancelled = true }
  }, [])

  // Duplicate for seamless loop — use mock placeholders until real data loads
  const displayAgents: AgentCard[] = agents.length >= 4
    ? [...agents, ...agents]
    : Array.from({ length: 16 }, (_, i) => ({
        id: i + 1,
        name: `Agent #${i + 1}`,
        level: (i % 20) + 1,
      }))

  const row1 = displayAgents
  const row2 = [...displayAgents].reverse()

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

        {/* Row 1 — scrolls left */}
        <div className="mb-3 sm:mb-4">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex gap-3 sm:gap-4 animate-marquee"
            style={{ width: "fit-content" }}
          >
            {row1.map((agent, i) => (
              <AgentNFTCard key={`r1-${i}`} agent={agent} />
            ))}
          </motion.div>
        </div>

        {/* Row 2 — scrolls right */}
        <div>
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex gap-3 sm:gap-4 animate-marquee"
            style={{ width: "fit-content", animationDirection: "reverse", animationDuration: "70s" }}
          >
            {row2.map((agent, i) => (
              <AgentNFTCard key={`r2-${i}`} agent={agent} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function AgentNFTCard({ agent }: { agent: AgentCard }) {
  return (
    <div className="group relative flex-shrink-0 w-44 sm:w-52 aspect-square rounded-xl overflow-hidden cursor-pointer">
      {/* Full-bleed image */}
      {agent.image ? (
        <img
          src={agent.image}
          alt={agent.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background flex items-center justify-center">
          <span className="text-4xl font-bold text-primary/40">{agent.name[0]}</span>
        </div>
      )}

      {/* Hover overlay — gradient from bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Text — only visible on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        {agent.category && (
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">{agent.category}</p>
        )}
        <p className="text-sm font-bold text-white leading-tight">{agent.name}</p>
        <p className="text-xs text-white/60 mt-0.5">Level {agent.level}</p>
      </div>
    </div>
  )
}
