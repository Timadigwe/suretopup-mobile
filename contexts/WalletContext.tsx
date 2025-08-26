import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WalletContextType {
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [showBalance, setShowBalance] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved wallet balance visibility state on app startup
  useEffect(() => {
    const loadWalletBalanceState = async () => {
      try {
        const savedShowBalance = await AsyncStorage.getItem('wallet_show_balance');
        if (savedShowBalance !== null) {
          setShowBalance(JSON.parse(savedShowBalance));
        }
      } catch (error) {
        // If there's an error loading, default to showing balance
        setShowBalance(true);
      } finally {
        setIsInitialized(true);
      }
    };

    loadWalletBalanceState();
  }, []);

  // Save wallet balance visibility state whenever it changes
  const handleSetShowBalance = async (show: boolean) => {
    try {
      setShowBalance(show);
      await AsyncStorage.setItem('wallet_show_balance', JSON.stringify(show));
    } catch (error) {
      // If saving fails, still update the state
      setShowBalance(show);
    }
  };

  const value = {
    showBalance,
    setShowBalance: handleSetShowBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

