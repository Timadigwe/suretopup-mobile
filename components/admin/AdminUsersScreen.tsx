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
  is_banned: boolean;
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
  const [showBanModal, setShowBanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setShowBanModal(true);
    triggerHapticFeedback('light');
  };

  const handleUnbanUser = (user: User) => {
    setSelectedUser(user);
    setShowBanModal(true);
    triggerHapticFeedback('light');
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    triggerHapticFeedback('light');
  };

  const handleProcessBan = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const response = selectedUser.is_banned 
        ? await apiService.unbanUser({ id: selectedUser.id })
        : await apiService.banUser({ id: selectedUser.id });

      if (response.success) {
        triggerHapticFeedback('medium');
        const action = selectedUser.is_banned ? 'unbanned' : 'banned';
        Alert.alert(
          'Success',
          `User ${action} successfully`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowBanModal(false);
                fetchUsers(); // Refresh users list
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Operation failed');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Operation failed');
      triggerHapticFeedback('heavy');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessDelete = async () => {
    if (!selectedUser) return;

    setIsProcessing(true);
    try {
      const response = await apiService.deleteUser({ id: selectedUser.id });

      if (response.success) {
        triggerHapticFeedback('medium');
        Alert.alert(
          'Success',
          'User deleted successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowDeleteModal(false);
                fetchUsers(); // Refresh users list
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Delete failed');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Delete failed');
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
      {/* User Header */}
      <View style={styles.userHeader}>
        <View style={[styles.userAvatar, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.userInitials, { color: colors.primary }]}>
            {user.firstname.charAt(0)}{user.lastname.charAt(0)}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {user.firstname} {user.lastname}
          </Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
            {user.email}
          </Text>
          <Text style={[styles.userPhone, { color: colors.mutedForeground }]} numberOfLines={1}>
            {user.phone}
          </Text>
        </View>
        <View style={styles.userStatus}>
          <Text style={[styles.userBalance, { color: colors.success }]}>
            {formatAmount(user.balance)}
          </Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: user.status === 'active' ? colors.success + '15' : colors.destructive + '15'
          }]}>
            <Text style={[styles.userStatusText, { 
              color: user.status === 'active' ? colors.success : colors.destructive 
            }]}>
              {user.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      {/* User Details */}
      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>State:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{user.state}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Joined:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(user.created_at)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Referrals:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{user.referral_count}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
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

        {user.is_banned ? (
          <TouchableOpacity
            onPress={() => handleUnbanUser(user)}
            style={[styles.actionButton, { backgroundColor: colors.success + '15' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.actionButtonText, { color: colors.success }]}>
              Unban
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => handleBanUser(user)}
            style={[styles.actionButton, { backgroundColor: colors.warning + '15' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="ban" size={16} color={colors.warning} />
            <Text style={[styles.actionButtonText, { color: colors.warning }]}>
              Ban
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          onPress={() => handleDeleteUser(user)}
          style={[styles.actionButton, { backgroundColor: colors.destructive + '15' }]}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={16} color={colors.destructive} />
          <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
            Delete
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
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Users Management</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              Manage user accounts and permissions
            </Text>
          </View>
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
              <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
                <View style={styles.statsHeader}>
                  <Ionicons name="people" size={24} color={colors.primary} />
                  <Text style={[styles.statsTitle, { color: colors.text }]}>User Statistics</Text>
                </View>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>{users.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Users</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.success }]}>
                      {users.filter(u => u.status === 'active').length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: colors.destructive }]}>
                      {users.filter(u => u.is_banned).length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Banned</Text>
                  </View>
                </View>
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

      {/* Ban/Unban Modal */}
      <Modal
        visible={showBanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedUser?.is_banned ? 'Unban User' : 'Ban User'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowBanModal(false)}
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
                  Current Status: {selectedUser.is_banned ? 'Banned' : 'Active'}
                </Text>
              </View>
            )}

            <View style={styles.modalWarning}>
              <Ionicons 
                name={selectedUser?.is_banned ? 'checkmark-circle' : 'warning'} 
                size={24} 
                color={selectedUser?.is_banned ? colors.success : colors.warning} 
              />
              <Text style={[styles.modalWarningText, { color: colors.text }]}>
                {selectedUser?.is_banned 
                  ? 'This will restore the user\'s access to the platform.'
                  : 'This will prevent the user from accessing the platform.'
                }
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowBanModal(false)}
                style={[styles.modalButton, { backgroundColor: colors.mutedForeground + '20' }]}
                disabled={isProcessing}
              >
                <Text style={[styles.modalButtonText, { color: colors.mutedForeground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleProcessBan}
                style={[
                  styles.modalButton,
                  { backgroundColor: selectedUser?.is_banned ? colors.success : colors.warning },
                  isProcessing && { opacity: 0.6 }
                ]}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    {selectedUser?.is_banned ? 'Unban User' : 'Ban User'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Delete User
              </Text>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
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
                  Balance: {formatAmount(selectedUser.balance)}
                </Text>
              </View>
            )}

            <View style={styles.modalWarning}>
              <Ionicons name="warning" size={24} color={colors.destructive} />
              <Text style={[styles.modalWarningText, { color: colors.text }]}>
                This action cannot be undone. The user and all their data will be permanently deleted.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                style={[styles.modalButton, { backgroundColor: colors.mutedForeground + '20' }]}
                disabled={isProcessing}
              >
                <Text style={[styles.modalButtonText, { color: colors.mutedForeground }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleProcessDelete}
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.destructive },
                  isProcessing && { opacity: 0.6 }
                ]}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    Delete User
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
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
    opacity: 0.8,
  },
  userPhone: {
    fontSize: 13,
    opacity: 0.7,
  },
  userStatus: {
    alignItems: 'flex-end',
  },
  userBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  userStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  userDetails: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  modalWarningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});

export default AdminUsersScreen;
