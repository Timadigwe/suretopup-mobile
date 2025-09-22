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

interface BulkEmailScreenProps {
  onBack: () => void;
}

export const BulkEmailScreen: React.FC<BulkEmailScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [batchSize, setBatchSize] = useState('1000');
  const [isSending, setIsSending] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [emailStats, setEmailStats] = useState<BulkEmailStats | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    fetchEmailStats();
  }, []);

  const fetchEmailStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await apiService.getBulkEmailStats();
      if (response.success && response.data) {
        setEmailStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch email stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Bulk Email</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
      >
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

        {/* Email Form */}
        <View style={[styles.formCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Compose Email</Text>
          
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

        {/* Action Buttons */}
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
                {successData.type === 'send' ? 'Email Sent!' : 'Email Queued!'}
              </Text>
            </View>

            <View style={styles.modalBody}>
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
});

export default BulkEmailScreen;
