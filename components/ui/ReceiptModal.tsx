import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';

interface ReceiptData {
  reference: string;
  amount: number;
  phone: string;
  service: string;
  date: string;
  network?: string;
  dataPlan?: string;
  transaction_id?: number;
  new_balance?: number;
}

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

const { width } = Dimensions.get('window');

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  onClose,
  receiptData,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!visible || !receiptData) return null;

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle different date formats
      let date: Date;
      
      if (dateString.includes('T')) {
        // ISO format like "2025-08-26T15:15:43.061784Z"
        date = new Date(dateString);
      } else if (dateString.includes('th') || dateString.includes('st') || dateString.includes('nd') || dateString.includes('rd')) {
        // Format like "August 26th, 2025"
        const cleanDate = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
        date = new Date(cleanDate);
      } else {
        // Try direct parsing
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  const handleShare = async () => {
    try {
      triggerHapticFeedback('light');
      
      // Capture the receipt as an image first
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        
        // Share the image
        await Share.share({
          url: uri,
          title: `${receiptData.service} Receipt`,
          message: `Receipt for ${receiptData.service} transaction - Reference: ${receiptData.reference}`,
        });
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      triggerHapticFeedback('medium');
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to save the receipt to your gallery.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Capture the receipt as an image
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        
        // Save to media library
        await MediaLibrary.saveToLibraryAsync(uri);
        
        Alert.alert(
          'Receipt Saved!',
          'Receipt has been saved to your gallery.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert(
        'Error',
        'Failed to save receipt. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getServiceIcon = () => {
    switch (receiptData.service.toLowerCase()) {
      case 'airtime':
        return 'phone-portrait';
      case 'data':
        return 'cellular';
      default:
        return 'receipt';
    }
  };

  const getServiceColor = () => {
    switch (receiptData.service.toLowerCase()) {
      case 'airtime':
        return '#3B82F6';
      case 'data':
        return '#8B5CF6';
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: colors.card }]}>
        {/* Header */}
        <LinearGradient
          colors={[getServiceColor(), getServiceColor() + 'E0']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name={getServiceIcon()} size={24} color="white" />
            </View>
            <Text style={styles.headerTitle}>Transaction Receipt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Receipt Content */}
        <View style={styles.content}>
          {/* ViewShot for Receipt Capture */}
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 0.9,
              result: 'tmpfile',
            }}
            style={styles.receiptCaptureContainer}
          >
          {/* Success Icon */}
          <View style={[styles.successIconContainer, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          </View>

          <Text style={[styles.successTitle, { color: colors.text }]}>
            {receiptData.service} Purchase Successful!
          </Text>

          {/* Receipt Details */}
          <View style={[styles.receiptCard, { backgroundColor: colors.background }]}>
            {/* Receipt Header */}
            <View style={styles.receiptHeader}>
              <View style={[styles.receiptLogo, { backgroundColor: getServiceColor() + '20' }]}>
                <Ionicons name={getServiceIcon()} size={24} color={getServiceColor()} />
              </View>
              <View style={styles.receiptHeaderText}>
                <Text style={[styles.receiptCompany, { color: colors.text }]}>
                  SureTopUp
                </Text>
                <Text style={[styles.receiptType, { color: colors.mutedForeground }]}>
                  {receiptData.service} Receipt
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>
                Reference
              </Text>
              <Text style={[styles.receiptValue, { color: colors.text }]}>
                {receiptData.reference}
              </Text>
            </View>

            <View style={[styles.receiptRow, styles.amountRow]}>
              <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>
                Amount
              </Text>
              <Text style={[styles.receiptValue, styles.amountValue, { color: getServiceColor() }]}>
                {formatAmount(receiptData.amount)}
              </Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>
                Phone Number
              </Text>
              <Text style={[styles.receiptValue, { color: colors.text }]}>
                {receiptData.phone}
              </Text>
            </View>

            {receiptData.network && (
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>
                  Network
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {receiptData.network}
                </Text>
              </View>
            )}

            {receiptData.dataPlan && (
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>
                  Data Plan
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {receiptData.dataPlan}
                </Text>
              </View>
            )}

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>
                Date & Time
              </Text>
              <Text style={[styles.receiptValue, { color: colors.text }]}>
                {formatDate(receiptData.date)}
              </Text>
            </View>

            <View style={[styles.receiptRow, styles.statusRow]}>
              <Text style={[styles.receiptLabel, { color: colors.mutedForeground }]}>
                Status
              </Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusText, { color: colors.success }]}>
                  Completed
                </Text>
              </View>
            </View>
          </View>

          {/* Receipt Footer */}
          <View style={[styles.receiptFooter, { backgroundColor: colors.background }]}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Thank you for using SureTopUp!
            </Text>
            <Text style={[styles.footerSubtext, { color: colors.mutedForeground }]}>
              For support, contact us at support@suretopup.com
            </Text>
          </View>
          </ViewShot>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.background }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="download" size={20} color={colors.primary} />
              )}
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                {isSaving ? 'Saving...' : 'Save Receipt'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share" size={20} color="white" />
              <Text style={[styles.actionButtonText, { color: 'white' }]}>
                Share Receipt
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: width - 48,
    maxHeight: '90%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  closeButton: {
    padding: Platform.OS === 'android' ? 8 : 4,
    marginTop: Platform.OS === 'android' ? 4 : 0,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    maxHeight: '85%',
  },
  receiptCaptureContainer: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  receiptCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receiptHeaderText: {
    flex: 1,
  },
  receiptCompany: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  receiptType: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  receiptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
    color: '#1F2937',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusRow: {
    justifyContent: 'space-between',
  },
  amountRow: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 8,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  receiptFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeReceiptButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeReceiptText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
