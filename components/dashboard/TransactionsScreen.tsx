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
import { dashboardCacheUtils } from '@/utils/dashboardCache';

interface TransactionsScreenProps {
  onNavigate: (page: string) => void;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({
  onNavigate,
}) => {
  const { colors } = useTheme();
  
  // Get transactions from global cache (already fetched in dashboard)
  const cachedData = dashboardCacheUtils.getData();
  const transactions = cachedData?.transactions || [];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Time';
      }
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const getTransactionIcon = (transaction: any) => {
    const service = transaction.service?.toLowerCase() || '';
    const type = transaction.type?.toLowerCase() || '';
    
    if (service.includes('airtime') || service.includes('recharge')) return 'call';
    if (service.includes('data')) return 'cellular';
    if (service.includes('electricity') || service.includes('bill')) return 'flash';
    if (service.includes('deposit') || type.includes('credit')) return 'add-circle';
    if (service.includes('transfer')) return 'swap-horizontal';
    if (service.includes('withdraw') || type.includes('debit')) return 'arrow-down-circle';
    if (service.includes('deposit')) return 'arrow-up-circle';
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

  const getTransactionTitle = (transaction: any) => {
    const service = transaction.service || '';
    
    return service || 'Transaction';
  };

  const getTransactionSubtitle = (transaction: any) => {
    const info = transaction.info || '';
    
    if (info && info !== 'Wallet account - Paystack deposit') {
      return info;
    }
    return '';
  };

  const handleTransactionPress = (transaction: any) => {
    // Try to extract network from service name or info for airtime/data/card printing
    let network = null;
    const service = transaction.service?.toLowerCase() || '';
    const info = transaction.info?.toLowerCase() || '';
    
    if (service.includes('airtime') || service.includes('recharge') || 
        service.includes('data') || service.includes('card print')) {
      
      // Try to extract network from info first
      if (info.includes('mtn')) network = 'mtn';
      else if (info.includes('airtel')) network = 'airtel';
      else if (info.includes('glo')) network = 'glo';
      else if (info.includes('9mobile')) network = '9mobile';
      
      // If no network found in info, try to extract from service name
      if (!network) {
        if (service.includes('mtn')) network = 'mtn';
        else if (service.includes('airtel')) network = 'airtel';
        else if (service.includes('glo')) network = 'glo';
        else if (service.includes('9mobile')) network = '9mobile';
      }
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
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        {/* Transactions List */}
        {transactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {transactions.map((transaction, index) => {
              const transactionColor = getTransactionColor(index);
              const isCredit = transaction.type === 'Credit';
              const amount = parseFloat(transaction.amount);
              
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
                        size={18} 
                        color={transactionColor}
                      />
                    </View>
                    
                    <View style={styles.transactionText}>
                      <Text style={[styles.transactionType, { color: colors.text }]}>
                        {getTransactionTitle(transaction)}
                      </Text>
                      <Text style={[styles.transactionDate, { color: colors.mutedForeground }]}>
                        {formatDate(transaction.created_at)} • {formatTime(transaction.created_at)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transactionAmount}>
                    <Text style={[
                      styles.amountText, 
                      { color: isCredit ? colors.success : colors.text }
                    ]}>
                      {isCredit ? '+' : '-'}₦{amount.toLocaleString()}
                    </Text>
                    
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: transaction.status === 'Completed' 
                        ? colors.success + '15' 
                        : colors.destructive + '15'
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: transaction.status === 'Completed' 
                          ? colors.success 
                          : colors.destructive
                        }
                      ]}>
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Transactions Yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Your transaction history will appear here once you make your first transaction.
            </Text>
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  transactionsList: {
    gap: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  transactionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionText: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
    fontWeight: '500',
  },
});
