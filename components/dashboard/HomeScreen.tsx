import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { BottomTabNavigator } from '@/components/navigation/BottomTabNavigator';
import { WalletBalanceCard } from './WalletBalanceCard';
import { ServiceGrid } from './ServiceGrid';
import { PromoCarousel } from './PromoCarousel';

interface HomeScreenProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onLogout,
}) => {
  const [walletBalance] = useState(25750);
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user } = useAuth();

  const handleServiceClick = (serviceId: string) => {
    triggerHapticFeedback('light');
    onNavigate(serviceId);
  };

  const handleAddFunds = () => {
    triggerHapticFeedback('light');
    onNavigate('add-funds');
  };

  const recentTransactions = [
    {
      id: 1,
      type: "Airtime Recharge",
      amount: -500,
      status: "success",
      date: "Today, 2:30 PM",
      reference: "MTN ₦500"
    },
    {
      id: 2,
      type: "Data Purchase", 
      amount: -1500,
      status: "success",
      date: "Yesterday, 10:15 AM",
      reference: "Airtel 2GB"
    },
    {
      id: 3,
      type: "Wallet Funding",
      amount: +5000,
      status: "success", 
      date: "2 days ago",
      reference: "Bank Transfer"
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
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
                {user?.firstname} {user?.lastname}
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
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wallet Balance */}
        <View style={styles.walletSection}>
          <WalletBalanceCard 
            balance={walletBalance}
            onAddFunds={handleAddFunds}
          />
        </View>

        {/* Service Grid */}
        <View style={styles.serviceSection}>
          <ServiceGrid onServiceClick={handleServiceClick} />
        </View>

        {/* Promotional Carousel */}
        <View style={styles.promoSection}>
          <PromoCarousel />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            This Month
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>47</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Transactions
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>₦12,450</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Total Spent
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
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
              <View 
                key={transaction.id} 
                style={[styles.transactionCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionType, { color: colors.text }]}>
                    {transaction.type}
                  </Text>
                  <Text style={[styles.transactionDate, { color: colors.mutedForeground }]}>
                    {transaction.date}
                  </Text>
                  <Text style={[styles.transactionReference, { color: colors.mutedForeground }]}>
                    {transaction.reference}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.amountText, 
                    { color: transaction.amount > 0 ? colors.primary : colors.text }
                  ]}>
                    {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: transaction.status === 'success' 
                      ? colors.primary + '20' 
                      : colors.destructive + '20'
                    }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: transaction.status === 'success' 
                        ? colors.primary 
                        : colors.destructive
                      }
                    ]}>
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomTabNavigator
        activeTab="home"
        onTabPress={(tabId) => {
          if (tabId !== 'home') {
            onNavigate(tabId);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
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
    paddingBottom: 100,
  },
  walletSection: {
    paddingTop: 16,
  },
  serviceSection: {
    marginTop: 24,
  },
  promoSection: {
    marginTop: 32,
  },
  statsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  transactionsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    padding: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  transactionReference: {
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
