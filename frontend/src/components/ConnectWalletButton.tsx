'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, ChevronDown, Copy, LogOut, Check, ExternalLink } from 'lucide-react';

export function ConnectWalletButton() {
  const { isConnected, activeKey, formattedBalance, connect, disconnect, isLoading, error } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  // Connected state - dropdown button
  if (isConnected && activeKey) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all duration-200"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-sm font-medium text-emerald-300 font-mono">
            {activeKey.slice(0, 6)}...{activeKey.slice(-4)}
          </span>
          <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-black/50 overflow-hidden z-50">
            {/* Balance Section */}
            <div className="p-4 border-b border-emerald-500/10">
              <div className="text-xs text-gray-400 mb-1">Balance</div>
              <div className="text-xl font-bold text-white">
                {formattedBalance} <span className="text-emerald-400 text-sm font-normal">STRK</span>
              </div>
            </div>

            {/* Address Section */}
            <div className="p-4 border-b border-emerald-500/10">
              <div className="text-xs text-gray-400 mb-2">Wallet Address</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-gray-300 bg-black/30 px-2 py-1.5 rounded font-mono truncate">
                  {activeKey}
                </code>
                <button
                  onClick={copyAddress}
                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-emerald-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              <a
                href={`https://sepolia.voyager.online/contract/${activeKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on Explorer
              </a>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
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

  // Disconnected state - connect button
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={connect}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-400 hover:to-lime-400 text-black font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
      >
        <Wallet className="w-4 h-4" />
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
