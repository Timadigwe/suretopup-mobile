import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ScrollView, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.muted,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Targeted skeleton for HomeScreen - only shows skeletons for dynamic data
export const HomeScreenSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header - show all static elements, only skeleton for username */}
      <View style={[styles.header, { 
        backgroundColor: colors.card + 'F5',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 24,
      }]}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            {/* Show avatar icon normally */}
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {/* Avatar icon will be shown normally */}
            </View>
            <View style={styles.userTextContainer}>
              {/* Show "Welcome" text normally */}
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                Welcome
              </Text>
              {/* Only skeleton for username */}
              <SkeletonLoader width={120} height={18} />
            </View>
          </View>
          {/* Show notification and settings icons normally */}
          <View style={styles.headerActions}>
            {/* Action buttons will be shown normally */}
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wallet Balance - show full card, only skeleton for balance amount */}
        <View style={styles.walletSection}>
          <View style={[styles.walletCard, { backgroundColor: colors.card }]}>
            <View style={styles.walletHeader}>
              {/* Show wallet title normally */}
              <Text style={[styles.walletTitle, { color: colors.text }]}>
                Wallet Balance
              </Text>
            </View>
            <View style={styles.walletBalance}>
              {/* Only skeleton for balance amount */}
              <SkeletonLoader width={150} height={32} style={styles.balanceSkeleton} />
              {/* Show subtitle normally */}
              <Text style={[styles.balanceSubtitle, { color: colors.mutedForeground }]}>
                Available for transactions
              </Text>
            </View>
            {/* Show Add Funds button normally */}
            <View style={styles.addFundsButton}>
              <Text style={[styles.addFundsText, { color: colors.primary }]}>
                Add Funds
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Services - show normally (static data) */}
        <View style={styles.serviceSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Services
          </Text>
          {/* Service grid will be shown normally */}
        </View>

        {/* Special Offers - show normally (static data) */}
        <View style={styles.promoSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Special Offers
          </Text>
          {/* Promo carousel will be shown normally */}
        </View>

        {/* This Month Stats - skeletons for dynamic data */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            This Month
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="trending-up" size={20} color={colors.primary} />
              </View>
              <SkeletonLoader width={40} height={24} style={styles.statValueSkeleton} />
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Total Transactions
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="wallet" size={20} color={colors.success} />
              </View>
              <SkeletonLoader width={80} height={24} style={styles.statValueSkeleton} />
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                Current Balance
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Activity - skeletons for transaction data */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Activity
            </Text>
            <View style={styles.viewAllButton}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View All
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </View>
          </View>
          <View style={styles.transactionsList}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={[styles.transactionCard, { backgroundColor: colors.card }]}>
                <View style={styles.transactionInfo}>
                  <View style={[styles.transactionIconContainer, { backgroundColor: colors.primary + '15' }]} />
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
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation - show normally (static) */}
      <View style={styles.bottomNav}>
        {/* Bottom nav will be shown normally */}
      </View>
    </View>
  );
};

// Keep the old DashboardSkeleton for backward compatibility
export const DashboardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { 
        backgroundColor: colors.card + 'F5',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 24,
      }]}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <SkeletonLoader width={48} height={48} borderRadius={16} />
            <View style={styles.userTextContainer}>
              <SkeletonLoader width={80} height={14} style={styles.greetingSkeleton} />
              <SkeletonLoader width={120} height={18} />
            </View>
          </View>
          <View style={styles.headerActions}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <SkeletonLoader width={20} height={20} borderRadius={10} style={styles.actionSkeleton} />
          </View>
        </View>
      </View>

      {/* Main Content Skeleton */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wallet Balance Skeleton */}
        <View style={styles.walletSection}>
          <SkeletonLoader width="100%" height={120} borderRadius={20} style={styles.walletSkeleton} />
        </View>

        {/* Services Grid Skeleton */}
        <View style={styles.serviceSection}>
          <SkeletonLoader width={120} height={20} style={styles.sectionTitleSkeleton} />
          <View style={styles.servicesGrid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <SkeletonLoader
                key={item}
                width="30%"
                height={80}
                borderRadius={16}
                style={styles.serviceCardSkeleton}
              />
            ))}
          </View>
        </View>

        {/* Promotional Carousel Skeleton */}
        <View style={styles.promoSection}>
          <SkeletonLoader width={120} height={20} style={styles.sectionTitleSkeleton} />
          <SkeletonLoader width="100%" height={120} borderRadius={16} />
        </View>

        {/* Quick Stats Skeleton */}
        <View style={styles.statsSection}>
          <SkeletonLoader width={100} height={20} style={styles.sectionTitleSkeleton} />
          <View style={styles.statsGrid}>
            <SkeletonLoader width="48%" height={80} borderRadius={16} />
            <SkeletonLoader width="48%" height={80} borderRadius={16} />
          </View>
        </View>

        {/* Recent Activity Skeleton */}
        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <SkeletonLoader width={120} height={20} />
            <SkeletonLoader width={60} height={14} />
          </View>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.transactionCardSkeleton}>
              <View style={styles.transactionInfo}>
                <SkeletonLoader width={40} height={40} borderRadius={20} />
                <View style={styles.transactionText}>
                  <SkeletonLoader width={120} height={16} style={styles.transactionTitleSkeleton} />
                  <SkeletonLoader width={100} height={12} />
                  <SkeletonLoader width={80} height={12} />
                </View>
              </View>
              <View style={styles.transactionAmount}>
                <SkeletonLoader width={60} height={18} style={styles.amountSkeleton} />
                <SkeletonLoader width={50} height={12} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation Skeleton */}
      <View style={styles.bottomNav}>
        {[1, 2, 3, 4].map((item) => (
          <SkeletonLoader
            key={item}
            width={24}
            height={24}
            borderRadius={12}
            style={styles.navItemSkeleton}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
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
  userTextContainer: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  greetingSkeleton: {
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionSkeleton: {
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  walletSection: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  walletCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  walletHeader: {
    marginBottom: 24,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  walletBalance: {
    marginBottom: 24,
  },
  balanceSkeleton: {
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
  },
  addFundsButton: {
    alignItems: 'center',
  },
  addFundsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  walletSkeleton: {
    marginBottom: 24,
  },
  serviceSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitleSkeleton: {
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCardSkeleton: {
    marginBottom: 12,
  },
  promoSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  statsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
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
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValueSkeleton: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
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
    // No specific styles needed for the list, just for the container
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  transactionCardSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionText: {
    flex: 1,
  },
  transactionAmount: {
    alignItems: 'flex-end',
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
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E1E9EE',
  },
  navItemSkeleton: {
    marginHorizontal: 8,
  },
});
