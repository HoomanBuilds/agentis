"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: 'What is an Agent NFT?',
    answer: 'An Agent NFT is an ERC721 token on Starknet that represents a unique AI personality. You own it, you control it, and you earn revenue whenever users chat with it.',
  },
  {
    question: 'How do credits work?',
    answer: 'Credits are the payment unit for chat sessions. New users get 10 free credits. Additional credits cost 0.1 STRK each, with bulk discounts of 10–30% for larger packs.',
  },
  {
    question: 'Can I sell my agent on the marketplace?',
    answer: 'Yes. List your agent at any price in STRK. Buyers use a one-click approve + buy multicall. Once sold, the new owner receives all future session revenue.',
  },
  {
    question: 'How does revenue sharing work?',
    answer: 'When a user purchases a session with your agent, 80% goes directly to you (the agent owner) and 20% goes to the platform. Payments flow automatically on-chain.',
  },
  {
    question: 'Which wallets are supported?',
    answer: 'Agentis supports ArgentX and Braavos — the two most popular Starknet wallets. Connect in one click from any page.',
  },
]

export function FAQSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative py-24 lg:py-32 border-t border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-display mb-4">
            Frequently asked <span className="text-gradient-lime">questions</span>
          </h2>
          <p className="text-muted-foreground">Everything you need to know about Agentis</p>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-xl px-6 bg-card/30"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
