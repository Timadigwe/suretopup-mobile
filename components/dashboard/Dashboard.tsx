import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { WalletBalanceCard } from './WalletBalanceCard';
import { ServiceGrid } from './ServiceGrid';
import { PromoCarousel } from './PromoCarousel';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';
import { apiService, DashboardData } from '@/services/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onLogout }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user, token, logout } = useAuth();

  const walletBalance = dashboardData?.user?.balance ? parseFloat(dashboardData.user.balance) : 0;
  const userName = dashboardData?.user?.fullname || (user ? `${user.firstname} ${user.lastname}` : "User");

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getDashboard();
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleServiceClick = (serviceId: string) => {
    triggerHapticFeedback('light');
    onNavigate(serviceId);
  };

  const handleAddFunds = () => {
    triggerHapticFeedback('medium');
    onNavigate("add-funds");
  };

  const handleLogout = () => {
    triggerHapticFeedback('medium');
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
            triggerHapticFeedback('heavy');
            await logout();
            onLogout();
          },
        },
      ]
    );
  };
  
  // Show skeleton loader while loading
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { 
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="person" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                Good morning
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {userName}
              </Text>
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
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Oops!</Text>
          <Text style={[styles.errorMessage, { color: colors.mutedForeground }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setIsLoading(true);
              setError(null);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
      }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Good morning
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userName}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => onNavigate("notifications")}
            style={styles.headerButton}
          >
            <Ionicons name="notifications" size={20} color={colors.text} />
            <View style={[styles.notificationBadge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => onNavigate("profile")}
            style={styles.headerButton}
          >
            <Ionicons name="settings" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wallet Balance */}
        <WalletBalanceCard 
          balance={walletBalance}
          onAddFunds={handleAddFunds}
        />

        {/* Services Grid */}
        <ServiceGrid onServiceClick={handleServiceClick} />

        {/* Promotional Carousel */}
        <PromoCarousel />

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#3B82F6' + '15' }]}>
                <Ionicons name="analytics" size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                {dashboardData?.transactions?.length || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Total Transactions
              </Text>
            </View>
            <View style={[styles.statCard, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}>
              <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF6' + '15' }]}>
                <Ionicons name="wallet" size={20} color="#8B5CF6" />
              </View>
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>
                ₦{dashboardData?.user?.balance || '0.00'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Current Balance
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Transactions
            </Text>
            <TouchableOpacity onPress={() => onNavigate("transactions")}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsList}>
            {dashboardData?.transactions && dashboardData.transactions.length > 0 ? (
              dashboardData.transactions.slice(0, 2).map((transaction, index) => {
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

                const getTransactionColor = (index: number) => {
                  const colorOptions = [
                    '#10B981', // Green
                    '#3B82F6', // Blue
                    '#8B5CF6', // Purple
                    '#F59E0B', // Amber
                    '#EF4444'  // Red
                  ];
                  return colorOptions[index % colorOptions.length];
                };

                const transactionColor = getTransactionColor(index);
                
                return (
                  <View key={transaction.id} style={[styles.transactionCard, { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }]}>
                    <View style={styles.transactionInfo}>
                      <View style={[styles.transactionIcon, { backgroundColor: transactionColor + '15' }]}>
                        <Ionicons 
                          name={getTransactionIcon(transaction)}
                          size={20} 
                          color={transactionColor}
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <Text style={[styles.transactionTitle, { color: colors.text }]}>
                          {transaction.description}
                        </Text>
                        <Text style={[styles.transactionSubtitle, { color: colors.mutedForeground }]}>
                          {new Date(transaction.created_at).toLocaleDateString()} • {new Date(transaction.created_at).toLocaleTimeString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text style={[styles.amount, { color: colors.text }]}>₦{transaction.amount}</Text>
                      <Text style={[styles.status, { 
                        color: transaction.status === 'success' ? colors.success : 
                               transaction.status === 'pending' ? colors.warning : colors.destructive 
                      }]}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={[styles.emptyTransactions, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="receipt-outline" size={32} color={colors.mutedForeground} />
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

        {/* Logout Section */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.logoutButton, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
            <Text style={[styles.logoutText, { color: colors.destructive }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  greeting: {
    fontSize: 12,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  transactionsContainer: {
    paddingHorizontal: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    borderWidth: 1,
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
});
