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

interface DataReceiptData {
  reference: string;
  amount: number;
  phone: string;
  service: string;
  date: string;
  network?: string;
  businessName?: string;
  // Transaction details
  transactionId?: number;
  type?: string;
  status?: string;
  oldBalance?: string;
  newBalance?: string;
  info?: string;
  // Data-specific fields
  dataPlan?: string;
  dataAmount?: string;
  megabytes?: string;
}

interface DataReceiptScreenProps {
  receiptData: DataReceiptData;
  onClose: () => void;
}

// Network images
const NETWORK_IMAGES = {
  mtn: require('@/assets/images/mtn.png'),
  airtel: require('@/assets/images/airtel.png'),
  glo: require('@/assets/images/glo.png'),
  '9mobile': require('@/assets/images/9mobile.png'),
};

// Network background colors
const NETWORK_COLORS = {
  mtn: '#fbc404',      // MTN Yellow
  airtel: '#ec1c24',   // Airtel Red
  glo: '#1daa10',      // Glo Green
  '9mobile': '#040404', // 9mobile Black
};

export const DataReceiptScreen: React.FC<DataReceiptScreenProps> = ({
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

  const getNetworkImage = (network?: string | null) => {
    if (!network) return require('@/assets/images/logo.png'); // Default to SureTopUp logo
    
    const networkKey = network.toLowerCase() as keyof typeof NETWORK_IMAGES;
    return NETWORK_IMAGES[networkKey] || require('@/assets/images/logo.png');
  };

  const getNetworkColor = (network?: string | null) => {
    if (!network) return '#00A651'; // Default to green background
    
    const networkKey = network.toLowerCase() as keyof typeof NETWORK_COLORS;
    return NETWORK_COLORS[networkKey] || '#00A651';
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

      await shareReceiptAsPDF(receiptData, 'Data Receipt', viewShotRef);
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
          Data Receipt
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
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
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
              <View style={[styles.networkIconContainer]}>
                <Image 
                  source={getNetworkImage(receiptData.network)} 
                  style={styles.networkIcon}
                  resizeMode="cover"
                />
              </View>
              {/* Amount for user receipts, Data amount for seller receipts */}
              {selectedReceiptType === 'user' ? (
                <Text style={styles.amountValue}>
                  {formatAmount(receiptData.amount)}
                </Text>
              ) : (
                receiptData.megabytes && (
                  <Text style={styles.amountValue}>
                    {receiptData.megabytes}
                  </Text>
                )
              )}
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

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{receiptData.info}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network</Text>
                <Text style={styles.detailValue}>{receiptData.network?.toUpperCase() || 'N/A'}</Text>
              </View>

              {/* Amount - Only show for user receipts */}
              {selectedReceiptType === 'user' && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailValue}>{formatAmount(receiptData.amount)}</Text>
                </View>
              )}

              {/* Data Bundle Information */}
              {receiptData.dataPlan && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data Bundle</Text>
                  <Text style={styles.detailValue}>{receiptData.dataPlan}</Text>
                </View>
              )}

              {/* Data Amount - Different display based on receipt type */}
              {selectedReceiptType === 'user' && receiptData.megabytes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data Amount</Text>
                  <Text style={styles.detailValue}>{receiptData.megabytes}</Text>
                </View>
              )}

              {/* Reseller Receipt - Show only Data (MB/GB format) */}
              {selectedReceiptType === 'seller' && receiptData.megabytes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data</Text>
                  <Text style={styles.detailValue}>{receiptData.megabytes}</Text>
                </View>
              )}

              {/* User Receipt - Show data amount if no megabytes */}
              {selectedReceiptType === 'user' && receiptData.dataAmount && !receiptData.megabytes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data Amount</Text>
                  <Text style={styles.detailValue}>{formatAmount(parseFloat(receiptData.dataAmount))}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(receiptData.date)}</Text>
              </View>

              {/* User Receipt - Show balance info */}
              {selectedReceiptType === 'user' && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Previous Balance</Text>
                    <Text style={styles.detailValue}>
                      {receiptData.oldBalance ? formatAmount(parseFloat(receiptData.oldBalance)) : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>New Balance</Text>
                    <Text style={styles.detailValue}>
                      {receiptData.newBalance ? formatAmount(parseFloat(receiptData.newBalance)) : 'N/A'}
                    </Text>
                  </View>
                </>
              )}

            </View>

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <View style={styles.dottedLine} />
              <Text style={styles.footerText}>
                Thank you for using SureTopUp
              </Text>
              <Text style={styles.footerSubtext}>
                For support, contact us @info@suretopup.com.ng
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
  networkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 32,
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
  networkIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 2,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  successSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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

export default DataReceiptScreen;
