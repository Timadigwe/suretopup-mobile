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

const { width } = Dimensions.get('window');

interface CardPrintingReceiptData {
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
  // Card printing specific fields
  business_name?: string;
  quantity?: number;
  epins?: Array<{
    amount: string;
    pin: string;
    serial: string;
    instruction: string;
  }>;
}

interface CardPrintingReceiptScreenProps {
  receiptData: CardPrintingReceiptData;
  onClose: () => void;
}

// Network images
const NETWORK_IMAGES = {
  mtn: require('@/assets/images/mtn.jpeg'),
  airtel: require('@/assets/images/airtel.jpg'),
  glo: require('@/assets/images/glo.jpg'),
  '9mobile': require('@/assets/images/9mobile.png'),
};

// Network background colors
const NETWORK_COLORS = {
  mtn: '#fbc404',      // MTN Yellow
  airtel: '#ec1c24',   // Airtel Red
  glo: '#1daa10',      // Glo Green
  '9mobile': '#040404', // 9mobile Black
};

export const CardPrintingReceiptScreen: React.FC<CardPrintingReceiptScreenProps> = ({
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

      const viewShot = viewShotRef.current;
      if (viewShot && viewShot.capture) {
        const uri = await viewShot.capture();

        // Share the image
        await Share.share({
          url: uri,
          message: `Card printing receipt for ${receiptData.business_name || receiptData.businessName || 'N/A'} - ${formatAmount(receiptData.amount)}`,
        });
      }
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
    // Create more watermarks to ensure full coverage for long receipts with multiple ePIN cards
    // Using numeric values for better TypeScript compatibility and consistent spacing
    const watermarkPositions = [
      // Left column - 12 watermarks for better coverage
      { left: 20, top: 50 },
      { left: 20, top: 120 },
      { left: 20, top: 190 },
      { left: 20, top: 260 },
      { left: 20, top: 330 },
      { left: 20, top: 400 },
      { left: 20, top: 470 },
      { left: 20, top: 540 },
      { left: 20, top: 610 },
      { left: 20, top: 680 },
      { left: 20, top: 750 },
      { left: 20, top: 820 },
      // Middle column - 12 watermarks
      { left: width / 2 - 15, top: 50 },
      { left: width / 2 - 15, top: 120 },
      { left: width / 2 - 15, top: 190 },
      { left: width / 2 - 15, top: 260 },
      { left: width / 2 - 15, top: 330 },
      { left: width / 2 - 15, top: 400 },
      { left: width / 2 - 15, top: 470 },
      { left: width / 2 - 15, top: 540 },
      { left: width / 2 - 15, top: 610 },
      { left: width / 2 - 15, top: 680 },
      { left: width / 2 - 15, top: 750 },
      { left: width / 2 - 15, top: 820 },
      // Right column - 12 watermarks
      { right: 20, top: 50 },
      { right: 20, top: 120 },
      { right: 20, top: 190 },
      { right: 20, top: 260 },
      { right: 20, top: 330 },
      { right: 20, top: 400 },
      { right: 20, top: 470 },
      { right: 20, top: 540 },
      { right: 20, top: 610 },
      { right: 20, top: 680 },
      { right: 20, top: 750 },
      { right: 20, top: 820 },
    ];

    return watermarkPositions.map((position, index) => (
      <View
        key={index}
        style={[
          styles.watermark,
          {
            position: 'absolute',
            ...position,
          },
        ]}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.watermarkImage}
          resizeMode="contain"
        />
      </View>
    ));
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
          Card Printing Receipt
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
                  <Text style={styles.receiptTitle}>Card Printing Receipt</Text>
                </View>
              </View>
            </View>


            {/* Success Message */}
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Card Printing Successful!
              </Text>
              <Text style={styles.successSubtext}>
                Your recharge cards have been generated successfully
              </Text>
            </View>

            {/* Receipt Details */}
            <View style={styles.receiptDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference</Text>
                <Text style={styles.detailValue}>{receiptData.reference}</Text>
              </View>



              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network</Text>
                <Text style={styles.detailValue}>{receiptData.network?.toUpperCase() || 'N/A'}</Text>
              </View>


              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>{formatAmount(receiptData.amount)}</Text>
              </View>

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

              {/* Card Details Section */}
              {receiptData.epins && receiptData.epins.length > 0 && (
                <View style={styles.cardDetailsSection}>
                  <View style={styles.dottedLine} />
                  <Text style={styles.sectionTitle}>Card Details</Text>

                  {receiptData.epins.map((epin, index) => (
                    <View key={index} style={styles.cardDetailItem}>
                      {/* Network and Business Info */}
                      <View style={styles.cardHeader}>
                        <View style={styles.cardNetworkInfo}>
                          <View style={[styles.cardNetworkIconContainer, { backgroundColor: getNetworkColor(receiptData.network) }]}>
                            <Image
                              source={getNetworkImage(receiptData.network)}
                              style={styles.cardNetworkIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.cardNetworkText}>
                            <Text style={styles.cardNetworkName}>{receiptData.network?.toUpperCase() || 'N/A'}</Text>
                            <Text style={styles.cardBusinessName}>{receiptData.business_name || receiptData.businessName || 'SureTopUp'}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.cardDetailRow}>
                        <Text style={styles.cardDetailLabel}>Card {index + 1}</Text>
                        <Text style={styles.cardDetailValue}>{formatAmount(parseFloat(epin.amount))}</Text>
                      </View>
                      <View style={styles.cardDetailRow}>
                        <Text style={styles.cardDetailLabel}>Serial</Text>
                        <Text style={styles.cardDetailValue}>{epin.serial}</Text>
                      </View>
                      <View style={styles.cardDetailRow}>
                        <Text style={styles.cardDetailLabel}>PIN</Text>
                        <Text style={[styles.cardDetailValue,{fontSize: 15, fontWeight: 'bold'}]}>{epin.pin}</Text>
                      </View>
                      {epin.instruction && (
                        <View style={styles.cardDetailRow}>
                          <Text style={styles.cardDetailLabel}>Instructions</Text>
                          <Text style={styles.cardDetailValue}>{epin.instruction}</Text>
                        </View>
                      )}
                      {index < (receiptData.epins?.length || 0) - 1 && (
                        <View style={styles.cardSeparator} />
                      )}
                    </View>
                  ))}
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
    minHeight: 600,
  },
  watermark: {
    opacity: 0.05,
    zIndex: 1,
  },
  watermarkImage: {
    width: 30,
    height: 30,
  },
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
  headerText: {
    flex: 1,
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
  },
  networkIconContainer: {
    width: 64,
    height: 64,
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
  cardDetailsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardDetailItem: {
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cardNetworkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardNetworkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardNetworkIcon: {
    width: 24,
    height: 24,
  },
  cardNetworkText: {
    flex: 1,
  },
  cardNetworkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  cardBusinessName: {
    fontSize: 14,
    color: '#666',
  },
  cardDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cardDetailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  cardDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
    borderStyle: 'dotted',
  },
  dottedLine: {
    width: '100%',
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    borderStyle: 'dotted',
    marginBottom: 16,
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

export default CardPrintingReceiptScreen;
