import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeArea } from '@/hooks/useSafeArea';
import { apiService } from '@/services/api';
import { adminDashboardCacheUtils } from '@/utils/adminDashboardCache';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigate?: (screen: string, data?: any) => void;
  adminData?: {
    id: number;
    username: string;
    status: string;
    created_at: string;
    updated_at: string;
  } | null;
}

interface DashboardData {
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

interface User {
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onNavigate, adminData }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { admin, logout } = useAuth();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [dashboardError, setDashboardError] = useState(false);
  const [usersError, setUsersError] = useState(false);

  const handleLogout = async () => {
    triggerHapticFeedback('light');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            onLogout();
          },
        },
      ]
    );
  };

  const loadData = async (isRefresh = false) => {
    // Check if we need to reset cache for new admin
    if (admin?.id) {
      adminDashboardCacheUtils.resetForNewAdmin(admin.id);
    }

    // If we have cached data and it's not a refresh, use cached data
    if (!isRefresh && adminDashboardCacheUtils.getHasFetched()) {
      const cachedDashboardData = adminDashboardCacheUtils.getDashboardData();
      const cachedUsers = adminDashboardCacheUtils.getUsers();
      
      if (cachedDashboardData) {
        setDashboardData(cachedDashboardData);
      }
      if (cachedUsers.length > 0) {
        setUsers(cachedUsers);
      }
      return;
    }

    // If it's a refresh or no cached data, fetch from API
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const success = await adminDashboardCacheUtils.refreshData();
      
      if (success) {
        const cachedDashboardData = adminDashboardCacheUtils.getDashboardData();
        const cachedUsers = adminDashboardCacheUtils.getUsers();
        
        if (cachedDashboardData) {
          setDashboardData(cachedDashboardData);
        }
        if (cachedUsers.length > 0) {
          setUsers(cachedUsers);
        }
        setDashboardError(false);
        setUsersError(false);
      } else {
        setDashboardError(true);
        setUsersError(true);
      }
    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      setDashboardError(true);
      setUsersError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    await loadData(true);
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₦${numAmount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const adminStats = dashboardData ? [
    {
      title: 'Total Users',
      value: dashboardData.users.toString(),
      icon: 'people',
      color: colors.primary,
    },
    {
      title: 'Total Transactions',
      value: dashboardData.transactions.toString(),
      icon: 'card',
      color: colors.success,
    },
    {
      title: 'Total Revenue',
      value: formatAmount(dashboardData.total_transaction_amount),
      icon: 'cash',
      color: colors.warning,
    },
    {
      title: 'Users Balance',
      value: formatAmount(dashboardData.total_users_balance),
      icon: 'wallet',
      color: colors.primary,
    },
    {
      title: 'Credited Today',
      value: formatAmount(dashboardData.total_credited_amount_today),
      icon: 'trending-up',
      color: colors.success,
    },
    {
      title: 'Debited Today',
      value: formatAmount(dashboardData.total_debited_amount_today),
      icon: 'trending-down',
      color: colors.destructive,
    },
  ] : [];

  const quickActions = [
    {
      title: 'View Users',
      icon: 'people',
      color: colors.primary,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('admin-users');
        } else {
          setShowUsers(!showUsers);
        }
      },
    },
    {
      title: 'Bulk Email',
      icon: 'mail',
      color: colors.success,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('bulk-email');
        }
      },
    },
    {
      title: 'Data Variations',
      icon: 'cellular',
      color: colors.primary,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('data-variations');
        }
      },
    },
    {
      title: 'Cable Variations',
      icon: 'tv',
      color: colors.warning,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('cable-variations');
        }
      },
    },
    {
      title: 'Transaction History',
      icon: 'list',
      color: colors.warning,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('admin-transactions');
        }
      },
    },
    {
      title: 'CAC Submissions',
      icon: 'business',
      color: colors.primary,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('admin-other-services', { initialTab: 'cac' });
        }
      },
    },
    {
      title: 'NIN Submissions',
      icon: 'finger-print',
      color: colors.success,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('admin-other-services', { initialTab: 'nin' });
        }
      },
    },
    {
      title: 'Slip Types',
      icon: 'document',
      color: colors.mutedForeground,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('admin-slip-types');
        }
      },
    },
    {
      title: 'Other Services',
      icon: 'settings',
      color: colors.primary,
      onPress: () => {
        triggerHapticFeedback('light');
        if (onNavigate) {
          onNavigate('admin-other-services');
        }
      },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: safeAreaTop + 20 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
              Welcome back,
            </Text>
            <Text style={[styles.adminName, { color: colors.text }]}>
              {admin?.username || 'Admin'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { backgroundColor: colors.destructive + '20' }]}
          >
            <Ionicons name="log-out" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading dashboard...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
        >
        {/* Overview Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
          {dashboardError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color={colors.mutedForeground} />
              <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
                Unable to load statistics
              </Text>
              <TouchableOpacity
                onPress={() => loadData(true)}
                style={[styles.retryButton, { backgroundColor: colors.primary + '20' }]}
              >
                <Text style={[styles.retryButtonText, { color: colors.primary }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.overviewContent}>
              <View style={styles.overviewHeader}>
                <Text style={[styles.overviewTitle, { color: colors.text }]}>Overview</Text>
                <Text style={[styles.overviewSubtitle, { color: colors.mutedForeground }]}>
                  Key metrics at a glance
                </Text>
              </View>

              <View style={styles.overviewGrid}>
                <View style={[styles.overviewItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.overviewItemHeader}>
                    <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Total Users</Text>
                    <View style={[styles.overviewIcon, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name="people" size={16} color={colors.primary} />
                    </View>
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {dashboardData?.users || 0}
                  </Text>
                </View>
                <View style={[styles.overviewItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.overviewItemHeader}>
                    <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Transactions</Text>
                    <View style={[styles.overviewIcon, { backgroundColor: colors.success + '10' }]}>
                      <Ionicons name="card" size={16} color={colors.success} />
                    </View>
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {dashboardData?.transactions || 0}
                  </Text>
                </View>
                <View style={[styles.overviewItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.overviewItemHeader}>
                    <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Wallet</Text>
                    <View style={[styles.overviewIcon, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name="wallet" size={16} color={colors.primary} />
                    </View>
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {dashboardData ? formatAmount(dashboardData.ebills_wallet_balance) : '₦0'}
                  </Text>
                </View>
                <View style={[styles.overviewItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.overviewItemHeader}>
                    <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Total Revenue</Text>
                    <View style={[styles.overviewIcon, { backgroundColor: colors.warning + '10' }]}>
                      <Ionicons name="trending-up" size={16} color={colors.warning} />
                    </View>
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {dashboardData ? formatAmount(dashboardData.total_transaction_amount) : '₦0'}
                  </Text>
                </View>
                <View style={[styles.overviewItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.overviewItemHeader}>
                    <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>User Balances</Text>
                    <View style={[styles.overviewIcon, { backgroundColor: colors.primary + '10' }]}>
                      <Ionicons name="people-circle" size={16} color={colors.primary} />
                    </View>
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {dashboardData ? formatAmount(dashboardData.total_users_balance) : '₦0'}
                  </Text>
                </View>
                <View style={[styles.overviewItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.overviewItemHeader}>
                    <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Total Credited</Text>
                    <View style={[styles.overviewIcon, { backgroundColor: colors.success + '10' }]}>
                      <Ionicons name="arrow-up-circle" size={16} color={colors.success} />
                    </View>
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {dashboardData ? formatAmount(dashboardData.total_credited_amount) : '₦0'}
                  </Text>
                </View>
                <View style={[styles.overviewItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.overviewItemHeader}>
                    <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Total Debited</Text>
                    <View style={[styles.overviewIcon, { backgroundColor: colors.destructive + '10' }]}>
                      <Ionicons name="arrow-down-circle" size={16} color={colors.destructive} />
                    </View>
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {dashboardData ? formatAmount(dashboardData.total_debited_amount) : '₦0'}
                  </Text>
                </View>
                <View style={[styles.overviewItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.overviewItemHeader}>
                    <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>Documents</Text>
                    <View style={[styles.overviewIcon, { backgroundColor: colors.mutedForeground + '10' }]}>
                      <Ionicons name="document-text" size={16} color={colors.mutedForeground} />
                    </View>
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.text }]}>
                    {(dashboardData?.total_nin || 0) + (dashboardData?.total_cac || 0)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { backgroundColor: colors.card }]}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: action.color + '10' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Users List */}
        {showUsers && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Users {usersError ? '(Error)' : `(${users.length})`}
              </Text>
              <TouchableOpacity
                onPress={() => setShowUsers(false)}
                style={[styles.closeButton, { backgroundColor: colors.mutedForeground + '20' }]}
              >
                <Ionicons name="close" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={[styles.usersCard, { backgroundColor: colors.card }]}>
              {usersError ? (
                <View style={styles.usersErrorContainer}>
                  <View style={[styles.usersErrorIcon, { backgroundColor: colors.destructive + '15' }]}>
                    <Ionicons name="alert-circle" size={24} color={colors.destructive} />
                  </View>
                  <Text style={[styles.usersErrorTitle, { color: colors.text }]}>No Users Data Found</Text>
                  <Text style={[styles.usersErrorMessage, { color: colors.mutedForeground }]}>
                    Unable to load users list. Please try again.
                  </Text>
                  <TouchableOpacity
                    onPress={() => loadData(true)}
                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.retryButtonText, { color: 'white' }]}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                users.map((user) => (
                  <View key={user.id} style={styles.userItem}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.primary + '15' }]}>
                      <Text style={[styles.userInitials, { color: colors.primary }]}>
                        {user.firstname.charAt(0)}{user.lastname.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.text }]}>
                        {user.firstname} {user.lastname}
                      </Text>
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                        {user.email}
                      </Text>
                      <View style={styles.userDetails}>
                        <Text style={[styles.userBalance, { color: colors.success }]}>
                          Balance: {formatAmount(user.balance)}
                        </Text>
                        <Text style={[styles.userStatus, { 
                          color: user.status === 'active' ? colors.success : colors.destructive 
                        }]}>
                          {user.status}
                        </Text>
                      </View>
                      <Text style={[styles.userDate, { color: colors.mutedForeground }]}>
                        Joined: {formatDate(user.created_at)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Detailed Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detailed Statistics</Text>
          <View style={styles.detailedStatsContainer}>
            <View style={[styles.detailedStatCard, { backgroundColor: colors.card }]}>
              <View style={styles.detailedStatHeader}>
                <Ionicons name="trending-up" size={20} color={colors.success} />
                <Text style={[styles.detailedStatTitle, { color: colors.text }]}>Revenue</Text>
              </View>
              <Text style={[styles.detailedStatValue, { color: colors.text }]}>
                {dashboardData ? formatAmount(dashboardData.total_transaction_amount) : '₦0'}
              </Text>
              <Text style={[styles.detailedStatSubtitle, { color: colors.mutedForeground }]}>
                Total transaction amount
              </Text>
            </View>
            
            <View style={[styles.detailedStatCard, { backgroundColor: colors.card }]}>
              <View style={styles.detailedStatHeader}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
                <Text style={[styles.detailedStatTitle, { color: colors.text }]}>User Balances</Text>
              </View>
              <Text style={[styles.detailedStatValue, { color: colors.text }]}>
                {dashboardData ? formatAmount(dashboardData.total_users_balance) : '₦0'}
              </Text>
              <Text style={[styles.detailedStatSubtitle, { color: colors.mutedForeground }]}>
                Combined user balances
              </Text>
            </View>
          </View>
        </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroCard: {
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  overviewContent: {
    gap: 16,
  },
  overviewHeader: {
    gap: 4,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  overviewSubtitle: {
    fontSize: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  overviewItem: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  overviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  overviewIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewLabel: {
    fontSize: 12,
    marginBottom: 0,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  heroStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
    textAlign: 'center',
  },
  heroStatLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 12,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginVertical: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailedStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailedStatCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailedStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailedStatTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailedStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailedStatSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  usersCard: {
    borderRadius: 16,
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userBalance: {
    fontSize: 12,
    fontWeight: '500',
  },
  userStatus: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  userDate: {
    fontSize: 11,
  },
  errorCard: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },

  usersErrorContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  usersErrorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  usersErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  usersErrorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
});

export default AdminDashboard;
