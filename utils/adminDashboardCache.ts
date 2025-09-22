import { apiService } from '@/services/api';

interface AdminDashboardData {
  users: number;
  transactions: number;
  referral: number;
  ebills_wallet_balance: string;
  total_users_balance: string;
  total_transaction_amount: string;
  total_credited_amount: string;
  total_debited_amount: string;
  total_credited_amount_today: number;
  total_debited_amount_today: number;
  total_nin: number;
  total_cac: number;
}

interface AdminUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  verification_code: string | null;
  email_verified_at: string | null;
  tpin: string;
  phone: string;
  balance: string;
  state: string;
  ipaddress: string | null;
  device: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  referral_count: number;
}

// Global cache that persists across component remounts
let adminDashboardCache: {
  dashboardData: AdminDashboardData | null;
  users: AdminUser[];
  hasFetched: boolean;
  lastAdminId: number | null;
} = {
  dashboardData: null,
  users: [],
  hasFetched: false,
  lastAdminId: null,
};

export const adminDashboardCacheUtils = {
  getDashboardData: () => adminDashboardCache.dashboardData,
  setDashboardData: (data: AdminDashboardData | null) => {
    adminDashboardCache.dashboardData = data;
  },
  getUsers: () => adminDashboardCache.users,
  setUsers: (users: AdminUser[]) => {
    adminDashboardCache.users = users;
  },
  getHasFetched: () => adminDashboardCache.hasFetched,
  setHasFetched: (fetched: boolean) => {
    adminDashboardCache.hasFetched = fetched;
  },
  getLastAdminId: () => adminDashboardCache.lastAdminId,
  setLastAdminId: (adminId: number | null) => {
    adminDashboardCache.lastAdminId = adminId;
  },
  reset: () => {
    adminDashboardCache = {
      dashboardData: null,
      users: [],
      hasFetched: false,
      lastAdminId: null,
    };
  },
  resetForNewAdmin: (adminId: number) => {
    if (adminDashboardCache.lastAdminId !== adminId) {
      adminDashboardCache = {
        dashboardData: null,
        users: [],
        hasFetched: false,
        lastAdminId: adminId,
      };
    }
  },
  refreshData: async () => {
    try {
      const [dashboardResponse, usersResponse] = await Promise.all([
        apiService.getAdminDashboard(),
        apiService.getAdminUsers()
      ]);
      
      let success = true;
      
      if (dashboardResponse.success && dashboardResponse.data) {
        adminDashboardCache.dashboardData = dashboardResponse.data;
      } else {
        success = false;
      }
      
      if (usersResponse.success && usersResponse.data) {
        adminDashboardCache.users = usersResponse.data.users;
      } else {
        success = false;
      }
      
      if (success) {
        adminDashboardCache.hasFetched = true;
      }
      
      return success;
    } catch (error) {
      console.error('Failed to refresh admin dashboard data:', error);
      return false;
    }
  },
};
