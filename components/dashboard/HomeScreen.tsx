import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeArea } from '@/hooks/useSafeArea';
import { dashboardCacheUtils } from '@/utils/dashboardCache';
import { BottomTabNavigator } from '@/components/navigation/BottomTabNavigator';
import { WalletBalanceCard } from './WalletBalanceCard';
import { ServiceGrid } from './ServiceGrid';
import { PromoCarousel } from './PromoCarousel';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

import { apiService, DashboardData } from '@/services/api';

interface HomeScreenProps {
  onNavigate: (page: string, data?: any) => void;
  onLogout: () => void;
}

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onLogout,
}) => {
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [lastUserId, setLastUserId] = useState<number | null>(null);

  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user, token, logout, onLoginSuccess } = useAuth();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  // Use cache for persistent state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(dashboardCacheUtils.getData());
  const [hasFetchedDashboard, setHasFetchedDashboard] = useState(dashboardCacheUtils.getHasFetched());
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const userName = dashboardData?.user?.fullname || (user ? `${user.firstname} ${user.lastname}` : "User");
  const walletBalance = dashboardData?.user?.balance ? parseFloat(dashboardData.user.balance) : 0;

  const handleServiceClick = (serviceId: string) => {
    triggerHapticFeedback('light');
    onNavigate(serviceId);
  };


  // Handle transaction press to navigate to receipt
  const handleTransactionPress = (transaction: any) => {
    triggerHapticFeedback('light');
    
    // Use the network field directly from transaction data
    let network = transaction.network;
    const service = transaction.service?.toLowerCase() || '';
    const info = transaction.info?.toLowerCase() || '';
    
    // If no network field, try to extract from service name or info for airtime/data/card printing
    if (!network && (service.includes('airtime') || service.includes('data') || service.includes('card print'))) {
      if (service.includes('mtn') || info.includes('mtn')) network = 'mtn';
      else if (service.includes('airtel') || info.includes('airtel')) network = 'airtel';
      else if (service.includes('glo') || info.includes('glo')) network = 'glo';
      else if (service.includes('9mobile') || service.includes('etisalat') || info.includes('9mobile') || info.includes('etisalat')) network = '9mobile';
    }
    
    // Navigate to receipt screen with transaction data
    onNavigate('receipt', {
      reference: transaction.ref,
      amount: parseFloat(transaction.amount),
      service: transaction.service,
      date: transaction.created_at,
      businessName: 'SureTopUp',
      // Network information for airtime/data/card printing
      network: network,
      // Additional transaction details
      transactionId: transaction.id,
      type: transaction.type,
      status: transaction.status,
      oldBalance: transaction.old_balance,
      newBalance: transaction.new_balance,
      info: transaction.info,
      // Transaction history metadata
      metadata: transaction.metadata,
    });
  };

  // Fetch dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setDashboardLoading(true);
      }
      setDashboardError(null);
      
      const response = await apiService.getDashboard();
      
      if (response.success && response.data) {
        //console.log('Dashboard Data After Refresh:', JSON.stringify(response.data, null, 2));
        setDashboardData(response.data);
        dashboardCacheUtils.setData(response.data);
        setHasInitialLoad(true);
        setHasFetchedDashboard(true);
        dashboardCacheUtils.setHasFetched(true);
      } else if (response.isTokenExpired) {
        // Clear cache and let AuthContext handle the logout
        dashboardCacheUtils.reset();
        setDashboardData(null);
        setHasFetchedDashboard(false);
        setHasInitialLoad(false);
      } else {
        setDashboardError(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      setDashboardError('Network error. Please try again.');
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setDashboardLoading(false);
      }
    }
  };

  // Handle pull to refresh
  const handleRefresh = async () => {
    // Force refresh by clearing cache temporarily
    const currentData = dashboardCacheUtils.getData();
    dashboardCacheUtils.reset();
    await fetchDashboardData(true);
    // Restore cache if refresh fails
    if (!dashboardData) {
      dashboardCacheUtils.setData(currentData);
    }
  };

  useEffect(() => {
    // Check if user has changed (new login)
    if (user && user.id !== lastUserId) {
      if (__DEV__) {
        console.log('HomeScreen: New user detected, resetting cache for user ID:', user.id);
      }
      setLastUserId(user.id);
      setHasInitialLoad(false);
      dashboardCacheUtils.resetForNewUser(user.id);
      setHasFetchedDashboard(false);
      setDashboardData(null);
      setDashboardError(null);
    }
  }, [user, lastUserId]);

  useEffect(() => {
    // Only fetch data if we haven't fetched it before AND we have a user/token
    const cachedHasFetched = dashboardCacheUtils.getHasFetched();
    if (__DEV__) {
      console.log('HomeScreen: useEffect triggered', {
        cachedHasFetched,
        hasUser: !!user,
        hasToken: !!token,
        userId: user?.id
      });
    }
    if (!cachedHasFetched && user && token) {
      if (__DEV__) {
        console.log('HomeScreen: Fetching dashboard data for new user');
      }
      fetchDashboardData();
    } else if (cachedHasFetched) {
      // Restore cached data
      const cachedData = dashboardCacheUtils.getData();
      if (cachedData) {
        setDashboardData(cachedData);
        setHasFetchedDashboard(true);
        setHasInitialLoad(true);
      }
    } else if (!user || !token) {
    }
  }, [user, token]);

  const handleAddFunds = () => {
    triggerHapticFeedback('light');
    onNavigate('add-funds');
  };

  // Show inline skeletons for dynamic data while loading
  const showSkeleton = dashboardLoading && !hasInitialLoad;

  // Show error state
  if (dashboardError) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card + 'F5' }]}>
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person-circle" size={24} color="white" />
              </View>
              <View style={styles.userText}>
                <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                  Welcome
                </Text>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {userName}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Oops!</Text>
          <Text style={[styles.errorMessage, { color: colors.mutedForeground }]}>{dashboardError}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setDashboardLoading(true);
              setDashboardError(null);
              fetchDashboardData();
            }}
          >
            <Text style={[styles.retryButtonText, { color: colors.background }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card + 'F5', paddingTop: safeAreaTop + 20 }]}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Ionicons name="person-circle" size={24} color="white" />
            </View>
            <View style={styles.userText}>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                Welcome
              </Text>
              {showSkeleton ? (
                <SkeletonLoader width={120} height={18} />
              ) : (
                <Text style={[styles.userName, { color: colors.text }]}>
                  {userName}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => onNavigate('notifications')}
              style={styles.headerButton}
            >
              <Ionicons name="notifications" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigate('profile')}
              style={styles.headerButton}
            >
              <Ionicons name="settings" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Wallet Balance */}
        <View style={styles.walletSection}>
          <WalletBalanceCard 
            balance={walletBalance}
            onAddFunds={handleAddFunds}
            showSkeleton={showSkeleton}
          />
        </View>

        {/* Service Grid */}
        <View style={styles.serviceSection}>
          <ServiceGrid onServiceClick={handleServiceClick} />
        </View>

        {/* Promotional Carousel */}
        <View style={styles.promoSection}>
          <PromoCarousel onNavigate={onNavigate} />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            This Month
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6' + '15' }]}>
                <Ionicons name="analytics" size={14} color="#3B82F6" />
              </View>
              {showSkeleton ? (
                <SkeletonLoader width={40} height={24} style={styles.statValueSkeleton} />
              ) : (
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                  {dashboardData?.transactions?.length || 0}
                </Text>
              )}
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Total Transactions
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF6' + '15' }]}>
                <Ionicons name="wallet" size={14} color="#8B5CF6" />
              </View>
              {showSkeleton ? (
                <SkeletonLoader width={80} height={24} style={styles.statValueSkeleton} />
              ) : (
                <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
                  ₦{dashboardData?.user?.balance || '0.00'}
                </Text>
              )}
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Current Balance
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Activity
            </Text>
            <TouchableOpacity
              onPress={() => onNavigate('transactions')}
              style={styles.viewAllButton}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View All
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {showSkeleton ? (
              // Show skeleton transaction cards
              [1, 2, 3].map((item) => (
                <View key={item} style={[styles.transactionCard, { backgroundColor: colors.card }]}>
                  <View style={styles.transactionInfo}>
                    <View style={[styles.transactionIcon, { backgroundColor: colors.primary + '20' }]} />
                    <View style={styles.transactionText}>
                      <SkeletonLoader width={120} height={16} style={styles.transactionTitleSkeleton} />
                      <SkeletonLoader width={100} height={12} style={styles.transactionDateSkeleton} />
                    </View>
                  </View>
                  <View style={styles.transactionAmount}>
                    <SkeletonLoader width={60} height={18} style={styles.amountSkeleton} />
                    <SkeletonLoader width={50} height={12} style={styles.statusSkeleton} />
                  </View>
                </View>
              ))
            ) : dashboardData?.transactions && dashboardData.transactions.length > 0 ? (
              dashboardData.transactions.slice(0, 3).map((transaction: any) => {
                
                // Determine icon and color based on transaction type
                const getTransactionIcon = (transaction: any) => {
                  const type = transaction.service?.toLowerCase() || transaction.description?.toLowerCase() || '';
                  if (type.includes('airtime') || type.includes('recharge')) return 'call';
                  if (type.includes('data')) return 'cellular';
                  if (type.includes('electricity') || type.includes('bill')) return 'flash';
                  if (type.includes('fund') || type.includes('credit')) return 'add-circle';
                  if (type.includes('transfer')) return 'swap-horizontal';
                  if (type.includes('withdraw')) return 'arrow-down-circle';
                  if (type.includes('deposit')) return 'arrow-up-circle';
                  return 'card';
                };

                const getTransactionColor = (transaction: any, index: number) => {
                  const colorOptions = [
                    '#10B981', // Green
                    '#3B82F6', // Blue
                    '#8B5CF6', // Purple
                    '#F59E0B', // Amber
                    '#EF4444'  // Red
                  ];
                  return colorOptions[index % colorOptions.length];
                };

                const transactionColor = getTransactionColor(transaction, transaction.id || 0);
                
                return (
                <TouchableOpacity
                  key={transaction.id}
                  style={[styles.transactionCard, { backgroundColor: colors.card }]}
                  onPress={() => handleTransactionPress(transaction)}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionInfo}>
                    <View style={[
                      styles.transactionIconContainer, 
                      { backgroundColor: transactionColor + '15' }
                    ]}>
                      <Ionicons 
                        name={getTransactionIcon(transaction)}
                        size={14} 
                        color={transactionColor}
                      />
                    </View>
                    <View style={styles.transactionText}>
                      <Text style={[styles.transactionType, { color: colors.text }]}>
                        {transaction.service || transaction.description || 'Transaction'}
                      </Text>
                      <Text style={[styles.transactionDate, { color: colors.mutedForeground }]}>
                        {new Date(transaction.created_at).toLocaleDateString()} • {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.amountText, 
                      { color: transaction.type?.toLowerCase() === 'credit' ? colors.success : colors.text }
                    ]}>
                      {transaction.type?.toLowerCase() === 'credit' ? '+' : '-'}₦{transaction.amount}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: (transaction.status.toLowerCase() === 'success' || transaction.status.toLowerCase() === 'completed') 
                        ? colors.success + '15' 
                        : transaction.status.toLowerCase() === 'pending'
                        ? colors.warning + '15'
                        : colors.destructive + '15'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: (transaction.status.toLowerCase() === 'success' || transaction.status.toLowerCase() === 'completed') 
                          ? colors.success 
                          : transaction.status.toLowerCase() === 'pending'
                          ? colors.warning
                          : colors.destructive
                        }
                      ]}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
              })
            ) : (
              <View style={[styles.emptyTransactions, { backgroundColor: colors.card }]}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.mutedForeground + '15' }]}>
                  <Ionicons name="receipt-outline" size={32} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.emptyTransactionsText, { color: colors.mutedForeground }]}>
                  No transactions yet
                </Text>
                <Text style={[styles.emptyTransactionsSubtext, { color: colors.mutedForeground }]}>
                  Your recent transactions will appear here
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ paddingBottom:  Platform.OS === 'android' ? safeAreaBottom : 0 }}>
        <BottomTabNavigator
          activeTab="home"
          onTabPress={(tabId) => {
            if (tabId !== 'home') {
              onNavigate(tabId);
            }
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  walletSection: {
    paddingTop: 16,
  },
  serviceSection: {
    marginTop: 20,
  },
  promoSection: {
    marginTop: 24,
  },
  statsSection: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  transactionsSection: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 6,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  transactionDate: {
    fontSize: 11,
    marginBottom: 1,
  },
  transactionReference: {
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 16,
  },
  emptyTransactionsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyTransactionsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  statValueSkeleton: {
    marginBottom: 4,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  transactionText: {
    flex: 1,
  },
  transactionTitleSkeleton: {
    marginBottom: 4,
  },
  transactionDateSkeleton: {
    marginBottom: 2,
  },
  transactionRefSkeleton: {
    marginBottom: 0,
  },
  amountSkeleton: {
    marginBottom: 4,
  },
  statusSkeleton: {
    marginBottom: 0,
  },
  testReceiptSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  testReceiptSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },

  testReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  testReceiptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
});
