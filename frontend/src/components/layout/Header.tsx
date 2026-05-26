'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

const navLinks = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/create', label: 'Create' },
  { href: '/agents', label: 'Agents' },
  { href: '/profile', label: 'Profile' },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto max-w-6xl px-2 sm:px-4 lg:px-8 py-4" aria-label="Main navigation">
        <div className="flex h-14 items-center justify-between bg-background/60 backdrop-blur-xl border border-border/50 rounded-full px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="Agentis home">
            <Image src="/agentis-logo.png" alt="Agentis" width={28} height={28} className="w-6 sm:w-7 h-6 sm:h-7" />
            <span
              className="font-[family-name:var(--font-pt-mono)] font-bold text-base sm:text-lg text-foreground"
              style={{ letterSpacing: '-0.05em' }}
            >
              Agentis
            </span>
          </Link>

          {/* Desktop Navigation - hidden below lg */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors ${
                    isActive
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Buttons - hidden below lg */}
          <div className="hidden lg:flex items-center gap-3">
            <ConnectWalletButton />
          </div>

          {/* Mobile Menu Button - visible below lg */}
          <button
            type="button"
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile Menu - visible below lg */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 top-0 left-0 w-dvw h-dvh bg-background z-40 flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-background border-b border-border/50">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Image src="/agentis-logo.png" alt="Agentis" width={24} height={24} className="w-6 h-6" />
                  <span
                    className="font-[family-name:var(--font-pt-mono)] font-bold text-base text-foreground"
                    style={{ letterSpacing: '-0.05em' }}
                  >
                    Agentis
                  </span>
                </Link>
                <button
                  type="button"
                  className="p-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`block px-4 py-3 text-base rounded-lg transition-colors hover:bg-foreground/10 ${
                        isActive
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="px-6 py-4 border-t border-border/50 bg-background flex flex-col gap-3">
                <ConnectWalletButton />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
