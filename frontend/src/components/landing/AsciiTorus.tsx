'use client'

import { useEffect, useRef } from 'react'

export function AsciiTorus({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const width = 80
    const height = 50
    const characters = '.,-~:;=!*#$@'
    const ringRadius = 1
    const centerRadius = 2
    const depth = 5
    const scale = (width * depth * 3) / (8 * (ringRadius + centerRadius))
    let animationId = 0
    let rotationX = 0
    let rotationZ = 0

    canvas.width = width * 10
    canvas.height = height * 14

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)

      const output = Array.from({ length: height }, () =>
        Array<string>(width).fill(' '),
      )
      const depthBuffer = Array.from({ length: height }, () =>
        Array<number>(width).fill(0),
      )
      const sinX = Math.sin(rotationX)
      const cosX = Math.cos(rotationX)
      const sinZ = Math.sin(rotationZ)
      const cosZ = Math.cos(rotationZ)

      for (let theta = 0; theta < 6.28; theta += 0.07) {
        const sinTheta = Math.sin(theta)
        const cosTheta = Math.cos(theta)

        for (let phi = 0; phi < 6.28; phi += 0.02) {
          const sinPhi = Math.sin(phi)
          const cosPhi = Math.cos(phi)
          const circleX = centerRadius + ringRadius * cosTheta
          const circleY = ringRadius * sinTheta
          const x =
            circleX * (cosZ * cosPhi + sinX * sinZ * sinPhi) -
            circleY * cosX * sinZ
          const y =
            circleX * (sinZ * cosPhi - sinX * cosZ * sinPhi) +
            circleY * cosX * cosZ
          const z = depth + cosX * circleX * sinPhi + circleY * sinX
          const inverseDepth = 1 / z
          const screenX = Math.floor(width / 2 + scale * inverseDepth * x)
          const screenY = Math.floor(
            height / 2 - scale * inverseDepth * y * 0.5,
          )
          const luminance =
            cosPhi * cosTheta * sinZ -
            cosX * cosTheta * sinPhi -
            sinX * sinTheta +
            cosZ * (cosX * sinTheta - cosTheta * sinX * sinPhi)

          if (
            luminance > 0 &&
            screenX >= 0 &&
            screenX < width &&
            screenY >= 0 &&
            screenY < height &&
            inverseDepth > depthBuffer[screenY][screenX]
          ) {
            depthBuffer[screenY][screenX] = inverseDepth
            output[screenY][screenX] =
              characters[
                Math.min(
                  Math.floor(luminance * 8),
                  characters.length - 1,
                )
              ]
          }
        }
      }

      context.font = '12px JetBrains Mono, Geist Mono, monospace'
      output.forEach((row, y) => {
        row.forEach((character, x) => {
          if (character === ' ') return

          const luminance = characters.indexOf(character) / characters.length
          const alpha = 0.28 + luminance * 0.72
          context.fillStyle = `oklch(${0.48 + luminance * 0.28} 0.19 166 / ${alpha})`
          context.fillText(character, x * 10, y * 14 + 14)
        })
      })

      if (!reducedMotion.matches) {
        rotationX += 0.035
        rotationZ += 0.018
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
