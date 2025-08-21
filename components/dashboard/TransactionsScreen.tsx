import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { BottomTabNavigator } from '@/components/navigation/BottomTabNavigator';

interface TransactionsScreenProps {
  onNavigate: (page: string) => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  onNavigate,
}) => {
  const { colors } = useTheme();

  const transactions = [
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
    },
    {
      id: 4,
      type: "Electricity Bill",
      amount: -2500,
      status: "pending",
      date: "3 days ago",
      reference: "IKEDC Bill"
    },
    {
      id: 5,
      type: "Data Purchase",
      amount: -1000,
      status: "success",
      date: "1 week ago",
      reference: "Glo 1GB"
    }
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
            Transaction History
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
        <View style={styles.transactionsList}>
          {transactions.map((transaction) => (
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
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomTabNavigator
        activeTab="transactions"
        onTabPress={(tabId) => {
          if (tabId !== 'transactions') {
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
    paddingHorizontal: 24,
    paddingTop: 16,
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
