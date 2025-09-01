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
  bettingCompany?: string;
  bettingCustomer?: string;
  businessName?: string;
  quantity?: string;
  denomination?: string;
  epins?: Array<{
    pin: string;
    serial: string;
    instruction: string;
    amount: string;
  }>;
}

interface TransactionReceiptScreenProps {
  receiptData: ReceiptData;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

// Network provider images
const NETWORK_IMAGES = {
  mtn: require('@/assets/images/mtn.jpeg'),
  airtel: require('@/assets/images/airtel.jpg'),
  glo: require('@/assets/images/glo.jpg'),
  '9mobile': require('@/assets/images/9mobile.png'),
};

export const TransactionReceiptScreen: React.FC<TransactionReceiptScreenProps> = ({
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

  const handleShare = async () => {
    triggerHapticFeedback('light');
    
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        
        await Share.share({
          url: Platform.OS === 'ios' ? uri : `file://${uri}`,
          title: `${receiptData.service} Receipt`,
          message: `Receipt for ${receiptData.service} transaction - ${receiptData.reference}`,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const handleSaveToGallery = async () => {
    triggerHapticFeedback('light');
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save to gallery');
        return;
      }
      
      setIsSaving(true);
      
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', 'Receipt saved to gallery');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save receipt to gallery');
    } finally {
      setIsSaving(false);
    }
  };

  const getServiceColor = () => {
    switch (receiptData.service.toLowerCase()) {
      case 'airtime':
        return '#00A900';
      case 'data':
        return '#2563eb';
      case 'betting':
        return '#dc2626';
      case 'electricity':
        return '#eab308';
      case 'bills':
        return '#9333ea';
      case 'printing':
        return '#ea580c';
      default:
        return '#10B981';
    }
  };

  const getNetworkImage = () => {
    if (!receiptData.network) return null;
    const networkKey = receiptData.network.toLowerCase();
    
    // Handle different network name variations
    if (networkKey === 'mtn') return NETWORK_IMAGES.mtn;
    if (networkKey === 'airtel') return NETWORK_IMAGES.airtel;
    if (networkKey === 'glo') return NETWORK_IMAGES.glo;
    if (networkKey === '9mobile') return NETWORK_IMAGES['9mobile'];
    
    return null;
  };

  const getNetworkBackgroundColor = () => {
    if (!receiptData.network) return '#f8f9fa';
    const networkKey = receiptData.network.toLowerCase();
    
    // Network-specific background colors
    switch (networkKey) {
      case 'mtn':
        return '#fbc404';
      case 'airtel':
        return '#ec1c24';
      case 'glo':
        return '#1daa10';
      case '9mobile':
        return '#040404';
      default:
        return '#f8f9fa';
    }
  };

  const getUserFullName = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    return user?.firstname || user?.lastname || 'SureTopUp User';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#ffffff' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#000000' }]}>
          Transaction Receipt
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={20} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSaveToGallery}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#000000" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Receipt Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
          {/* App Logo and Name */}
          <View style={styles.logoSection}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
            <Text style={[styles.appName, { color: colors.text }]}>
              SureTopUp
            </Text>
          </View>

          {/* Network Provider Image */}
          {getNetworkImage() && (
            <View style={styles.networkImageContainer}>
              <View style={[styles.networkImageWrapper, { backgroundColor: getNetworkBackgroundColor() }]}>
                <Image
                  source={getNetworkImage()!}
                  style={styles.networkImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}
          
          {/* Fallback Network Name if no image */}
          {!getNetworkImage() && receiptData.network && (
            <View style={styles.networkImageContainer}>
              <View style={[styles.networkFallback, { backgroundColor: getNetworkBackgroundColor() }]}>
                <Text style={[styles.networkFallbackText, { color: '#ffffff' }]}>
                  {receiptData.network}
                </Text>
              </View>
            </View>
          )}
          


          {/* Amount */}
          <Text style={[styles.amount, { color: getServiceColor() }]}>
            {formatAmount(receiptData.amount)}
          </Text>

          {/* Success Text */}
          <Text style={[styles.successText, { color: colors.text }]}>
            Transaction Successful
          </Text>

          {/* Date and Time */}
          <Text style={[styles.dateTime, { color: colors.mutedForeground }]}>
            {formatDate(receiptData.date)}
          </Text>

          {/* Dotted Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dottedDivider, { borderColor: colors.border }]} />
          </View>

          {/* Transaction Details */}
          <View style={styles.transactionDetails}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Transaction Type
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {receiptData.service}
              </Text>
            </View>

            {receiptData.network && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Network
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {receiptData.network}
                </Text>
              </View>
            )}

            {receiptData.phone && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Recipient Mobile Number
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {receiptData.phone}
                </Text>
              </View>
            )}

            {receiptData.bettingCompany && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Betting Company
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {receiptData.bettingCompany}
                </Text>
              </View>
            )}

            {receiptData.bettingCustomer && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Betting Customer
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {receiptData.bettingCustomer}
                </Text>
              </View>
            )}

            {receiptData.businessName && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Business Name
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {receiptData.businessName}
                </Text>
              </View>
            )}

            {receiptData.quantity && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Quantity
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {receiptData.quantity} {parseInt(receiptData.quantity) === 1 ? 'ePIN' : 'ePINs'}
                </Text>
              </View>
            )}

            {receiptData.denomination && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Denomination
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  ₦{receiptData.denomination}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Account Name
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {getUserFullName()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Payment Amount
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatAmount(receiptData.amount)}
              </Text>
            </View>

            {receiptData.dataPlan && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Payment Item
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {receiptData.dataPlan}
                </Text>
              </View>
            )}

            {receiptData.transaction_id && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  Transaction ID
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  #{receiptData.transaction_id}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Transaction Time
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(receiptData.date)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Completed Time
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(receiptData.date)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Status
              </Text>
              <Text style={[styles.detailValue, { color: colors.success }]}>
                Successful
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                Applicable Country
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                NG
              </Text>
            </View>
          </View>

          {/* e-Card Pins Section */}
          {receiptData.epins && receiptData.epins.length > 0 && (
            <View style={styles.epinsSection}>
              <View style={styles.epinsHeader}>
                <Text style={[styles.epinsTitle, { color: colors.text }]}>
                  e-Card Pins
                </Text>
              </View>
              
              {receiptData.epins.map((epin, index) => (
                <View key={index} style={styles.epinCard}>
                  <View style={styles.epinCardHeader}>
                    <Text style={[styles.epinNumber, { color: colors.primary }]}>
                      Pin #{index + 1}
                    </Text>
                    <Text style={[styles.epinAmount, { color: getServiceColor() }]}>
                      ₦{epin.amount}
                    </Text>
                  </View>
                  
                  <View style={styles.epinDetails}>
                    <View style={styles.epinDetailRow}>
                      <Text style={[styles.epinLabel, { color: colors.mutedForeground }]}>
                        PIN:
                      </Text>
                      <Text style={[styles.epinValue, { color: colors.text }]}>
                        {epin.pin}
                      </Text>
                    </View>
                    
                    <View style={styles.epinDetailRow}>
                      <Text style={[styles.epinLabel, { color: colors.mutedForeground }]}>
                        Serial:
                      </Text>
                      <Text style={[styles.epinValue, { color: colors.text }]}>
                        {epin.serial}
                      </Text>
                    </View>
                    
                    <View style={styles.epinDetailRow}>
                      <Text style={[styles.epinLabel, { color: colors.mutedForeground }]}>
                        Dial:
                      </Text>
                      <Text style={[styles.epinValue, { color: colors.text }]}>
                        {epin.instruction}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Thank you for using SureTopUp!
            </Text>
            <Text style={[styles.footerSubtext, { color: colors.mutedForeground }]}>
              Keep this receipt for your records
            </Text>
          </View>
        </ViewShot>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: getServiceColor() }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  receiptCaptureContainer: {
    marginHorizontal: 15,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  networkImageContainer: {
    marginBottom: 20,
  },
  networkImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  networkImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkFallbackText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 14,
    marginBottom: 30,
  },
  dividerContainer: {
    width: '100%',
    marginBottom: 30,
  },
  dottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  transactionDetails: {
    width: '100%',
    alignItems: 'center',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  bottomActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  epinsSection: {
    width: '100%',
    marginTop: 30,
  },
  epinsHeader: {
    marginBottom: 20,
  },
  epinsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  epinCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  epinCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  epinNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  epinAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  epinDetails: {
    gap: 8,
  },
  epinDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  epinLabel: {
    fontSize: 14,
    flex: 1,
  },
  epinValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
});
