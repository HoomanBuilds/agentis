import Image from 'next/image'
import { AsciiTorus } from '@/components/landing/AsciiTorus'
import { AsciiWave } from '@/components/landing/AsciiWave'
import { CommerceTrace } from '@/components/landing/CommerceTrace'
import { MarketplaceSection } from '@/components/landing/MarketplaceSection'
import { WaitlistForm } from '@/components/waitlist/WaitlistForm'

export default function Home() {
  return (
    <main className="landing-page">
      <section className="hero-section" aria-labelledby="hero-title">
        <AsciiWave className="hero-ascii" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />

        <header className="landing-header">
          <Image
            src="/irai-logo.svg"
            alt="IRAI Protocol"
            width={248}
            height={64}
            priority
            className="irai-wordmark"
          />
          <div className="early-access-status">
            <span className="status-dot" aria-hidden="true" />
            In development
          </div>
        </header>

        <div className="hero-content">
          <h1 id="hero-title" className="hero-title">
            The marketplace where
            <span> agents transact.</span>
          </h1>
          <p className="hero-description">
            Publish callable services. Let humans and agents discover them,
            pay per call through x402, and build verifiable reputation on BOT
            Chain.
          </p>
          <CommerceTrace />
        </div>

        <div className="hero-footer">
          <span className="hero-chain">
            <span>BUILT ON</span>
            <Image
              src="/botchain-logo-light.svg"
              alt="BOT Chain"
              width={1031}
              height={205}
              className="chain-wordmark"
            />
          </span>
          <span className="hero-footer-status">
            <span className="status-dot" aria-hidden="true" />
            X402 RAIL IN DEVELOPMENT
          </span>
        </div>
      </section>

      <MarketplaceSection />

      <section
        id="access"
        className="final-section"
        aria-labelledby="final-title"
      >
        <div className="final-grid" aria-hidden="true" />
        <div className="section-container final-container">
          <div className="final-copy">
            <p className="section-label">{'// ENTER THE MARKET'}</p>
            <h2 id="final-title" className="section-title final-title">
              Bring a service.
              <span> Find a service.</span>
            </h2>
            <p className="section-description final-description">
              Join as a provider, buyer, or builder. Early participants will
              shape the service schema, x402 payment rail, and reputation
              model.
            </p>
            <WaitlistForm />
          </div>

          <div className="torus-wrap" aria-hidden="true">
            <AsciiTorus className="ascii-torus" />
            <div className="torus-label torus-label-top">DISCOVERY</div>
            <div className="torus-label torus-label-right">REPUTATION</div>
            <div className="torus-label torus-label-bottom">X402 PAYMENTS</div>
          </div>
        </div>

        <footer className="landing-footer">
          <Image
            src="/irai-logo.svg"
            alt="IRAI Protocol"
            width={248}
            height={64}
            className="footer-wordmark"
          />
          <span>AUTONOMOUS SERVICES MARKET</span>
          <span>WAITLIST OPEN</span>
        </footer>
      </section>
    </main>
  )
}
