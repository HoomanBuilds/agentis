'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, ChevronDown, Copy, LogOut, Check, ExternalLink, X, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ConnectWalletButton() {
  const { isConnected, activeKey, formattedBalance, connect, connectWith, disconnect, isLoading, error, availableWallets } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyAddress = async () => {
    if (activeKey) {
      await navigator.clipboard.writeText(activeKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && activeKey) {
    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          rounded="full"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-primary font-mono">
            {activeKey.slice(0, 6)}...{activeKey.slice(-4)}
          </span>
          <ChevronDown className={`w-4 h-4 text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-card backdrop-blur-xl border border-border shadow-2xl shadow-black/50 overflow-hidden z-50">
            <div className="p-4 border-b border-border">
              <div className="text-xs text-muted-foreground mb-1">Balance</div>
              <div className="text-xl font-bold text-foreground">
                {formattedBalance} <span className="text-primary text-sm font-normal">STRK</span>
              </div>
            </div>

            <div className="p-4 border-b border-border">
              <div className="text-xs text-muted-foreground mb-2">Wallet Address</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-muted-foreground bg-background/50 px-2 py-1.5 rounded font-mono truncate">
                  {activeKey}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-2">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <a
                href={`https://sepolia.voyager.online/contract/${activeKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </a>
              <button
                onClick={() => { disconnect(); setIsOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleConnect = async () => {
    const ok = await connect();
    if (!ok && availableWallets.length > 1) {
      setShowPicker(true);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        rounded="full"
        size="sm"
        className="gap-1.5 shadow-[0_0_20px_oklch(0.92_0.16_125_/_0.25)]"
        onClick={handleConnect}
        disabled={isLoading}
      >
        <Wallet className="w-4 h-4" />
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </Button>
      {error && <span className="text-xs text-destructive max-w-[200px] text-right">{error}</span>}

      {/* Wallet Picker Modal — rendered via portal to escape header stacking context */}
      {showPicker && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPicker(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Select Wallet</h3>
              <button onClick={() => setShowPicker(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {availableWallets.map(w => (
                <button
                  key={w.id}
                  onClick={async () => { setShowPicker(false); await connectWith(w.id); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  {w.icon && <img src={w.icon} alt={w.name} className="w-8 h-8 rounded-lg" />}
                  <span className="font-medium text-foreground">{w.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
