import { HeroSection } from '@/components/home/HeroSection'
import { TrustBar } from '@/components/home/TrustBar'
import { DemoCards } from '@/components/home/DemoCards'
import { HowItWorks } from '@/components/home/HowItWorks'
import { AgentMarquee } from '@/components/home/AgentMarquee'
import { StatsSection } from '@/components/home/StatsSection'
import { PricingSection } from '@/components/home/PricingSection'
import { FAQSection } from '@/components/home/FAQSection'
import { FinalCTA } from '@/components/home/FinalCTA'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function Home() {
  return (
    <main className="relative z-0 min-h-screen bg-background overflow-x-hidden">
      {/* Corner glow */}
      <div
        className="absolute top-0 right-0 w-[1500px] h-[1500px] -z-10 bg-primary pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse 50% 50% at 100% 0%, rgb(0 0 0 / 0.75), transparent)' }}
      >
        <div className="absolute inset-0 bg-cover bg-right-top" style={{ backgroundImage: "url('/grade.png')" }} />
      </div>
      <Header />
      <HeroSection />
      <TrustBar />
      <DemoCards />
      <HowItWorks />
      <AgentMarquee />
      <StatsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </main>
  )
}
