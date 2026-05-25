'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getStarknet } from '@starknet-io/get-starknet-core';
import { AccountInterface, RpcProvider, Contract } from 'starknet';
import { CONTRACTS, TOKEN_DECIMALS } from '@/constants/contracts';
import { formatSTRK } from '@/lib/starknet-client';

interface WalletContextType {
  isConnected: boolean;
  activeKey: string | null;
  account: AccountInterface | null;
  balance: bigint;
  formattedBalance: string;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
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

  const connect = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const sn = getStarknet();
      const availableWallets = await sn.getAvailableWallets();

      if (!availableWallets.length) {
        setError('No Starknet wallet found. Please install ArgentX or Braavos.');
        return false;
      }

      const wallet: any = await sn.enable(availableWallets[0], { starknetVersion: 'v5' } as any);

      if (wallet && wallet.isConnected && wallet.account) {
        const addr = wallet.selectedAddress || wallet.account.address;
        if (addr) {
          setActiveKey(addr);
          setAccount(wallet.account as unknown as AccountInterface);
          await fetchBalance(addr);
          return true;
        }
      }

      setError('Failed to connect to wallet');
      return false;
    } catch (err) {
      setError('Failed to connect to wallet');
      console.error('Connection error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBalance]);

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
        disconnect,
        refreshBalance,
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
