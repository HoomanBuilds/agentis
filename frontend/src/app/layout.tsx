import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, PT_Mono } from 'next/font/google'
import './globals.css'
import { WalletProvider } from '@/hooks/useWallet'
import QueryProvider from '@/providers/QueryProvider'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const ptMono = PT_Mono({ weight: '400', subsets: ['latin'], variable: '--font-pt-mono' })

export const metadata: Metadata = {
  title: 'Agentis — AI Agent NFTs on Starknet',
  description: 'Create, own, and trade AI agents as NFTs. Each agent has a unique personality and earns revenue for its creator.',
}

export const viewport: Viewport = {
  themeColor: '#141414',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${ptMono.variable}`}>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <QueryProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
