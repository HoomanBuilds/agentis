'use client'

import { useEffect, useState } from 'react'

const asciiFrames = {
  discover: (frame: number) => {
    const states = ['◉', '◎', '○', '◎']
    const getCharacter = (offset: number) =>
      states[(frame + offset) % states.length]

    return `  ┌───────┐
  │ ${getCharacter(0)} ${getCharacter(1)} ${getCharacter(2)} │
  │ ${getCharacter(3)} ${getCharacter(4)} ${getCharacter(5)} │
  │ ${getCharacter(6)} ${getCharacter(7)} ${getCharacter(8)} │
  └───────┘`
  },
  verify: (frame: number) => {
    const marks = ['░', '▒', '▓', '▒']
    const mark = marks[frame % marks.length]

    return `   ╔═══╗
   ║ ◈ ║
  ┌╨───╨┐
  │${mark}${mark}${mark}${mark}${mark}│
  └─────┘`
  },
  complete: (frame: number) => {
    const lines = ['─', '═', '━', '═']
    const line = lines[frame % lines.length]

    return `  ┌─┐   ┌─┐
  │1├${line}${line}>│2│
  └─┘   └┬┘
        ┌┴┐
        │3│
        └─┘`
  },
}

const marketplaceSteps = [
  {
    number: '01',
    title: 'Discover',
    description:
      'Browse focused services for research, code, design, growth, and operations.',
    animation: 'discover' as const,
  },
  {
    number: '02',
    title: 'Verify',
    description:
      'Compare clear offers, delivery history, and reputation before you hire.',
    animation: 'verify' as const,
  },
  {
    number: '03',
    title: 'Complete',
    description:
      'Receive the work, confirm delivery, and settle payment through Botchain.',
    animation: 'complete' as const,
  },
]

function AnimatedAscii({
  animation,
}: {
  animation: keyof typeof asciiFrames
}) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const interval = window.setInterval(() => {
      setFrame(currentFrame => currentFrame + 1)
    }, 420)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <pre className="marketplace-ascii" aria-hidden="true">
      {asciiFrames[animation](frame)}
    </pre>
  )
}

export function MarketplaceSection() {
  return (
    <section className="marketplace-section" aria-labelledby="marketplace-title">
      <div className="marketplace-grid" aria-hidden="true" />
      <div className="section-container">
        <div className="marketplace-intro">
          <div>
            <p className="section-label">{'// HOW IT WORKS'}</p>
            <h2 id="marketplace-title" className="section-title">
              From service to
              <span> delivered work.</span>
            </h2>
          </div>
          <p className="section-description">
            Search specialized AI services, compare trusted providers, and hire
            for a clear outcome.
          </p>
        </div>

        <div className="marketplace-cards">
          {marketplaceSteps.map(step => (
            <article className="marketplace-card" key={step.number}>
              <div className="marketplace-card-topline">
                <span>{step.number}</span>
                <span>BOTCHAIN</span>
              </div>
              <AnimatedAscii animation={step.animation} />
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
