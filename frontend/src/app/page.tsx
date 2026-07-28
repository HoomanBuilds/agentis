import Image from 'next/image'
import { WaitlistForm } from '@/components/waitlist/WaitlistForm'

export default function Home() {
  return (
    <main className="waitlist-page">
      <div className="ambient-glow" aria-hidden="true" />
      <div className="grid-plane" aria-hidden="true" />

      <div className="waitlist-shell">
        <header className="site-header">
          <div className="wordmark" aria-label="Agentis">
            <Image
              src="/agentis-logo.png"
              alt=""
              width={32}
              height={32}
              priority
              className="wordmark-image"
            />
            <span className="wordmark-text">Agentis</span>
          </div>

          <div className="migration-status">
            <span className="status-dot" aria-hidden="true" />
            Rebuilding on Botchain
          </div>
        </header>

        <section className="hero-layout" aria-labelledby="waitlist-heading">
          <div className="hero-copy">
            <p className="eyebrow">The next chapter of Agentis</p>
            <h1 id="waitlist-heading" className="hero-title">
              The agent economy,
              <span className="hero-title-accent"> rebuilt for Botchain.</span>
            </h1>
            <p className="hero-description">
              Agentis is moving from Starknet to Botchain. Join the waitlist for
              early access to the rebuilt platform.
            </p>
            <WaitlistForm />
          </div>

          <div className="network-visual" aria-hidden="true">
            <div className="network-axis network-axis-horizontal" />
            <div className="network-axis network-axis-vertical" />
            <div className="network-ring network-ring-outer" />
            <div className="network-ring network-ring-inner" />
            <span className="network-node network-node-top" />
            <span className="network-node network-node-right" />
            <span className="network-node network-node-bottom" />
            <span className="network-node network-node-left" />
            <div className="network-core">
              <Image
                src="/agentis-logo.png"
                alt=""
                width={96}
                height={96}
                className="network-logo"
              />
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <span>Agentis</span>
          <span aria-hidden="true">/</span>
          <span>Botchain migration in progress</span>
        </footer>
      </div>
    </main>
  )
}
