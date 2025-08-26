import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { BottomTabNavigator } from '@/components/navigation/BottomTabNavigator';
import { WalletBalanceCard } from './WalletBalanceCard';

interface WalletScreenProps {
  onNavigate: (page: string) => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  onNavigate,
}) => {
  const [walletBalance] = useState(25750);
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();

  const handleAddFunds = () => {
    triggerHapticFeedback('light');
    onNavigate('add-funds');
  };

  const walletActions = [
    {
      id: 'add-funds',
      title: 'Add Funds',
      subtitle: 'Top up your wallet',
      icon: 'add-circle',
      action: () => onNavigate('add-funds'),
    },
    {
      id: 'withdraw',
      title: 'Withdraw',
      subtitle: 'Transfer to bank',
      icon: 'arrow-down-circle',
      action: () => onNavigate('withdraw'),
    },
    {
      id: 'transfer',
      title: 'Transfer',
      subtitle: 'Send to others',
      icon: 'swap-horizontal',
      action: () => onNavigate('transfer'),
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'Wallet Funding',
      amount: +5000,
      date: 'Today, 2:30 PM',
      status: 'success',
    },
    {
      id: 2,
      type: 'Withdrawal',
      amount: -2000,
      date: 'Yesterday, 10:15 AM',
      status: 'success',
    },
    {
      id: 3,
      type: 'Transfer',
      amount: -1000,
      date: '2 days ago',
      status: 'pending',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card + 'F5' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => onNavigate('home')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Wallet
          </Text>
          <View style={styles.headerSpacer} />
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

        {/* Wallet Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {walletActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: colors.card }]}
                onPress={action.action}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={action.icon as any} size={24} color={colors.primary} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.text }]}>
                  {action.title}
                </Text>
                <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>
                  {action.subtitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Activities
          </Text>
          <View style={styles.activitiesList}>
            {recentActivities.map((activity, index) => {
              // Determine icon and color based on activity type
              const getActivityIcon = (activity: any) => {
                const type = activity.type?.toLowerCase() || '';
                if (type.includes('funding') || type.includes('fund')) return 'add-circle';
                if (type.includes('withdrawal') || type.includes('withdraw')) return 'arrow-down-circle';
                if (type.includes('transfer')) return 'swap-horizontal';
                if (type.includes('recharge') || type.includes('airtime')) return 'call';
                if (type.includes('data')) return 'cellular';
                return 'card';
              };

              const getActivityColor = (index: number) => {
                const colorOptions = [
                  '#10B981', // Green
                  '#3B82F6', // Blue
                  '#8B5CF6', // Purple
                  '#F59E0B', // Amber
                  '#EF4444'  // Red
                ];
                return colorOptions[index % colorOptions.length];
              };

              const activityColor = getActivityColor(index);
              
              return (
                <View 
                  key={activity.id} 
                  style={[styles.activityCard, { backgroundColor: colors.card }]}
                >
                  <View style={styles.activityInfo}>
                    <View style={[
                      styles.activityIconContainer, 
                      { backgroundColor: activityColor + '15' }
                    ]}>
                      <Ionicons 
                        name={getActivityIcon(activity)}
                        size={20} 
                        color={activityColor}
                      />
                    </View>
                    <View style={styles.activityText}>
                      <Text style={[styles.activityType, { color: colors.text }]}>
                        {activity.type}
                      </Text>
                      <Text style={[styles.activityDate, { color: colors.mutedForeground }]}>
                        {activity.date}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.activityAmount}>
                    <Text style={[
                      styles.amountText, 
                      { color: activity.amount > 0 ? colors.success : colors.text }
                    ]}>
                      {activity.amount > 0 ? '+' : ''}₦{Math.abs(activity.amount).toLocaleString()}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: activity.status === 'success' 
                        ? colors.success + '15' 
                        : colors.destructive + '15'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: activity.status === 'success' 
                          ? colors.success 
                          : colors.destructive
                        }
                      ]}>
                        {activity.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomTabNavigator
        activeTab="wallet"
        onTabPress={(tabId) => {
          if (tabId !== 'wallet') {
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
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
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
  actionsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  activitiesSection: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
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
  activityInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityText: {
    flex: 1,
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
  },
  activityAmount: {
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
