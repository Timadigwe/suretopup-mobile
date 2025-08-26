import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DashboardData } from '@/services/api';

interface DashboardContextType {
  dashboardData: DashboardData | null;
  setDashboardData: (data: DashboardData | null) => void;
  hasFetchedDashboard: boolean;
  setHasFetchedDashboard: (fetched: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isRefreshing: boolean;
  setIsRefreshing: (refreshing: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [hasFetchedDashboard, setHasFetchedDashboard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const value: DashboardContextType = {
    dashboardData,
    setDashboardData,
    hasFetchedDashboard,
    setHasFetchedDashboard,
    isLoading,
    setIsLoading,
    error,
    setError,
    isRefreshing,
    setIsRefreshing,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
