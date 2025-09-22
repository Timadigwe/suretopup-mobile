import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useSafeArea } from '@/hooks/useSafeArea';
import { apiService } from '@/services/api';

interface Transaction {
  id: number;
  user_id: string;
  user_email: string;
  user_firstname: string;
  user_lastname: string;
  type: string;
  amount: number;
  description: string | null;
  reference: string | null;
  status: string;
  service: string;
  previous_balance: number | null;
  new_balance: number;
  created_at: string;
  updated_at: string;
  formatted_amount: string;
  formatted_previous_balance: string | null;
  formatted_new_balance: string;
}

interface Pagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface Summary {
  total_transactions: number;
  credit_transactions: number;
  debit_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
}

interface AdminTransactionsScreenProps {
  onBack: () => void;
}

export const AdminTransactionsScreen: React.FC<AdminTransactionsScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const typeOptions = ['All', 'Credit', 'Debit'];
  const statusOptions = ['All', 'Completed', 'Pending', 'Failed'];
  const sortOptions = [
    { value: 'created_at', label: 'Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'service', label: 'Service' },
    { value: 'status', label: 'Status' },
  ];

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, selectedType, selectedStatus, sortBy, sortOrder]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery !== '') {
        fetchTransactions();
      } else if (searchQuery === '') {
        fetchTransactions();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const fetchTransactions = async (page: number = currentPage, refresh: boolean = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params: any = {
        page,
        per_page: 15,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (selectedType !== 'All') {
        params.type = selectedType;
      }
      if (selectedStatus !== 'All') {
        params.status = selectedStatus;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await apiService.getAdminTransactions(params);
      
      if (response.success && response.data) {
        if (refresh || page === 1) {
          setTransactions(response.data.transactions);
        } else {
          setTransactions(prev => [...prev, ...response.data.transactions]);
        }
        setPagination(response.data.pagination);
        setSummary(response.data.summary);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchTransactions(1, true);
  };

  const handleLoadMore = () => {
    if (pagination && currentPage < pagination.last_page && !isLoading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'airtime':
      case 'recharge':
        return 'phone-portrait';
      case 'data':
      case 'internet':
        return 'cellular';
      case 'electricity':
      case 'power':
        return 'flash';
      case 'cable':
      case 'tv':
        return 'tv';
      case 'card print':
      case 'printing':
        return 'card';
      case 'betting':
        return 'trophy';
      case 'deposit':
      case 'fund':
        return 'add-circle';
      default:
        return 'receipt';
    }
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status === 'Failed') return colors.destructive;
    if (type === 'Credit') return colors.success;
    return colors.primary;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={[styles.transactionCard, { backgroundColor: colors.card }]}
      activeOpacity={0.7}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {item.user_firstname} {item.user_lastname}
            </Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
              {item.user_email}
            </Text>
          </View>
          <View style={styles.amountInfo}>
            <Text style={[styles.amount, { color: getTransactionColor(item.type, item.status) }]}>
              {item.formatted_amount}
            </Text>
            <Text style={[styles.transactionType, { color: colors.mutedForeground }]}>
              {item.type}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.serviceInfo}>
          <View style={[styles.serviceIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons 
              name={getTransactionIcon(item.service)} 
              size={20} 
              color={colors.primary} 
            />
          </View>
          <View style={styles.serviceDetails}>
            <Text style={[styles.serviceName, { color: colors.text }]}>{item.service}</Text>
            <Text style={[styles.transactionDate, { color: colors.mutedForeground }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.statusInfo}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      {item.reference && (
        <View style={styles.referenceInfo}>
          <Text style={[styles.referenceLabel, { color: colors.mutedForeground }]}>Reference:</Text>
          <Text style={[styles.referenceValue, { color: colors.text }]}>{item.reference}</Text>
        </View>
      )}

      <View style={styles.balanceInfo}>
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Previous:</Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
            {item.formatted_previous_balance || 'N/A'}
          </Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>New Balance:</Text>
          <Text style={[styles.balanceValue, { color: colors.success }]}>
            {item.formatted_new_balance}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSummaryCard = () => {
    if (!summary) return null;

    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Transaction Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{summary.total_transactions}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.credit_transactions}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Credits</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.debit_transactions}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Debits</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.successful_transactions}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Successful</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={[styles.filtersCard, { backgroundColor: colors.card }]}>
      <View style={styles.searchSection}>
        <Ionicons name="search" size={20} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {typeOptions.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                { backgroundColor: selectedType === type ? colors.primary : colors.background },
                { borderColor: colors.border }
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[
                styles.filterChipText,
                { color: selectedType === type ? 'white' : colors.text }
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                { backgroundColor: selectedStatus === status ? colors.primary : colors.background },
                { borderColor: colors.border }
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.filterChipText,
                { color: selectedStatus === status ? 'white' : colors.text }
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: safeAreaTop + 20 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction History</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={[styles.refreshButton, { backgroundColor: colors.primary + '20' }]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="refresh" size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Summary Card */}
        {renderSummaryCard()}

        {/* Filters */}
        {renderFilters()}

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              {pagination ? `${pagination.from}-${pagination.to} of ${pagination.total} transactions` : 'Transactions'}
            </Text>
          </View>
          
          {isLoading && transactions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading transactions...
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={() => 
                pagination && currentPage < pagination.last_page ? (
                  <View style={styles.loadMoreContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadMoreText, { color: colors.mutedForeground }]}>
                      Loading more...
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  filtersCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterRow: {
    marginTop: 8,
  },
  filterChips: {
    marginRight: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transactionsList: {
    marginBottom: 16,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  loadMoreContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadMoreText: {
    marginTop: 8,
    fontSize: 14,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    marginBottom: 12,
  },
  transactionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 12,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  statusInfo: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  referenceInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  referenceLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  referenceValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  balanceInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
  },
  balanceValue: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default AdminTransactionsScreen;
