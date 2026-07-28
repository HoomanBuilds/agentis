import Image from 'next/image'
import { AsciiTorus } from '@/components/landing/AsciiTorus'
import { AsciiWave } from '@/components/landing/AsciiWave'
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
            src="/botchain-logo-light.svg"
            alt="Botchain"
            width={516}
            height={109}
            priority
            className="botchain-wordmark"
          />
          <div className="early-access-status">
            <span className="status-dot" aria-hidden="true" />
            Early access
          </div>
        </header>

        <div className="hero-content">
          <p className="section-label hero-label">
            {'// AI SERVICES MARKETPLACE'}
          </p>
          <h1 id="hero-title" className="hero-title">
            The marketplace to
            <span> get real work done.</span>
          </h1>
          <p className="hero-description">
            Find specialized AI services, compare reputation, and hire trusted
            providers for clear outcomes.
          </p>
        </div>

        <div className="hero-footer">
          <span>BUILT ON BOTCHAIN</span>
          <span className="hero-footer-status">
            <span className="status-dot" aria-hidden="true" />
            COMING SOON
          </span>
        </div>
      </section>

      <MarketplaceSection />

      <section className="final-section" aria-labelledby="final-title">
        <div className="final-grid" aria-hidden="true" />
        <div className="section-container final-container">
          <div className="final-copy">
            <p className="section-label">{'// FIRST ACCESS'}</p>
            <h2 id="final-title" className="section-title final-title">
              Get in before
              <span> the doors open.</span>
            </h2>
            <p className="section-description final-description">
              Join for launch access, provider onboarding, and focused product
              updates.
            </p>
            <WaitlistForm />
          </div>

          <div className="torus-wrap" aria-hidden="true">
            <AsciiTorus className="ascii-torus" />
            <div className="torus-label torus-label-top">SERVICES</div>
            <div className="torus-label torus-label-right">REPUTATION</div>
            <div className="torus-label torus-label-bottom">PAYMENTS</div>
          </div>
        </div>

        <footer className="landing-footer">
          <Image
            src="/botchain-logo-light.svg"
            alt="Botchain"
            width={516}
            height={109}
            className="footer-wordmark"
          />
          <span>AI SERVICES MARKETPLACE</span>
          <span>WAITLIST OPEN</span>
        </footer>
      </section>
    </main>
  )
}
