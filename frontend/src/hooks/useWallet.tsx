'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getStarknet } from '@starknet-io/get-starknet-core';
import { Account, AccountInterface, RpcProvider, Contract } from 'starknet';
import { CONTRACTS, TOKEN_DECIMALS } from '@/constants/contracts';
import { formatSTRK } from '@/lib/starknet-client';

interface AvailableWallet {
  id: string;
  name: string;
  icon: string;
}

interface WalletContextType {
  isConnected: boolean;
  activeKey: string | null;
  account: AccountInterface | null;
  balance: bigint;
  formattedBalance: string;
  connect: () => Promise<boolean>;
  connectWith: (walletId: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  availableWallets: AvailableWallet[];
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<AvailableWallet[]>([]);

  const isConnected = !!activeKey && !!account;

  const fetchBalance = useCallback(async (address: string) => {
    try {
      const response = await fetch(`/api/account/balance?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data?.balance ? BigInt(data.balance) : BigInt(0));
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance(BigInt(0));
    }
  }, []);

  // Try to reconnect on mount
  useEffect(() => {
    const tryReconnect = async () => {
      try {
        const sn = getStarknet();
        const lastWallet: any = await sn.getLastConnectedWallet();
        if (lastWallet && lastWallet.isConnected && lastWallet.account) {
          const addr = lastWallet.selectedAddress || lastWallet.account.address;
          if (addr) {
            setActiveKey(addr);
            setAccount(lastWallet.account as unknown as AccountInterface);
            await fetchBalance(addr);
          }
        }
      } catch {
        // Silent reconnect failure is fine
      }
    };
    tryReconnect();
  }, [fetchBalance]);

  const enableWallet = useCallback(async (walletObj: any): Promise<boolean> => {
    console.log('[enableWallet] raw object:', walletObj);
    console.log('[enableWallet] keys:', walletObj ? Object.keys(walletObj) : 'null');
    console.log('[enableWallet] account:', walletObj?.account);
    console.log('[enableWallet] selectedAddress:', walletObj?.selectedAddress);
    console.log('[enableWallet] isConnected:', walletObj?.isConnected);
    console.log('[enableWallet] provider:', walletObj?.provider);

    const account = walletObj?.account || walletObj?.provider?.account;
    const addr = walletObj?.selectedAddress
      || walletObj?.account?.address
      || walletObj?.provider?.selectedAddress
      || walletObj?.provider?.account?.address;
    const resolvedAccount = account || (addr ? walletObj?.provider : null);

    console.log('[enableWallet] resolved addr:', addr, 'account:', resolvedAccount);

    if (resolvedAccount && addr) {
      setActiveKey(addr);
      // Wrap the wallet account with our own RpcProvider so starknet.js uses our
      // node for fee estimation — avoids ArgentX's internal RPC timing out on simulation.
      // The wallet's signTransaction is still used, so the popup still appears.
      const provider = new RpcProvider({ nodeUrl: CONTRACTS.rpcUrl });
      const wrappedAccount = new Account(provider, addr, resolvedAccount as any);
      setAccount(wrappedAccount as unknown as AccountInterface);
      await fetchBalance(addr);
      return true;
    }
    return false;
  }, [fetchBalance]);

  // connect: if multiple wallets, just surface them — caller shows picker
  const connect = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const sn = getStarknet();
      const wallets: any[] = await sn.getAvailableWallets();
      if (!wallets.length) {
        setError('No Starknet wallet found. Please install ReadyX (ArgentX) or Braavos.');
        return false;
      }
      setAvailableWallets(wallets.map((w: any) => ({ id: w.id, name: w.name, icon: w.icon })));
      // If only one wallet, connect immediately
      if (wallets.length === 1) {
        await wallets[0].enable?.({ starknetVersion: 'v5' });
        return await enableWallet(wallets[0]);
      }
      // Multiple wallets: return false to signal that picker should open
      return false;
    } catch (err: any) {
      setError(`Failed to connect: ${err?.message || String(err)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enableWallet]);

  const connectWith = useCallback(async (walletId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const sn = getStarknet();
      const wallets: any[] = await sn.getAvailableWallets();
      const target = wallets.find((w: any) => w.id === walletId);
      if (!target) { setError('Wallet not found'); return false; }

      if (walletId === 'metamask') {
        // MetaMask Snap: enable, then read from window[windowKey] for actual state
        await sn.enable(target, {} as any);
        const windowKey = target.windowKey || 'starknet_metamask';
        const snapWallet: any = (window as any)[windowKey] || target;
        console.log('[metamask] window snap wallet:', snapWallet, 'selectedAddress:', snapWallet?.selectedAddress);
        const ok = await enableWallet(snapWallet);
        if (!ok) setError('Failed to connect to wallet');
        return ok;
      } else {
        // ArgentX/ReadyX/Braavos: call enable() directly on wallet object
        await target.enable?.({ starknetVersion: 'v5' });
        const ok = await enableWallet(target);
        if (!ok) setError('Failed to connect to wallet');
        return ok;
      }
    } catch (err: any) {
      setError(`Failed to connect: ${err?.message || String(err)}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enableWallet]);

  const disconnect = useCallback(async () => {
    try {
      const sn = getStarknet();
      await sn.disconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    setActiveKey(null);
    setAccount(null);
    setBalance(BigInt(0));
  }, []);

  const refreshBalance = useCallback(async () => {
    if (activeKey) {
      await fetchBalance(activeKey);
    }
  }, [activeKey, fetchBalance]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        activeKey,
        account,
        balance,
        formattedBalance: formatSTRK(balance),
        connect,
        connectWith,
        disconnect,
        refreshBalance,
        availableWallets,
        isLoading,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
