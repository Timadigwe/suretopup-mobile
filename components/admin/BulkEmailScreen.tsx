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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useSafeArea } from '@/hooks/useSafeArea';
import { apiService } from '@/services/api';

interface BulkEmailStats {
  total_users: number;
  users_with_email: number;
  verified_users: number;
  unverified_users: number;
  eligible_recipients: number;
  stats_generated_at: string;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  balance: string;
}

interface BulkEmailScreenProps {
  onBack: () => void;
}

type EmailMode = 'bulk' | 'single';

export const BulkEmailScreen: React.FC<BulkEmailScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  // Tab state
  const [emailMode, setEmailMode] = useState<EmailMode>('bulk');
  
  // Bulk email state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [batchSize, setBatchSize] = useState('1000');
  const [isSending, setIsSending] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [emailStats, setEmailStats] = useState<BulkEmailStats | null>(null);
  
  // Single user email state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [singleUserSubject, setSingleUserSubject] = useState('');
  const [singleUserMessage, setSingleUserMessage] = useState('');
  const [isSendingSingleEmail, setIsSendingSingleEmail] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    fetchEmailStats();
    if (emailMode === 'single') {
      fetchUsers();
    }
  }, [emailMode]);

  const fetchEmailStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await apiService.getBulkEmailStats();
      if (response.success && response.data) {
        setEmailStats(response.data);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch email stats:', error);
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await apiService.getAdminUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to fetch users:', error);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = userSearchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.firstname.toLowerCase().includes(query) ||
      user.lastname.toLowerCase().includes(query) ||
      `${user.firstname} ${user.lastname}`.toLowerCase().includes(query)
    );
  });

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message');
      return;
    }

    setIsSending(true);
    try {
      const response = await apiService.sendBulkEmail({
        subject: subject.trim(),
        message: message.trim(),
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        setSuccessData({
          type: 'send',
          data: response.data,
        });
        setShowSuccessModal(true);
        setSubject('');
        setMessage('');
      } else {
        Alert.alert('Error', response.message || 'Failed to send bulk email');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send bulk email');
      triggerHapticFeedback('heavy');
    } finally {
      setIsSending(false);
    }
  };

  const handleQueueEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message');
      return;
    }

    const batchSizeNum = parseInt(batchSize);
    if (isNaN(batchSizeNum) || batchSizeNum <= 0) {
      Alert.alert('Error', 'Please enter a valid batch size');
      return;
    }

    setIsQueuing(true);
    try {
      const response = await apiService.queueBulkEmail({
        subject: subject.trim(),
        message: message.trim(),
        batch_size: batchSizeNum,
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        setSuccessData({
          type: 'queue',
          data: response.data,
        });
        setShowSuccessModal(true);
        setSubject('');
        setMessage('');
        setBatchSize('1000');
      } else {
        Alert.alert('Error', response.message || 'Failed to queue bulk email');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to queue bulk email');
      triggerHapticFeedback('heavy');
    } finally {
      setIsQueuing(false);
    }
  };

  const handleSendSingleEmail = async () => {
    if (!selectedUser) {
      Alert.alert('Error', 'Please select a user');
      return;
    }
    if (!singleUserSubject.trim() || !singleUserMessage.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message');
      return;
    }

    setIsSendingSingleEmail(true);
    try {
      const response = await apiService.sendEmailToUser({
        user_id: selectedUser.id,
        subject: singleUserSubject.trim(),
        message: singleUserMessage.trim(),
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        setSuccessData({
          type: 'single',
          data: response.data,
        });
        setShowSuccessModal(true);
        setSingleUserSubject('');
        setSingleUserMessage('');
        setSelectedUser(null);
        setUserSearchQuery('');
      } else {
        Alert.alert('Error', response.message || 'Failed to send email');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send email');
      triggerHapticFeedback('heavy');
    } finally {
      setIsSendingSingleEmail(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Email Management</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              emailMode === 'bulk' && [styles.tabActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => {
              setEmailMode('bulk');
              triggerHapticFeedback('light');
            }}
          >
            <Ionicons 
              name="mail" 
              size={18} 
              color={emailMode === 'bulk' ? 'white' : colors.mutedForeground} 
            />
            <Text style={[
              styles.tabText,
              { color: emailMode === 'bulk' ? 'white' : colors.mutedForeground }
            ]}>
              Bulk Email
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              emailMode === 'single' && [styles.tabActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => {
              setEmailMode('single');
              triggerHapticFeedback('light');
            }}
          >
            <Ionicons 
              name="person" 
              size={18} 
              color={emailMode === 'single' ? 'white' : colors.mutedForeground} 
            />
            <Text style={[
              styles.tabText,
              { color: emailMode === 'single' ? 'white' : colors.mutedForeground }
            ]}>
              Single User
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
      >
        {emailMode === 'bulk' ? (
          <>
            {/* Email Stats */}
            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={styles.statsHeader}>
                <Ionicons name="mail" size={24} color={colors.primary} />
                <Text style={[styles.statsTitle, { color: colors.text }]}>Email Statistics</Text>
                {!isLoadingStats && (
                  <TouchableOpacity
                    onPress={fetchEmailStats}
                    style={[styles.refreshButton, { backgroundColor: colors.primary + '20' }]}
                  >
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {emailStats ? (
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{emailStats.total_users}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Users</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{emailStats.users_with_email}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>With Email</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.success }]}>{emailStats.verified_users}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Verified</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.warning }]}>{emailStats.unverified_users}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Unverified</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>{emailStats.eligible_recipients}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Eligible</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading stats...</Text>
                </View>
              )}
            </View>

            {/* Bulk Email Form */}
            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Compose Bulk Email</Text>
              
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Subject *</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  }]}
                  placeholder="Enter email subject"
                  placeholderTextColor={colors.mutedForeground}
                  value={subject}
                  onChangeText={setSubject}
                  textAlignVertical="center"
                  underlineColorAndroid="transparent"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Message *</Text>
                <TextInput
                  style={[styles.textArea, { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  }]}
                  placeholder="Enter your message"
                  placeholderTextColor={colors.mutedForeground}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  underlineColorAndroid="transparent"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Batch Size (for queue)</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  }]}
                  placeholder="Enter batch size"
                  placeholderTextColor={colors.mutedForeground}
                  value={batchSize}
                  onChangeText={setBatchSize}
                  keyboardType="numeric"
                  textAlignVertical="center"
                  underlineColorAndroid="transparent"
                />
              </View>
            </View>

            {/* Bulk Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                  (!subject.trim() || !message.trim() || isSending || isQueuing) && { opacity: 0.6 }
                ]}
                onPress={handleSendEmail}
                disabled={!subject.trim() || !message.trim() || isSending || isQueuing}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Send Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.warning },
                  (!subject.trim() || !message.trim() || isSending || isQueuing) && { opacity: 0.6 }
                ]}
                onPress={handleQueueEmail}
                disabled={!subject.trim() || !message.trim() || isSending || isQueuing}
                activeOpacity={0.8}
              >
                {isQueuing ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="time" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Queue for Later</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Single User Email Form */}
            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Send Email to User</Text>
              
              {/* User Selection */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Select User *</Text>
                <TouchableOpacity
                  style={[styles.userPickerButton, { 
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }]}
                  onPress={() => setShowUserPicker(true)}
                >
                  {selectedUser ? (
                    <View style={styles.selectedUserContainer}>
                      <View style={styles.selectedUserInfo}>
                        <Text style={[styles.selectedUserName, { color: colors.text }]}>
                          {selectedUser.firstname} {selectedUser.lastname}
                        </Text>
                        <Text style={[styles.selectedUserEmail, { color: colors.mutedForeground }]}>
                          {selectedUser.email}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedUser(null);
                          triggerHapticFeedback('light');
                        }}
                        style={styles.clearButton}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.userPickerPlaceholder}>
                      <Ionicons name="person-outline" size={20} color={colors.mutedForeground} />
                      <Text style={[styles.userPickerPlaceholderText, { color: colors.mutedForeground }]}>
                        Tap to select a user
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Subject *</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  }]}
                  placeholder="Enter email subject"
                  placeholderTextColor={colors.mutedForeground}
                  value={singleUserSubject}
                  onChangeText={setSingleUserSubject}
                  textAlignVertical="center"
                  underlineColorAndroid="transparent"
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Message *</Text>
                <TextInput
                  style={[styles.textArea, { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  }]}
                  placeholder="Enter your message"
                  placeholderTextColor={colors.mutedForeground}
                  value={singleUserMessage}
                  onChangeText={setSingleUserMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  underlineColorAndroid="transparent"
                />
              </View>
            </View>

            {/* Single User Action Button */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary },
                  (!selectedUser || !singleUserSubject.trim() || !singleUserMessage.trim() || isSendingSingleEmail) && { opacity: 0.6 }
                ]}
                onPress={handleSendSingleEmail}
                disabled={!selectedUser || !singleUserSubject.trim() || !singleUserMessage.trim() || isSendingSingleEmail}
                activeOpacity={0.8}
              >
                {isSendingSingleEmail ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Send Email</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name="checkmark-circle" 
                size={48} 
                color={colors.success} 
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {successData.type === 'single' 
                  ? 'Email Sent!' 
                  : successData.type === 'send' 
                    ? 'Email Sent!' 
                    : 'Email Queued!'
                }
              </Text>
            </View>

            <View style={styles.modalBody}>
              {successData.type === 'single' ? (
                <>
                  <Text style={[styles.modalText, { color: colors.mutedForeground }]}>
                    Email sent successfully!
                  </Text>
                  <View style={styles.resultStats}>
                    <Text style={[styles.resultText, { color: colors.text }]}>
                      To: {successData.data.user.firstname} {successData.data.user.lastname}
                    </Text>
                    <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
                      {successData.data.user.email}
                    </Text>
                    <Text style={[styles.resultText, { color: colors.text, marginTop: 8 }]}>
                      Subject: {successData.data.email_details.subject}
                    </Text>
                    <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
                      Sent at: {formatDate(successData.data.email_details.sent_at)}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.modalText, { color: colors.mutedForeground }]}>
                    {successData.type === 'send' 
                      ? `Successfully sent to ${successData.data.successful} recipients`
                      : `Email queued with batch ID: ${successData.data.batch_id}`
                    }
                  </Text>
                  
                  {successData.type === 'send' && (
                    <View style={styles.resultStats}>
                      <Text style={[styles.resultText, { color: colors.text }]}>
                        Total Recipients: {successData.data.total_recipients}
                      </Text>
                      <Text style={[styles.resultText, { color: colors.success }]}>
                        Successful: {successData.data.successful}
                      </Text>
                      <Text style={[styles.resultText, { color: colors.destructive }]}>
                        Failed: {successData.data.failed}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User Picker Modal */}
      {showUserPicker && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxHeight: '80%' }]}>
            <View style={[styles.modalHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select User</Text>
              <TouchableOpacity
                onPress={() => setShowUserPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchContainer, { 
              borderColor: colors.border,
              backgroundColor: colors.background,
            }]}>
              <Ionicons name="search" size={20} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search by name or email..."
                placeholderTextColor={colors.mutedForeground}
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
                autoFocus
              />
              {userSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setUserSearchQuery('')}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Users List */}
            {isLoadingUsers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading users...</Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {userSearchQuery ? 'No users found' : 'No users available'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.userItem,
                      { 
                        backgroundColor: selectedUser?.id === item.id ? colors.primary + '20' : 'transparent',
                        borderBottomColor: colors.border,
                      }
                    ]}
                    onPress={() => {
                      setSelectedUser(item);
                      setShowUserPicker(false);
                      triggerHapticFeedback('light');
                    }}
                  >
                    <View style={styles.userItemContent}>
                      <View style={[styles.userAvatar, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.userAvatarText, { color: colors.primary }]}>
                          {item.firstname.charAt(0)}{item.lastname.charAt(0)}
                        </Text>
                      </View>
                      <View style={styles.userItemInfo}>
                        <Text style={[styles.userItemName, { color: colors.text }]}>
                          {item.firstname} {item.lastname}
                        </Text>
                        <Text style={[styles.userItemEmail, { color: colors.mutedForeground }]}>
                          {item.email}
                        </Text>
                      </View>
                      {selectedUser?.id === item.id && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.usersList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      )}
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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: 'white',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  resultStats: {
    gap: 8,
  },
  resultText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    gap: 6,
  },
  tabActive: {
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userPickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  selectedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedUserInfo: {
    flex: 1,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedUserEmail: {
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 12,
  },
  userPickerPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userPickerPlaceholderText: {
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearSearchButton: {
    padding: 4,
  },
  usersList: {
    maxHeight: 400,
  },
  userItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userItemEmail: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  closeButton: {
    padding: 4,
  },
});

export default BulkEmailScreen;
