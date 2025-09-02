import { DashboardData } from '@/services/api';

// Global cache that persists across component remounts
let dashboardCache: {
  data: DashboardData | null;
  hasFetched: boolean;
  lastUserId: number | null;
} = {
  data: null,
  hasFetched: false,
  lastUserId: null,
};

export const dashboardCacheUtils = {
  getData: () => dashboardCache.data,
  setData: (data: DashboardData | null) => {
    dashboardCache.data = data;
  },
  getHasFetched: () => dashboardCache.hasFetched,
  setHasFetched: (fetched: boolean) => {
    dashboardCache.hasFetched = fetched;
  },
  getLastUserId: () => dashboardCache.lastUserId,
  setLastUserId: (userId: number | null) => {
    dashboardCache.lastUserId = userId;
  },
  reset: () => {
    dashboardCache = {
      data: null,
      hasFetched: false,
      lastUserId: null,
    };
  },
  resetForNewUser: (userId: number) => {
    if (dashboardCache.lastUserId !== userId) {
      dashboardCache = {
        data: null,
        hasFetched: false,
        lastUserId: userId,
      };
    }
  },
  refreshData: async () => {
    try {
      // Import apiService dynamically to avoid circular dependencies
      const { apiService } = await import('@/services/api');
      const response = await apiService.getDashboard();
      
      if (response.success && response.data) {
        dashboardCache.data = response.data;
        dashboardCache.hasFetched = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
      return false;
    }
  },
};
