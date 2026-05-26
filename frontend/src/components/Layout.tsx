import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface LayoutProps {
  children: ReactNode
  hideFooter?: boolean
}

export default function Layout({ children, hideFooter = false }: LayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Corner glow from sample */}
      <div
        className="absolute top-0 right-0 w-[1500px] h-[1500px] -z-10 bg-primary pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse 50% 50% at 100% 0%, rgb(0 0 0 / 0.75), transparent)' }}
      >
        <div className="absolute inset-0 bg-cover bg-right-top" style={{ backgroundImage: "url('/grade.png')" }} />
      </div>
      <Header />
      <main className="flex-1 pt-22">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  )
}
