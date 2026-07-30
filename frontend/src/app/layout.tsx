import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { GeistPixelLine } from 'geist/font/pixel'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'IRAI Protocol | Autonomous Services Marketplace',
  description:
    'A BOT Chain marketplace where humans and agents discover callable AI services, pay per call through x402, and build verifiable reputation.',
}

export const viewport: Viewport = {
  themeColor: '#010604',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelLine.variable}`}
      >
        {children}
      </body>
    </html>
  )
}
