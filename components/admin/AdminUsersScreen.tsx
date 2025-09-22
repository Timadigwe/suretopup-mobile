import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useSafeArea } from '@/hooks/useSafeArea';
import { apiService } from '@/services/api';

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  verification_code: string | null;
  email_verified_at: string | null;
  tpin: string;
  phone: string;
  balance: string;
  state: string;
  ipaddress: string | null;
  device: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  referral_count: number;
}

interface AdminUsersScreenProps {
  onBack: () => void;
}

export const AdminUsersScreen: React.FC<AdminUsersScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState(false);
  const [showCreditDebitModal, setShowCreditDebitModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'Credit' | 'Debit'>('Credit');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchUsers = async () => {
    try {
      setUsersError(false);
      const response = await apiService.getAdminUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      } else {
        setUsersError(true);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersError(true);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await fetchUsers();
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };

  const handleCreditDebit = (user: User, action: 'Credit' | 'Debit') => {
    setSelectedUser(user);
    setActionType(action);
    setAmount('');
    setShowCreditDebitModal(true);
    triggerHapticFeedback('light');
  };

  const handleProcessTransaction = async () => {
    if (!selectedUser || !amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.creditDebitUser({
        email: selectedUser.email,
        action: actionType,
        amount: amountValue,
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        Alert.alert(
          'Success',
          `${actionType} of ₦${amountValue.toLocaleString()} processed successfully`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowCreditDebitModal(false);
                fetchUsers(); // Refresh users list
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Transaction failed');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Transaction failed');
      triggerHapticFeedback('heavy');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `₦${numAmount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderUserCard = (user: User) => (
    <View key={user.id} style={[styles.userCard, { backgroundColor: colors.card }]}>
      <View style={styles.userHeader}>
        <View style={[styles.userAvatar, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.userInitials, { color: colors.primary }]}>
            {user.firstname.charAt(0)}{user.lastname.charAt(0)}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.firstname} {user.lastname}
          </Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
            {user.email}
          </Text>
          <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
            {user.phone}
          </Text>
        </View>
        <View style={styles.userStatus}>
          <Text style={[styles.userBalance, { color: colors.success }]}>
            {formatAmount(user.balance)}
          </Text>
          <Text style={[styles.userStatusText, { 
            color: user.status === 'active' ? colors.success : colors.destructive 
          }]}>
            {user.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.userDetails}>
        <Text style={[styles.userDetailText, { color: colors.mutedForeground }]}>
          State: {user.state}
        </Text>
        <Text style={[styles.userDetailText, { color: colors.mutedForeground }]}>
          Joined: {formatDate(user.created_at)}
        </Text>
        <Text style={[styles.userDetailText, { color: colors.mutedForeground }]}>
          Referrals: {user.referral_count}
        </Text>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          onPress={() => handleCreditDebit(user, 'Credit')}
          style={[styles.actionButton, { backgroundColor: colors.success + '15' }]}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={16} color={colors.success} />
          <Text style={[styles.actionButtonText, { color: colors.success }]}>
            Credit
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => handleCreditDebit(user, 'Debit')}
          style={[styles.actionButton, { backgroundColor: colors.destructive + '15' }]}
          activeOpacity={0.7}
        >
          <Ionicons name="remove-circle" size={16} color={colors.destructive} />
          <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
            Debit
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: safeAreaTop + 20 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Users Management</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading users...
          </Text>
        </View>
      ) : (
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
          {usersError ? (
            <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
              <View style={[styles.errorIcon, { backgroundColor: colors.destructive + '15' }]}>
                <Ionicons name="alert-circle" size={24} color={colors.destructive} />
              </View>
              <Text style={[styles.errorTitle, { color: colors.text }]}>No Users Data Found</Text>
              <Text style={[styles.errorMessage, { color: colors.mutedForeground }]}>
                Unable to load users list. Please try again.
              </Text>
              <TouchableOpacity
                onPress={fetchUsers}
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.retryButtonText, { color: 'white' }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.statsContainer}>
                <Text style={[styles.statsText, { color: colors.text }]}>
                  Total Users: {users.length}
                </Text>
              </View>
              
              {users.map(renderUserCard)}
            </>
          )}
        </ScrollView>
      )}

      {/* Credit/Debit Modal */}
      <Modal
        visible={showCreditDebitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreditDebitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {actionType} User Account
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreditDebitModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalUserInfo}>
                <Text style={[styles.modalUserName, { color: colors.text }]}>
                  {selectedUser.firstname} {selectedUser.lastname}
                </Text>
                <Text style={[styles.modalUserEmail, { color: colors.mutedForeground }]}>
                  {selectedUser.email}
                </Text>
                <Text style={[styles.modalUserBalance, { color: colors.success }]}>
                  Current Balance: {formatAmount(selectedUser.balance)}
                </Text>
              </View>
            )}

            <View style={styles.modalForm}>
              <Text style={[styles.modalLabel, { color: colors.text }]}>
                Amount (₦)
              </Text>
              <TextInput
                style={[styles.modalInput, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                placeholder="Enter amount"
                placeholderTextColor={colors.mutedForeground}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                textAlignVertical="center"
                underlineColorAndroid="transparent"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowCreditDebitModal(false)}
                style={[styles.modalButton, { backgroundColor: colors.mutedForeground + '20' }]}
                disabled={isProcessing}
              >
                <Text style={[styles.modalButtonText, { color: colors.mutedForeground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleProcessTransaction}
                style={[
                  styles.modalButton,
                  { backgroundColor: actionType === 'Credit' ? colors.success : colors.destructive },
                  isProcessing && { opacity: 0.6 }
                ]}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    {actionType}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInitials: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  userBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userStatusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  userDetails: {
    marginBottom: 16,
  },
  userDetailText: {
    fontSize: 12,
    marginBottom: 2,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  errorCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalUserInfo: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalUserEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  modalUserBalance: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalForm: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminUsersScreen;
