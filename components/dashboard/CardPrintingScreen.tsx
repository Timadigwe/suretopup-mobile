import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { CustomModal } from '@/components/ui/CustomModal';

interface CardPrintingScreenProps {
  onNavigate: (page: string, data?: any) => void;
}

const { width } = Dimensions.get('window');

// Network provider constants
const NETWORK_PROVIDERS = {
  mtn: {
    name: 'MTN',
    color: '#fbc404',
    logo: require('@/assets/images/mtn.jpeg'),
  },
  airtel: {
    name: 'Airtel',
    color: '#ec1c24',
    logo: require('@/assets/images/airtel.jpg'),
  },
  glo: {
    name: 'Glo',
    color: '#1daa10',
    logo: require('@/assets/images/glo.jpg'),
  },
  '9mobile': {
    name: '9mobile',
    color: '#040404',
    logo: require('@/assets/images/9mobile.png'),
  },
};

export const CardPrintingScreen: React.FC<CardPrintingScreenProps> = ({ onNavigate }) => {
  const [businessName, setBusinessName] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [amount, setAmount] = useState('100');
  const [quantity, setQuantity] = useState('1');
  const [amountp, setAmountp] = useState('110');
  const [transactionPin, setTransactionPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  const { user } = useAuth();

  // Calculate amountp when denomination or quantity changes
  useEffect(() => {
    const denominationValue = parseFloat(amount) || 0;
    const quantityValue = parseInt(quantity) || 0;
    const total = denominationValue * quantityValue;
    
    // Add 10% service charge
    const serviceCharge = total * 0.10;
    const finalAmount = total + serviceCharge;
    
    setAmountp(finalAmount.toFixed(2));
  }, [amount, quantity]);

  const validateForm = () => {
    if (!businessName.trim()) {
      setErrorMessage('Please enter your business name');
      setShowErrorModal(true);
      return false;
    }
    
    if (!selectedNetwork) {
      setErrorMessage('Please select a network provider');
      setShowErrorModal(true);
      return false;
    }
    
    if (!amount.trim()) {
      setErrorMessage('Please select a denomination');
      setShowErrorModal(true);
      return false;
    }
    
    const denominationValue = parseFloat(amount);
    if (isNaN(denominationValue) || denominationValue <= 0) {
      setErrorMessage('Please select a valid denomination');
      setShowErrorModal(true);
      return false;
    }
    
    if (!quantity.trim()) {
      setErrorMessage('Please enter the quantity');
      setShowErrorModal(true);
      return false;
    }
    
    const quantityValue = parseInt(quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      setErrorMessage('Please enter a valid quantity greater than 0');
      setShowErrorModal(true);
      return false;
    }
    
    if (quantityValue > 10) {
      setErrorMessage('Maximum quantity allowed is 10');
      setShowErrorModal(true);
      return false;
    }
    
    if (!transactionPin.trim()) {
      setErrorMessage('Please enter your transaction PIN');
      setShowErrorModal(true);
      return false;
    }
    
    if (transactionPin.length !== 4) {
      setErrorMessage('Transaction PIN must be 4 digits');
      setShowErrorModal(true);
      return false;
    }
    
    return true;
  };

  const handlePurchase = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    triggerHapticFeedback('light');
    
    try {
      const requestData = {
        businessname: businessName,
        network: selectedNetwork!,
        amount: amount,
        quantity: quantity,
        amountp: amountp,
        tpin: transactionPin,
      };
      
      console.log('Sending card printing request:', requestData);
      
      const response = await apiService.buyRechargePins(requestData);
      
      console.log('Card printing response:', response);
      
      if ((response.success || response.status === 'success') && response.data) {
        setSuccessData(response.data);
        setShowSuccessModal(true);
        // Clear form on success
        setBusinessName('');
        setSelectedNetwork(null);
        setAmount('');
        setQuantity('');
        setAmountp('');
        setTransactionPin('');
      } else {
        setErrorMessage(response.message || 'Failed to purchase recharge pins');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to receipt screen with data
    onNavigate('receipt', {
      reference: successData.reference,
      amount: successData.amount,
      phone: '', // Card printing doesn't use phone
      service: 'Card Printing',
      date: new Date().toISOString(),
      network: successData.service_name?.toLowerCase() || selectedNetwork,
      businessName: successData.business_name || businessName,
      quantity: quantity,
      denomination: amount,
      epins: successData.epins || [],
      oldBalance: successData.initial_balance,
      newBalance: successData.final_balance,
      transaction_id: successData.transaction_id,
    });
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
  };

  const handleGoBack = () => {
    onNavigate('home');
  };

  const getNetworkInfo = (network: string) => {
    return NETWORK_PROVIDERS[network as keyof typeof NETWORK_PROVIDERS];
  };

  const formatPrice = (price: string) => {
    return `₦${parseFloat(price).toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.card + 'F5', colors.card + 'E0']}
        style={[styles.header, { paddingTop: safeAreaTop }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Card Printing
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#F59E0B', '#D97706', '#B45309']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="card" size={32} color="white" />
            </View>
            <Text style={styles.heroTitle}>Print Recharge Cards</Text>
            <Text style={styles.heroSubtitle}>
              Generate ePINs for any network instantly
            </Text>
          </LinearGradient>
        </View>

        {/* Business Name Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Business Name
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputWrapper}>
              <Ionicons name="business" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter business name"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>

        {/* Network Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Network
          </Text>
          <TouchableOpacity
            style={[styles.networkSelector, { backgroundColor: colors.card }]}
            onPress={() => setShowNetworkSelector(true)}
          >
            {selectedNetwork ? (
              <View style={styles.selectedNetwork}>
                <Image 
                  source={getNetworkInfo(selectedNetwork).logo}
                  style={styles.networkLogo}
                  resizeMode="contain"
                />
                <Text style={[styles.networkName, { color: colors.text }]}>
                  {getNetworkInfo(selectedNetwork).name}
                </Text>
              </View>
            ) : (
              <View style={styles.selectNetwork}>
                <Ionicons name="cellular" size={16} color={colors.mutedForeground} />
                <Text style={[styles.selectNetworkText, { color: colors.mutedForeground }]}>
                  Choose network
                </Text>
              </View>
            )}

          </TouchableOpacity>
        </View>

        {/* Denomination Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Denomination
          </Text>
          <View style={styles.denominationGrid}>
            {[100, 200, 500, 1000].map((denom) => (
              <TouchableOpacity
                key={denom}
                style={[
                  styles.denominationButton,
                  amount === denom.toString() && styles.denominationButtonSelected
                ]}
                onPress={() => {
                  setAmount(denom.toString());
                  triggerHapticFeedback('light');
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.denominationText,
                  amount === denom.toString() && styles.denominationTextSelected
                ]}>
                  ₦{denom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount to Pay and Quantity Row */}
        <View style={styles.row}>
          {/* Amount to Pay Input */}
          <View style={[styles.section, styles.halfSection]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Amount to Pay
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₦</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.text }]}
                  value={amountp}
                  onChangeText={setAmountp}
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Quantity Input */}
          <View style={[styles.section, styles.halfSection]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quantity
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <View style={styles.inputWrapper}>
                <Ionicons name="layers" size={16} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>



        {/* Transaction PIN */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Transaction PIN
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={transactionPin}
                onChangeText={setTransactionPin}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={true}
              />
            </View>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Instant ePIN generation
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                All networks supported
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Max 10 pins per transaction
                </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                10% service charge included
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: isLoading ? colors.mutedForeground : '#F59E0B',
              opacity: isLoading ? 0.7 : 1 
            },
          ]}
          onPress={handlePurchase}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name="card" size={18} color="white" />
          )}
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Processing...' : 'Generate ePINs'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Network Selector Modal */}
      <CustomModal
        visible={showNetworkSelector}
        onClose={() => setShowNetworkSelector(false)}
        title="Select Network"
        message="Choose your network provider"
        type="info"
        customContent={
          <View style={styles.networkSelectorModal}>
            {Object.entries(NETWORK_PROVIDERS).map(([network, data]) => (
              <TouchableOpacity
                key={network}
                style={[
                  styles.networkOption,
                  selectedNetwork === network && styles.networkOptionSelected
                ]}
                onPress={() => {
                  setSelectedNetwork(network);
                  setShowNetworkSelector(false);
                  triggerHapticFeedback('light');
                }}
              >
                <View style={[
                  styles.networkOptionIcon,
                  { backgroundColor: data.color }
                ]}>
                  <Image 
                    source={data.logo}
                    style={styles.networkLogoModal}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[
                  styles.networkOptionName,
                  { color: colors.text }
                ]}>
                  {data.name}
                </Text>
                {selectedNetwork === network && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        }
        primaryButtonText="Cancel"
        onPrimaryPress={() => setShowNetworkSelector(false)}
        singleButton={true}
      />

      {/* Error Modal */}
      <CustomModal
        visible={showErrorModal}
        onClose={handleErrorModalClose}
        title="Error"
        message={errorMessage}
        type="error"
        primaryButtonText="OK"
        onPrimaryPress={handleErrorModalClose}
        singleButton={true}
      />

      {/* Success Modal */}
      <CustomModal
        visible={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="ePINs Generated Successfully!"
        message={`${successData?.quantity} ${successData?.quantity === 1 ? 'ePIN' : 'ePINs'} of ₦${successData?.value} each ${successData?.quantity === 1 ? 'has' : 'have'} been generated for ${successData?.service_name}. Total amount: ${formatPrice(successData?.amount)}`}
        type="success"
        primaryButtonText="View ePINs"
        onPrimaryPress={handleSuccessModalClose}
        singleButton={true}
      />


    </View>
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
    borderRadius: 12,
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 16,
  },
  halfSection: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    color: '#F59E0B',
  },
  inputDecoration: {
    height: 2,
    backgroundColor: '#F59E0B',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 1,
  },
  networkSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
  },
  selectedNetwork: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectNetwork: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  networkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  networkLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  networkLogoModal: {
    width: 24,
    height: 24,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectNetworkText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  denominationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  denominationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: (width - 56 - 24) / 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  denominationButtonSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  denominationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  denominationTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  totalSection: {
    marginBottom: 16,
  },
  totalContainer: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoContent: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    marginLeft: 6,
    lineHeight: 18,
  },
  submitButton: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  networkSelectorModal: {
    gap: 12,
  },
  networkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  networkOptionSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderColor: '#F59E0B',
  },
  networkOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  networkOptionName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
