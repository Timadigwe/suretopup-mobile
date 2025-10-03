import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { shareReceiptAsPDF } from '@/utils/receiptPDFGenerator';

const { width } = Dimensions.get('window');

interface BettingReceiptData {
  reference: string;
  amount: number;
  phone: string;
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
  // Betting specific fields
  company_name?: string;
  customer_id?: string;
  customer_name?: string;
  customer_username?: string;
  customer_email?: string;
  customer_phone?: string;
  order_id?: number;
  amount_charged?: string;
  discount?: string;
  initial_balance?: string;
  final_balance?: string;
}

interface BettingReceiptScreenProps {
  receiptData: BettingReceiptData;
  onClose: () => void;
}

// Function to get the correct image for each betting company
const getBettingCompanyImage = (companyName: string) => {
  // Map company names to their specific images
  const companyImages: { [key: string]: any } = {
    'bet9ja': require('@/assets/images/bet9ja.png'),
    //'sportybet': require('@/assets/images/sportybet.png'),
    '1xbet': require('@/assets/images/1xbet.png'),
    'merrybet': require('@/assets/images/merrybet.png'),
    'nairabet': require('@/assets/images/nairabet.png'),
    // Add more company images as they become available
  };
  
  const normalizedName = companyName?.toLowerCase().replace(/\s+/g, '');
  return companyImages[normalizedName] || null; // Return null if no specific image found
};

// Function to get the background color for betting company icons
const getBettingCompanyColor = (companyName: string) => {
  // Default to green background for SureTopUp logo
  return '#00A651';
};

export const BettingReceiptScreen: React.FC<BettingReceiptScreenProps> = ({
  receiptData,
  onClose,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user } = useAuth();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedReceiptType, setSelectedReceiptType] = useState<'user' | 'seller'>('user');

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
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
        if (status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('Success', 'Receipt saved to your photo library');
        } else {
          Alert.alert('Permission Required', 'Please grant permission to save photos');
        }
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
      setIsSharing(true);

      await shareReceiptAsPDF(receiptData, 'Betting Receipt', viewShotRef);
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDone = () => {
    triggerHapticFeedback('light');
    onClose();
  };

  const toggleReceiptType = () => {
    triggerHapticFeedback('light');
    setSelectedReceiptType(prev => prev === 'user' ? 'seller' : 'user');
  };

  const renderWatermarks = () => {
    return (
      <View style={styles.watermarkContainer}>
        {/* Left Column */}
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkLeft1]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkLeft2]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkLeft3]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkLeft4]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkLeft5]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkLeft6]} 
          resizeMode="contain" 
        />

        {/* Right Column */}
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkRight1]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkRight2]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkRight3]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkRight4]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkRight5]} 
          resizeMode="contain" 
        />
        <Image 
          source={require('@/assets/images/full-logo.jpeg')} 
          style={[styles.watermarkLogo, styles.watermarkRight6]} 
          resizeMode="contain" 
        />
      </View>
    );
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
          Betting Receipt
        </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerIconButton}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="download-outline" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerIconButton}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="share-outline" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.8 }}>
          <View style={[styles.receiptContainer, { backgroundColor: 'white' }]}>
            {/* Watermarks */}
            {renderWatermarks()}

            {/* Header */}
            <View style={styles.receiptHeader}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/full-logo.jpeg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Success Section */}
            <View style={styles.successIconContainer}>
              <View style={[styles.companyIconContainer, { backgroundColor: getBettingCompanyColor(receiptData.company_name || receiptData.service || '') }]}>
                {receiptData.company_name && getBettingCompanyImage(receiptData.company_name) ? (
                  <Image
                    source={getBettingCompanyImage(receiptData.company_name)}
                    style={styles.companyLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name="trophy"
                    size={32}
                    color="white"
                  />
                )}
              </View>
              <Text style={styles.amountValue}>
                {formatAmount(receiptData.amount)}
              </Text>
              <Text style={[styles.amountLabel, {fontSize: 20}]}>Successful Transaction</Text>
              <Text style={[styles.detailValue, {fontWeight: '400'}]}>{formatDate(receiptData.date)}</Text>
            </View>

            {/* Dotted Line Before Details */}
            <View style={styles.dottedLine} />

            {/* Receipt Details */}
            <View style={styles.receiptDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={styles.detailValue}>{receiptData.reference}</Text>
              </View>

              {receiptData.company_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Company</Text>
                  <Text style={styles.detailValue}>{receiptData.company_name}</Text>
                </View>
              )}

              {receiptData.customer_id && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer ID</Text>
                  <Text style={styles.detailValue}>{receiptData.customer_id}</Text>
                </View>
              )}

              {receiptData.customer_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer Name</Text>
                  <Text style={styles.detailValue}>{receiptData.customer_name}</Text>
                </View>
              )}

              {receiptData.customer_username && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Username</Text>
                  <Text style={styles.detailValue}>{receiptData.customer_username}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>{formatAmount(receiptData.amount)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(receiptData.date)}</Text>
              </View>

              {/* User Receipt - Show balance info only if available */}
              {selectedReceiptType === 'user' && (
                <>
                  {/* Previous Balance - Check both oldBalance and initial_balance */}
                  {(receiptData.oldBalance || receiptData.initial_balance) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Previous Balance</Text>
                      <Text style={styles.detailValue}>
                        {formatAmount(parseFloat(receiptData.oldBalance || receiptData.initial_balance || '0'))}
                      </Text>
                    </View>
                  )}
                  {/* New Balance - Check both newBalance and final_balance */}
                  {(receiptData.newBalance || receiptData.final_balance) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>New Balance</Text>
                      <Text style={styles.detailValue}>
                        {formatAmount(parseFloat(receiptData.newBalance || receiptData.final_balance || '0'))}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Additional Betting Details */}
              {receiptData.order_id && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>{receiptData.order_id}</Text>
                </View>
              )}

              {receiptData.amount_charged && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount Charged</Text>
                  <Text style={styles.detailValue}>{receiptData.amount_charged}</Text>
                </View>
              )}

              {receiptData.discount && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Discount</Text>
                  <Text style={styles.detailValue}>{receiptData.discount}</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <View style={styles.dottedLine} />
              <Text style={styles.footerText}>
                Thank you for using SureTopUp
              </Text>
            </View>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={toggleReceiptType}
          >
            <Ionicons 
              name="swap-horizontal" 
              size={20} 
              color="white" 
              style={styles.actionButtonIcon}
            />
            <Text style={styles.actionButtonText}>
              {selectedReceiptType === 'user' ? 'Switch to Seller Receipt' : 'Switch to User Receipt'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.doneButton, { borderColor: colors.primary }]}
            onPress={handleDone}
          >
            <Text style={[styles.actionButtonText, styles.doneButtonText, { color: colors.primary }]}>
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
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  receiptContainer: {
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
    minHeight: 400,
    maxHeight: 800,
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
    width: 170,
    height: 150,
    opacity: 0.06,
    position: 'absolute',
  },
  watermarkLeft1: {
    top: '5%',
    left: 10,
  },
  watermarkLeft2: {
    top: '20%',
    left: 10,
  },
  watermarkLeft3: {
    top: '35%',
    left: 10,
  },
  watermarkLeft4: {
    top: '50%',
    left: 10,
  },
  watermarkLeft5: {
    top: '65%',
    left: 10,
  },
  watermarkLeft6: {
    top: '80%',
    left: 10,
  },
  watermarkRight1: {
    top: '5%',
    right: 10,
  },
  watermarkRight2: {
    top: '20%',
    right: 10,
  },
  watermarkRight3: {
    top: '35%',
    right: 10,
  },
  watermarkRight4: {
    top: '50%',
    right: 10,
  },
  watermarkRight5: {
    top: '65%',
    right: 10,
  },
  watermarkRight6: {
    top: '80%',
    right: 10,
  },
  receiptHeader: {
    zIndex: 1,
  },
  logoContainer: {
    width: 200,
    height: 100,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
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
    textAlign: 'left',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 1,
  },
  companyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 32,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  dottedLine: {
    width: '100%',
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 2,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  receiptDetails: {
    marginBottom: 32,
    zIndex: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    borderStyle: 'dotted',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  receiptFooter: {
    alignItems: 'center',
    zIndex: 2,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonIcon: {
    marginRight: 4,
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

export default BettingReceiptScreen;
