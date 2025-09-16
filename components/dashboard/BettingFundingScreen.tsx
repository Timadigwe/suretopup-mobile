import React, { useState, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
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
import { TransactionReceiptScreen } from './TransactionReceiptScreen';

interface BettingFundingScreenProps {
  onNavigate: (page: string, data?: any) => void;
  registerMultiStepInfo: (screen: string, currentStep: string, onStepBack: () => void) => void;
  clearMultiStepInfo: () => void;
}

const { width } = Dimensions.get('window');

interface BettingCompany {
  id: string;
  name: string;
}

// Function to get the correct image for each betting company
const getBettingCompanyImage = (companyName: string) => {
  const name = companyName.toLowerCase().replace(/\s+/g, '');
  
  const imageMap: { [key: string]: any } = {
    '1xbet': require('@/assets/images/1xbet.png'),
    'bangbet': require('@/assets/images/bangbet.png'),
    'bet9ja': require('@/assets/images/bet9ja.png'),
    'betking': require('@/assets/images/betking.png'),
    'betland': require('@/assets/images/betland.png'),
    'betlion': require('@/assets/images/betlion.png'),
    'betway': require('@/assets/images/betway.png'),
    'cloudbet': require('@/assets/images/cloudbet.png'),
    'livescorebet': require('@/assets/images/livescorebet.png'),
    'merrybet': require('@/assets/images/merrybet.png'),
    'naijabet': require('@/assets/images/naijabet.png'),
    'nairabet': require('@/assets/images/nairabet.png'),
    'supabet': require('@/assets/images/supabet.png'),
  };
  
  return imageMap[name] || null;
};

interface CustomerInfo {
  customer_username: string;
  customer_name: string;
  customer_id: string;
  service_id: string;
  raw_response: {
    data: {
      minimum_amount: number;
      maximum_amount: number;
    };
  };
}

export const BettingFundingScreen: React.FC<BettingFundingScreenProps> = ({ onNavigate, registerMultiStepInfo, clearMultiStepInfo }) => {
  const [step, setStep] = useState<'company' | 'verify' | 'confirm' | 'fund'>('company');
  const [bettingCompanies, setBettingCompanies] = useState<BettingCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<BettingCompany | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);
  const [isLoadingFunding, setIsLoadingFunding] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  const { user } = useAuth();

  // Fetch betting companies on component mount
  useEffect(() => {
    fetchBettingCompanies();
  }, []);

  // Register multi-step info when step changes
  useEffect(() => {
    if (step !== 'company') {
      registerMultiStepInfo('betting-funding', step, handleGoBack);
    } else {
      clearMultiStepInfo();
    }
  }, [step, registerMultiStepInfo, clearMultiStepInfo]);

  // Clear multi-step info when component unmounts
  useEffect(() => {
    return () => {
      clearMultiStepInfo();
    };
  }, [clearMultiStepInfo]);

  const fetchBettingCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const response = await apiService.getBettingCompanies();
      if ((response.success || response.status === 'success') && response.data) {
        setBettingCompanies(response.data);
      } else {
        setErrorMessage('Failed to load betting companies');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleCompanySelect = (company: BettingCompany) => {
    setSelectedCompany(company);
    setStep('verify');
    triggerHapticFeedback('light');
  };

  const handleVerifyCustomer = async () => {
    if (!customerId.trim()) {
      setErrorMessage('Please enter your customer ID');
      setShowErrorModal(true);
      return;
    }

    setIsLoadingVerification(true);
    try {
      const response = await apiService.verifyBettingCustomer({
        customer_id: customerId,
        service_id: selectedCompany!.id,
      });

      if ((response.success || response.status === 'success') && response.data) {
        setCustomerInfo(response.data);
        setStep('confirm');
      } else {
        setErrorMessage(response.message || 'Failed to verify customer');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoadingVerification(false);
    }
  };

  const handleConfirmAccount = () => {
    setStep('fund');
  };

  const handleFundAccount = async () => {
    if (!amount.trim()) {
      setErrorMessage('Please enter an amount');
      setShowErrorModal(true);
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0');
      setShowErrorModal(true);
      return;
    }

    if (customerInfo && (amountValue < customerInfo.raw_response.data.minimum_amount || 
        amountValue > customerInfo.raw_response.data.maximum_amount)) {
      setErrorMessage(`Amount must be between ₦${customerInfo.raw_response.data.minimum_amount} and ₦${customerInfo.raw_response.data.maximum_amount}`);
      setShowErrorModal(true);
      return;
    }

    if (!transactionPin.trim()) {
      setErrorMessage('Please enter your transaction PIN');
      setShowErrorModal(true);
      return;
    }

    if (transactionPin.length !== 4) {
      setErrorMessage('Transaction PIN must be 4 digits');
      setShowErrorModal(true);
      return;
    }

    setIsLoadingFunding(true);
    try {
      const response = await apiService.fundBettingAccount({
        service_id: selectedCompany!.id,
        customer_id: customerId,
        amount: amountValue,
        tpin: transactionPin,
      });

      if ((response.success || response.status === 'success') && response.data) {
        // Store company name in success data before clearing state
        console.log('response.data', response.data);
        console.log("data", response.data?.transaction);
  
        const successDataWithCompany = {
          ...response.data,
          companyName: selectedCompany?.name
        };
        setSuccessData(successDataWithCompany);
        setShowSuccessModal(true);
        // Clear form on success
        setCustomerId('');
        setAmount('');
        setTransactionPin('');
        setSelectedCompany(null);
        setCustomerInfo(null);
        setStep('company');
      } else {
        setErrorMessage(response.message || 'Failed to fund account');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoadingFunding(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Navigate to receipt screen with data
    onNavigate('receipt', {
      reference: successData.receipt_data?.reference || successData.transaction?.ref || 'N/A',
      amount: successData.receipt_data?.amount || successData.transaction?.amount || 0,
      phone: successData.ebills_response?.data?.customer_phone_number || '',
      service: 'Betting',
      date: successData.receipt_data?.date || successData.transaction?.date || new Date().toISOString(),
      businessName: 'SureTopUp',
      // Transaction details for consistency with history
      transactionId: successData.transaction?.id,
      type: successData.transaction?.type || 'Debit',
      status: successData.transaction?.status || 'Completed',
      oldBalance: successData.transaction?.old_balance,
      newBalance: successData.transaction?.new_balance,
      info: successData.transaction?.info || '',
      // Betting specific data
      company_name: successData.ebills_response?.data?.service_name || successData.companyName || selectedCompany?.name,
      customer_id: successData.ebills_response?.data?.customer_id,
      customer_name: successData.ebills_response?.data?.customer_name,
      customer_username: successData.ebills_response?.data?.customer_username,
      customer_email: successData.ebills_response?.data?.customer_email_address,
      customer_phone: successData.ebills_response?.data?.customer_phone_number,
      order_id: successData.ebills_response?.data?.order_id,
      amount_charged: successData.ebills_response?.data?.amount_charged,
      discount: successData.ebills_response?.data?.discount,
      initial_balance: successData.ebills_response?.data?.initial_balance,
      final_balance: successData.ebills_response?.data?.final_balance,
    });
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
  };

  const handleGoBack = useCallback(() => {
    if (step === 'company') {
      onNavigate('home');
    } else if (step === 'verify') {
      setStep('company');
      setSelectedCompany(null);
    } else if (step === 'confirm') {
      setStep('verify');
      setCustomerInfo(null);
    } else if (step === 'fund') {
      setStep('confirm');
    }
  }, [step, onNavigate]);

  const renderStepIndicator = () => {
    const steps = [
      { key: 'company', title: 'Select Customer' },
      { key: 'verify', title: 'Verify Account' },
      { key: 'confirm', title: 'Confirm Details' },
      { key: 'fund', title: 'Fund Account' },
    ];

    const currentIndex = steps.findIndex(s => s.key === step);

    return (
      <View style={styles.stepIndicator}>
        {steps.map((stepItem, index) => (
          <View key={stepItem.key} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= currentIndex ? { backgroundColor: colors.primary } : { backgroundColor: colors.mutedForeground }
            ]}>
              <Text style={[
                styles.stepNumber,
                index <= currentIndex ? { color: 'white' } : { color: colors.background }
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepTitle,
              index <= currentIndex ? { color: colors.text } : { color: colors.mutedForeground }
            ]}>
              {stepItem.title}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCompanySelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Select your betting company to fund your account
      </Text>
      
      {isLoadingCompanies ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading betting companies...
          </Text>
        </View>
      ) : (
        <View style={styles.companiesGrid}>
          {bettingCompanies.map((company) => (
            <TouchableOpacity
              key={company.id}
              style={[styles.companyCard, { backgroundColor: colors.card }]}
              onPress={() => handleCompanySelect(company)}
              activeOpacity={0.7}
            >
              <View style={styles.companyIconContainer}>
                {getBettingCompanyImage(company.name) ? (
                  <Image 
                    source={getBettingCompanyImage(company.name)} 
                    style={styles.companyImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="trophy" size={24} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.companyName, { color: colors.text }]}>
                {company.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderVerification = () => (
    <View style={styles.stepContent}>
      <View style={styles.selectedCompanyCard}>
        <View style={styles.companyInfo}>
          <View style={styles.companyIconContainer}>
            <Image
              source={getBettingCompanyImage(selectedCompany?.name || '')}
              style={styles.companyLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.companyTextContainer}>
            <Text style={[styles.selectedCompanyName, { color: colors.text }]}>
              {selectedCompany?.name}
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Enter your customer ID to verify your account
      </Text>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Customer ID
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
          <View style={styles.inputWrapper}>
            <Ionicons name="person" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={customerId}
              onChangeText={setCustomerId}
              placeholder="Enter your customer ID"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              textAlignVertical="center"
              underlineColorAndroid="transparent"
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backActionButton}
          onPress={() => {
            setStep('company');
            setSelectedCompany(null);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.mutedForeground, colors.mutedForeground]}
            style={styles.backButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text style={styles.backButtonText}>
              Back
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { opacity: isLoadingVerification ? 0.7 : 1 },
          ]}
          onPress={handleVerifyCustomer}
          disabled={isLoadingVerification}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLoadingVerification ? [colors.mutedForeground, colors.mutedForeground] : ['#F59E0B', '#D97706']}
            style={styles.actionButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoadingVerification ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="white" />
            )}
            <Text style={styles.actionButtonText}>
              {isLoadingVerification ? 'Verifying...' : 'Verify Account'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <View style={styles.accountInfoCard}>
        <View style={styles.accountInfoHeader}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={[styles.accountInfoTitle, { color: colors.text }]}>
            Account Verified
          </Text>
        </View>
        
        <View style={styles.accountDetails}>
          <View style={styles.accountRow}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>
              Company:
            </Text>
            <Text style={[styles.accountValue, { color: colors.text }]}>
              {selectedCompany?.name}
            </Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>
              Customer ID:
            </Text>
            <Text style={[styles.accountValue, { color: colors.text }]}>
              {customerInfo?.customer_id}
            </Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>
              Username:
            </Text>
            <Text style={[styles.accountValue, { color: colors.text }]}>
              {customerInfo?.customer_username}
            </Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>
              Name:
            </Text>
            <Text style={[styles.accountValue, { color: colors.text }]}>
              {customerInfo?.customer_name}
            </Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>
              Min Amount:
            </Text>
            <Text style={[styles.accountValue, { color: colors.text }]}>
              ₦{customerInfo?.raw_response.data.minimum_amount}
            </Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>
              Max Amount:
            </Text>
            <Text style={[styles.accountValue, { color: colors.text }]}>
              ₦{customerInfo?.raw_response.data.maximum_amount}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleConfirmAccount}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.actionButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="arrow-forward" size={20} color="white" />
          <Text style={styles.actionButtonText}>
            Continue to Funding
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderFunding = () => (
    <View style={styles.stepContent}>
      <View style={styles.accountSummaryCard}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>
          Account Summary
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            {selectedCompany?.name} - {customerInfo?.customer_username}
          </Text>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Amount to Fund
        </Text>
        <View style={[styles.amountInputContainer, { backgroundColor: colors.card }]}>
          <View style={styles.amountInputWrapper}>
            <Text style={styles.currencySymbol}>₦</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              textAlignVertical="center"
              underlineColorAndroid="transparent"
            />
          </View>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>
          Transaction PIN
        </Text>
        <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
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
              textAlignVertical="center"
              underlineColorAndroid="transparent"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { opacity: isLoadingFunding ? 0.7 : 1 },
        ]}
        onPress={handleFundAccount}
        disabled={isLoadingFunding}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isLoadingFunding ? [colors.mutedForeground, colors.mutedForeground] : ['#F59E0B', '#D97706']}
          style={styles.actionButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoadingFunding ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name="wallet" size={20} color="white" />
          )}
          <Text style={styles.actionButtonText}>
            {isLoadingFunding ? 'Processing...' : 'Fund Account'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'company':
        return renderCompanySelection();
      case 'verify':
        return renderVerification();
      case 'confirm':
        return renderConfirmation();
      case 'fund':
        return renderFunding();
      default:
        return renderCompanySelection();
    }
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
        style={[styles.header, { paddingTop: safeAreaTop }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Betting Funding
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
        keyboardShouldPersistTaps="handled"
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
              <Ionicons name="trophy" size={32} color="white" />
            </View>
            <Text style={styles.heroTitle}>Fund Betting Account</Text>
            <Text style={styles.heroSubtitle}>
              Add funds to your betting account securely and instantly
            </Text>
          </LinearGradient>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        {renderCurrentStep()}
      </ScrollView>

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
        title="Account Funded Successfully!"
        message={`₦${successData?.transaction?.amount} has been sent to your ${successData?.companyName} account. Your new balance is ₦${successData?.transaction?.new_balance}.`}
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
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 20,
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  companiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  companyCard: {
    width: (width - 72 - 24) / 3, // 3 columns with gaps
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  companyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  companyLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedCompanyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    marginBottom: 24,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  selectedCompanyName: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
    ...(Platform.OS === 'android' && {
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    paddingVertical: 0,
  },
  amountInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
    ...(Platform.OS === 'android' && {
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#F59E0B',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 0,
  },
  actionButton: {
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backActionButton: {
    flex: 1,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  accountInfoCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    marginBottom: 24,
  },
  accountInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  accountDetails: {
    gap: 12,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountSummaryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
