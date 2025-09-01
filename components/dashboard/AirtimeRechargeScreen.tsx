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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { CustomModal } from '@/components/ui/CustomModal';
import { TransactionReceiptScreen } from './TransactionReceiptScreen';

interface AirtimeRechargeScreenProps {
  onNavigate: (page: string, data?: any) => void;
}

const { width } = Dimensions.get('window');

// Network provider constants
const NETWORK_PROVIDERS = {
  mtn: {
    name: 'MTN',
    color: '#fbc404',
    logo: require('@/assets/images/mtn.jpeg'),
    prefixes: ['0803', '0806', '0813', '0816', '0814', '0810', '0814', '0903', '0906', '0703', '0706', '0704', '0706', '07025', '07026', '0704'],
  },
  airtel: {
    name: 'Airtel',
    color: '#ec1c24',
    logo: require('@/assets/images/airtel.jpg'),
    prefixes: ['0802', '0808', '0812', '0701', '0708', '0902', '0907', '0809', '0818', '0817', '0708', '0702'],
  },
  glo: {
    name: 'Glo',
    color: '#1daa10',
    logo: require('@/assets/images/glo.jpg'),
    prefixes: ['0805', '0807', '0811', '0815', '0705', '0905', '0805', '0815', '0811', '0705'],
  },
  '9mobile': {
    name: '9mobile',
    color: '#040404',
    logo: require('@/assets/images/9mobile.png'),
    prefixes: ['0809', '0817', '0818', '0908', '0909', '0817', '0818', '0809'],
  },
};

export const AirtimeRechargeScreen: React.FC<AirtimeRechargeScreenProps> = ({ onNavigate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user } = useAuth();

  // Detect network when phone number changes
  useEffect(() => {
    if (phoneNumber.length >= 4) {
      const prefix = phoneNumber.substring(0, 4);
      let detected = null;
      
      for (const [network, data] of Object.entries(NETWORK_PROVIDERS)) {
        if (data.prefixes.includes(prefix)) {
          detected = network;
          break;
        }
      }
      
      setDetectedNetwork(detected);
      if (detected) {
        setSelectedNetwork(detected);
      }
    } else {
      setDetectedNetwork(null);
      setSelectedNetwork(null);
    }
  }, [phoneNumber]);

  const validateForm = () => {
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter a phone number');
      setShowErrorModal(true);
      return false;
    }
    
    if (phoneNumber.length < 11) {
      setErrorMessage('Please enter a valid 11-digit phone number');
      setShowErrorModal(true);
      return false;
    }
    
    if (!amount.trim()) {
      setErrorMessage('Please enter an amount');
      setShowErrorModal(true);
      return false;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0');
      setShowErrorModal(true);
      return false;
    }
    
    if (amountValue < 50) {
      setErrorMessage('Minimum airtime amount is ₦50');
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
    
    if (!selectedNetwork) {
      setErrorMessage('Please select a network provider');
      setShowErrorModal(true);
      return false;
    }
    
    return true;
  };

  const handleRecharge = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    triggerHapticFeedback('light');
    
    try {
      const requestData = {
        network: selectedNetwork!,
        amount: parseFloat(amount),
        phone: phoneNumber,
        tpin: transactionPin,
      };
      
      console.log('Sending airtime request:', requestData);
      
      const response = await apiService.buyAirtime(requestData);
      
      console.log('Airtime recharge response:', response);
      
      if ((response.success || response.status === 'success') && response.data) {
        setSuccessData(response.data);
        setShowSuccessModal(true);
        // Clear form on success
        setPhoneNumber('');
        setAmount('');
        setTransactionPin('');
        setSelectedNetwork(null);
        setDetectedNetwork(null);
      } else {
        setErrorMessage(response.message || 'Failed to purchase airtime');
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
      phone: successData.phone,
      service: 'Airtime',
      date: new Date().toISOString(),
      network: successData.network ? successData.network.charAt(0).toUpperCase() + successData.network.slice(1) : undefined,
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.card + 'F5', colors.card + 'E0']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Airtime Recharge
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8', '#1E40AF']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="phone-portrait" size={32} color="white" />
            </View>
            <Text style={styles.heroTitle}>Recharge Airtime</Text>
            <Text style={styles.heroSubtitle}>
              Buy airtime for any network instantly and securely
            </Text>
          </LinearGradient>
        </View>

        {/* Phone Number Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Phone Number
          </Text>
          <LinearGradient
            colors={[colors.card, colors.card + 'F0']}
            style={styles.inputContainer}
          >
            <View style={styles.inputWrapper}>
              <Ionicons name="call" size={20} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
            <View style={styles.inputDecoration} />
          </LinearGradient>
          
          {/* Network Selection - Compact */}
          {phoneNumber.length >= 4 && (
            <View style={styles.networkSection}>
              {selectedNetwork ? (
                <View style={styles.networkCard}>
                  <View style={styles.networkInfo}>
                    <View style={[
                      styles.networkIconContainer,
                      { backgroundColor: getNetworkInfo(selectedNetwork).color + '20' }
                    ]}>
                      <Image 
                        source={getNetworkInfo(selectedNetwork).logo}
                        style={styles.networkLogo}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={[styles.networkName, { color: colors.text }]}>
                      {getNetworkInfo(selectedNetwork).name}
                    </Text>
                    <Text style={[styles.networkDetected, { color: colors.success }]}>
                      {detectedNetwork === selectedNetwork ? '✓ Auto-detected' : '✓ Selected'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeNetworkButton}
                    onPress={() => setShowNetworkSelector(true)}
                  >
                    <Text style={[styles.changeNetworkText, { color: colors.primary }]}>
                      Change
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.selectNetworkButton, { backgroundColor: colors.card }]}
                  onPress={() => setShowNetworkSelector(true)}
                >
                  <Ionicons name="cellular" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.selectNetworkText, { color: colors.mutedForeground }]}>
                    Select Network
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Amount
          </Text>
          <LinearGradient
            colors={[colors.card, colors.card + 'F0']}
            style={styles.amountInputContainer}
          >
            <View style={styles.amountInputWrapper}>
              <Text style={styles.currencySymbol}>₦</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.amountInputDecoration} />
          </LinearGradient>
        </View>



        {/* Transaction PIN */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Transaction PIN
          </Text>
          <LinearGradient
            colors={[colors.card, colors.card + 'F0']}
            style={styles.inputContainer}
          >
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color={colors.mutedForeground} />
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
            <View style={styles.inputDecoration} />
          </LinearGradient>
        </View>

        {/* Info Section */}
        <LinearGradient
          colors={[colors.card, colors.card + 'F0']}
          style={styles.infoSection}
        >
          <View style={styles.infoHeader}>
            <View style={styles.infoIconContainer}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Secure Recharge
            </Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Minimum amount: ₦50
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Instant delivery to phone
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                All networks supported
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { opacity: isLoading ? 0.7 : 1 },
          ]}
          onPress={handleRecharge}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLoading ? [colors.mutedForeground, colors.mutedForeground] : ['#3B82F6', '#1D4ED8']}
            style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="phone-portrait" size={20} color="white" />
            )}
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Processing...' : 'Recharge Airtime'}
            </Text>
          </LinearGradient>
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
          <View style={styles.networkSelector}>
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
                  { backgroundColor: data.color + '20' }
                ]}>
                  <Image 
                    source={data.logo}
                    style={styles.networkLogo}
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
        title="Airtime Recharge Successful!"
        message={`₦${successData?.amount} airtime has been sent to ${successData?.phone}. Your new balance is ₦${successData?.new_balance}.`}
        type="success"
        primaryButtonText="View Receipt"
        onPrimaryPress={handleSuccessModalClose}
        singleButton={true}
      />


    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#3B82F6',
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  inputDecoration: {
    height: 2,
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 1,
  },
  networkSection: {
    marginTop: 8,
  },
  networkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  networkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  networkLogo: {
    width: 24,
    height: 24,
  },
  networkDetails: {
    flex: 1,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  networkDetected: {
    fontSize: 12,
    fontWeight: '500',
  },
  changeNetworkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  changeNetworkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectNetworkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
  },
  selectNetworkText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
  },
  amountInputContainer: {
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
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#3B82F6',
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
  },
  amountInputDecoration: {
    height: 2,
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 1,
  },
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: (width - 72 - 16) / 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAmountButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickAmountTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  infoSection: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoContent: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 20,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  networkSelector: {
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
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderColor: '#3B82F6',
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
