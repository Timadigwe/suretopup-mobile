import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeArea } from '@/hooks/useSafeArea';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { admin, logout } = useAuth();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Add refresh logic here
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const adminStats = [
    {
      title: 'Total Users',
      value: '1,234',
      icon: 'people',
      color: colors.primary,
    },
    {
      title: 'Total Transactions',
      value: '5,678',
      icon: 'card',
      color: colors.success,
    },
    {
      title: 'Revenue',
      value: '₦2,345,678',
      icon: 'cash',
      color: colors.warning,
    },
    {
      title: 'Active Sessions',
      value: '89',
      icon: 'pulse',
      color: colors.destructive,
    },
  ];

  const quickActions = [
    {
      title: 'User Management',
      icon: 'people',
      color: colors.primary,
      onPress: () => {
        triggerHapticFeedback('light');
        // Navigate to user management
      },
    },
    {
      title: 'Transaction History',
      icon: 'list',
      color: colors.success,
      onPress: () => {
        triggerHapticFeedback('light');
        // Navigate to transaction history
      },
    },
    {
      title: 'Analytics',
      icon: 'analytics',
      color: colors.warning,
      onPress: () => {
        triggerHapticFeedback('light');
        // Navigate to analytics
      },
    },
    {
      title: 'Settings',
      icon: 'settings',
      color: colors.mutedForeground,
      onPress: () => {
        triggerHapticFeedback('light');
        // Navigate to settings
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
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {adminStats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statTitle, { color: colors.mutedForeground }]}>{stat.title}</Text>
            </View>
          ))}
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
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
          <View style={[styles.activityCard, { backgroundColor: colors.card }]}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>
                  New user registered
                </Text>
                <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
                  2 minutes ago
                </Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="card" size={16} color={colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>
                  Transaction completed
                </Text>
                <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
                  5 minutes ago
                </Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="warning" size={16} color={colors.warning} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>
                  System maintenance scheduled
                </Text>
                <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
                  1 hour ago
                </Text>
              </View>
            </View>
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
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
    marginBottom: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityCard: {
    borderRadius: 16,
    padding: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
});

export default AdminDashboard;
