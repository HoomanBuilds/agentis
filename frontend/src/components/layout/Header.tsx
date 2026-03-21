'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Home, Plus, Store, User } from 'lucide-react';
import { ConnectWalletButton } from '@/components';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Create', href: '/create', icon: Plus },
  { name: 'Marketplace', href: '/marketplace', icon: Store },
  { name: 'My Agents', href: '/profile', icon: User },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="glass-panel sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Agentis Logo" 
              className="h-10 w-auto"
              style={{ filter: 'invert(1) sepia(1) saturate(5) hue-rotate(85deg) brightness(1.2)' }}
            />
            <span className="text-xl font-semibold text-gradient">
              Agentis
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-emerald-300 bg-emerald-500/10 accent-ring'
                      : 'text-gray-400 hover:text-emerald-300 hover:bg-emerald-500/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Connect Wallet */}
          <div className="flex items-center">
            <ConnectWalletButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-emerald-500/10 py-2">
          <nav className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'text-emerald-300 bg-emerald-500/10'
                      : 'text-gray-400 hover:text-emerald-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
