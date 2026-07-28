'use client'

import { useEffect, useRef } from 'react'

export function AsciiWave({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const characters = '█▓▒░ '
    const width = 120
    const height = 40
    let animationId = 0
    let time = 0

    canvas.width = width * 8
    canvas.height = height * 12

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.font = '12px JetBrains Mono, Geist Mono, monospace'

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const waveOne =
            Math.sin(x * 0.08 + time) * Math.cos(y * 0.12 + time * 0.5)
          const waveTwo =
            Math.sin(x * 0.05 - time * 0.7) *
            Math.sin(y * 0.08 + time * 0.3)
          const waveThree = Math.cos(x * 0.03 + y * 0.03 + time * 0.4)
          const normalized = ((waveOne + waveTwo + waveThree) / 3 + 1) / 2
          const character =
            characters[Math.floor(normalized * (characters.length - 1))]

          if (character !== ' ') {
            const hue = 160 + normalized * 28
            const lightness = 0.46 + normalized * 0.28
            context.fillStyle = `oklch(${lightness} 0.17 ${hue} / ${0.24 + normalized * 0.68})`
            context.fillText(character, x * 8, y * 12 + 12)
          }
        }
      }

      if (!reducedMotion.matches) {
        time += 0.025
        animationId = requestAnimationFrame(draw)
      }
    }

    draw()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
