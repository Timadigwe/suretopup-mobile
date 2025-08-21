import React, { useState } from 'react';
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

interface DashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onLogout }) => {
  const [walletBalance] = useState(25750);
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user, logout } = useAuth();
  
  const userName = user ? `${user.firstname} ${user.lastname}` : "User";

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
              <Text style={[styles.statValue, { color: colors.primary }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                This Month
              </Text>
            </View>
            <View style={[styles.statCard, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}>
              <Text style={[styles.statValue, { color: colors.success }]}>₦45,200</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Total Spent
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
            {/* Sample transactions */}
            <View style={[styles.transactionCard, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}>
              <View style={styles.transactionInfo}>
                <View style={[styles.transactionIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <View style={[styles.transactionDot, { backgroundColor: colors.primary }]} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={[styles.transactionTitle, { color: colors.text }]}>
                    Airtime Purchase
                  </Text>
                  <Text style={[styles.transactionSubtitle, { color: colors.mutedForeground }]}>
                    MTN • Today, 2:30 PM
                  </Text>
                </View>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[styles.amount, { color: colors.text }]}>₦500</Text>
                <Text style={[styles.status, { color: colors.success }]}>Success</Text>
              </View>
            </View>

            <View style={[styles.transactionCard, { 
              backgroundColor: colors.card,
              borderColor: colors.border,
            }]}>
              <View style={styles.transactionInfo}>
                <View style={[styles.transactionIcon, { backgroundColor: '#3B82F620' }]}>
                  <View style={[styles.transactionDot, { backgroundColor: '#3B82F6' }]} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={[styles.transactionTitle, { color: colors.text }]}>
                    Data Purchase
                  </Text>
                  <Text style={[styles.transactionSubtitle, { color: colors.mutedForeground }]}>
                    Airtel • Yesterday, 4:15 PM
                  </Text>
                </View>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[styles.amount, { color: colors.text }]}>₦1,200</Text>
                <Text style={[styles.status, { color: colors.success }]}>Success</Text>
              </View>
            </View>
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
});
