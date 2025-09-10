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
  ScrollView,
  Image,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';

interface DepositReceiptData {
  reference: string;
  amount: number;
  service: string;
  date: string;
  businessName?: string;
  // Transaction details
  transactionId?: number;
  type?: string;
  status?: string;
  oldBalance?: string;
  newBalance?: string;
  info?: string;
}

interface DepositReceiptScreenProps {
  receiptData: DepositReceiptData;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const DepositReceiptScreen: React.FC<DepositReceiptScreenProps> = ({
  receiptData,
  onClose,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user } = useAuth();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    try {
      triggerHapticFeedback('light');
      setIsSaving(true);

      const viewShot = viewShotRef.current;
      if (viewShot && viewShot.capture) {
        const uri = await viewShot.capture();
        
        // Request permission to save to media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant permission to save the receipt.');
          return;
        }

        // Save to media library
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'Receipt saved to your photo library!');
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      triggerHapticFeedback('light');
      setIsSaving(true);

      const viewShot = viewShotRef.current;
      if (viewShot && viewShot.capture) {
        const uri = await viewShot.capture();
        
        // Share the image
        await Share.share({
          url: uri,
          message: `Receipt for ${receiptData.service} - ${formatAmount(receiptData.amount)}`,
        });
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    triggerHapticFeedback('light');
    onClose();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={handleDone}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Deposit Receipt
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.shareButton}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="download-outline" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Receipt Content */}
        <ViewShot
          ref={viewShotRef}
          options={{
            fileName: `deposit-receipt-${receiptData.reference}`,
            format: 'jpg',
            quality: 0.9,
          }}
          style={styles.receiptContainer}
        >
          <View style={styles.receipt}>
            {/* Multiple Logo Watermarks - Vertical Columns */}
            <View style={styles.watermarkContainer}>
              {/* Left Column */}
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkLeft1]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkLeft2]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkLeft3]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkLeft4]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkLeft5]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkLeft6]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkLeft7]}
                resizeMode="contain"
              />
              
              {/* Middle Column */}
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkMiddle1]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkMiddle2]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkMiddle3]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkMiddle4]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkMiddle5]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkMiddle6]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkMiddle7]}
                resizeMode="contain"
              />
              
              {/* Right Column */}
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkRight1]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkRight2]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkRight3]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkRight4]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkRight5]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkRight6]}
                resizeMode="contain"
              />
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={[styles.watermarkLogo, styles.watermarkRight7]}
                resizeMode="contain"
              />
            </View>

            {/* Header */}
            <View style={styles.receiptHeader}>
              <View style={styles.headerContent}>
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('@/assets/images/logo.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.businessName}>
                    {receiptData.businessName || 'SureTopUp'}
                  </Text>
                  <Text style={styles.receiptTitle}>Deposit Receipt</Text>
                </View>
              </View>
            </View>

            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={[styles.successIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="checkmark" size={32} color="white" />
              </View>
              <Text style={styles.successText}>Deposit Successful</Text>
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount Deposited</Text>
              <Text style={styles.amountValue}>
                {formatAmount(receiptData.amount)}
              </Text>
            </View>

            {/* Dotted Line Before Details */}
            <View style={styles.dottedLine} />

            {/* Transaction Details */}
            <View style={styles.transactionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={styles.detailValue}>{receiptData.reference}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{formatDate(receiptData.date)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction Type</Text>
                <Text style={styles.detailValue}>{receiptData.service}</Text>
              </View>

              {/* Transaction ID */}
              {receiptData.transactionId && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>#{receiptData.transactionId}</Text>
                </View>
              )}

              {/* Transaction Type (Credit/Debit) */}
              {receiptData.type && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{receiptData.type}</Text>
                </View>
              )}

              {/* Transaction Status */}
              {receiptData.status && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={styles.detailValue}>{receiptData.status}</Text>
                </View>
              )}

              {/* Balance Changes */}
              {receiptData.oldBalance && receiptData.newBalance && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Previous Balance</Text>
                    <Text style={styles.detailValue}>
                      ₦{parseFloat(receiptData.oldBalance).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>New Balance</Text>
                    <Text style={styles.detailValue}>
                      ₦{parseFloat(receiptData.newBalance).toLocaleString()}
                    </Text>
                  </View>
                </>
              )}

              {/* Additional Info */}
              {receiptData.info && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Additional Info</Text>
                  <Text style={styles.detailValue}>{receiptData.info}</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <View style={styles.dottedLine} />
              <Text style={styles.footerText}>
                Thank you for using SureTopUp
              </Text>
              <Text style={styles.footerSubtext}>
                Keep this receipt for your records
              </Text>
            </View>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="white" />
                <Text style={styles.actionButtonText}>Share Receipt</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.doneButton, { borderColor: colors.primary }]}
            onPress={handleDone}
          >
            <Text style={[styles.doneButtonText, { color: colors.primary }]}>
              Done
            </Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
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
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 20 : 32,
  },
  receiptContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  receipt: {
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  watermarkLogo: {
    width: 50,
    height: 50,
    opacity: 0.06,
    position: 'absolute',
  },
  // Left Column - Using percentage positioning to cover full height with proper margins
  watermarkLeft1: { top: '8%', left: 10 },
  watermarkLeft2: { top: '22%', left: 10 },
  watermarkLeft3: { top: '36%', left: 10 },
  watermarkLeft4: { top: '50%', left: 10 },
  watermarkLeft5: { top: '64%', left: 10 },
  watermarkLeft6: { top: '78%', left: 10 },
  watermarkLeft7: { top: '92%', left: 10 },
  // Middle Column - Using percentage positioning to cover full height with proper margins
  watermarkMiddle1: { top: '8%', left: '50%', marginLeft: -25 },
  watermarkMiddle2: { top: '22%', left: '50%', marginLeft: -25 },
  watermarkMiddle3: { top: '36%', left: '50%', marginLeft: -25 },
  watermarkMiddle4: { top: '50%', left: '50%', marginLeft: -25 },
  watermarkMiddle5: { top: '64%', left: '50%', marginLeft: -25 },
  watermarkMiddle6: { top: '78%', left: '50%', marginLeft: -25 },
  watermarkMiddle7: { top: '92%', left: '50%', marginLeft: -25 },
  // Right Column - Using percentage positioning to cover full height with proper margins
  watermarkRight1: { top: '8%', right: 10 },
  watermarkRight2: { top: '22%', right: 10 },
  watermarkRight3: { top: '36%', right: 10 },
  watermarkRight4: { top: '50%', right: 10 },
  watermarkRight5: { top: '64%', right: 10 },
  watermarkRight6: { top: '78%', right: 10 },
  watermarkRight7: { top: '92%', right: 10 },
  receiptHeader: {
    marginBottom: 24,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
    textAlign: 'left',
  },
  receiptTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    textAlign: 'left',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 1,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00A900',
  },
  transactionDetails: {
    marginBottom: 24,
    zIndex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderStyle: 'dashed',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingTop: 16,
    zIndex: 1,
  },
  dottedLine: {
    width: '100%',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DepositReceiptScreen;
