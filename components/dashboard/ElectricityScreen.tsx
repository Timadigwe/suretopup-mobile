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
import { useTheme } from '../../contexts/ThemeContext';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';
import { apiService } from '../../services/api';
import { CustomModal } from '../ui/CustomModal';
import { Colors } from '@/constants/Colors';

interface PowerCompany {
  id: string;
  name: string;
  covers: string;
}

interface CustomerVerification {
  customer_username: string | null;
  customer_name: string;
  customer_id: string;
  service_id: string;
  raw_response: {
    code: string;
    message: string;
    data: {
      service_name: string;
      customer_id: string;
      customer_name: string;
      customer_address: string;
      customer_arrears: string;
      outstanding: string;
      meter_number: string;
      account_number: string;
      district: string;
      service_band: string;
      min_purchase_amount: number;
      max_purchase_amount: number;
      business_unit: string;
      customer_account_type: string;
    };
  };
}

const ElectricityScreen: React.FC<{ onNavigate: (screen: string, data?: any) => void }> = ({ onNavigate }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  
  const [step, setStep] = useState<'company' | 'verify' | 'confirm' | 'purchase'>('company');
  const [powerCompanies, setPowerCompanies] = useState<PowerCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<PowerCompany | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [variationType, setVariationType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [amount, setAmount] = useState('');
  const [tpin, setTpin] = useState('');
  
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [showVariationSelector, setShowVariationSelector] = useState(false);
  
  const [customerData, setCustomerData] = useState<CustomerVerification | null>(null);
  const [verificationError, setVerificationError] = useState('');
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  
  useEffect(() => {
    fetchPowerCompanies();
  }, []);

  const fetchPowerCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const response = await apiService.getPowerCompanies();
      if (response.status === 'success' && response.data) {
        setPowerCompanies(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch power companies');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch power companies');
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleCompanySelect = (company: PowerCompany) => {
    setSelectedCompany(company);
    setStep('verify');
    triggerHapticFeedback('light');
  };

  const handleVariationSelect = (type: 'prepaid' | 'postpaid') => {
    setVariationType(type);
    setShowVariationSelector(false);
    triggerHapticFeedback('light');
  };

  const verifyCustomer = async () => {
    if (!selectedCompany || !customerId.trim()) {
      Alert.alert('Error', 'Please select a company and enter customer ID');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    setCustomerData(null);

    try {
      const response = await apiService.verifyElectricityCustomer({
        customer_id: customerId.trim(),
        service_id: selectedCompany.id,
        variation_id: variationType,
      });

      if (response.status === 'success') {
        setCustomerData(response.data);
        triggerHapticFeedback('medium');
        setStep('confirm');
      } else {
        setVerificationError(response.message || 'Verification failed');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      setVerificationError(error.message || 'Verification failed');
      triggerHapticFeedback('heavy');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmDetails = () => {
    setStep('purchase');
    triggerHapticFeedback('light');
  };

  const purchaseElectricity = async () => {
    if (!customerData || !amount.trim() || !tpin.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue < customerData.raw_response.data.min_purchase_amount || amountValue > customerData.raw_response.data.max_purchase_amount) {
      Alert.alert('Error', `Amount must be between ₦${customerData.raw_response.data.min_purchase_amount} and ₦${customerData.raw_response.data.max_purchase_amount}`);
      return;
    }

    setIsPurchasing(true);

    try {
      const response = await apiService.purchaseElectricity({
        customer_id: customerData.customer_id,
        service_id: customerData.service_id,
        variation_id: variationType,
        amount: amountValue,
        tpin: tpin.trim(),
      });

      if (response.status === 'success') {
        triggerHapticFeedback('medium');
        // Show success modal
        setSuccessMessage(response.message || 'Electricity purchase successful!');
        setSuccessData({
          reference: response.data?.receipt_data?.reference || 'N/A',
          amount: amountValue,
          service: 'Electricity Bill',
          date: new Date().toISOString(),
          businessName: 'SureTopUp',
          // Electricity-specific data
          serviceName: response.data?.ebills_response?.data?.service_name || selectedCompany?.name || '',
          customerId: response.data?.ebills_response?.data?.customer_id || customerData.customer_id,
          token: response.data?.ebills_response?.data?.token || 'N/A',
          customerName: response.data?.ebills_response?.data?.customer_name || customerData.customer_name,
          customerAddress: response.data?.ebills_response?.data?.customer_address || customerData.raw_response.data.customer_address,
          meterNumber: customerData.raw_response.data.meter_number,
          accountNumber: customerData.raw_response.data.account_number,
          district: customerData.raw_response.data.district,
          // Additional electricity data
          orderId: response.data?.ebills_response?.data?.order_id,
          units: response.data?.ebills_response?.data?.units,
          band: response.data?.ebills_response?.data?.band,
          amountCharged: response.data?.ebills_response?.data?.amount_charged,
          discount: response.data?.ebills_response?.data?.discount,
          initialBalance: response.data?.ebills_response?.data?.initial_balance,
          finalBalance: response.data?.ebills_response?.data?.final_balance,
        });
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', response.message || 'Purchase failed');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Purchase failed');
      triggerHapticFeedback('heavy');
    } finally {
      setIsPurchasing(false);
    }
  };

  const resetForm = () => {
    setSelectedCompany(null);
    setCustomerId('');
    setVariationType('prepaid');
    setAmount('');
    setTpin('');
    setCustomerData(null);
    setVerificationError('');
    setStep('company');
  };

  const handleGoBack = () => {
    if (step === 'company') {
      onNavigate('home');
    } else if (step === 'verify') {
      setStep('company');
      setSelectedCompany(null);
    } else if (step === 'confirm') {
      setStep('verify');
      setCustomerData(null);
    } else if (step === 'purchase') {
      setStep('confirm');
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'company', title: 'Select Company' },
      { key: 'verify', title: 'Verify Customer' },
      { key: 'confirm', title: 'Confirm Details' },
      { key: 'purchase', title: 'Purchase' },
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
        Select your power company to pay electricity bills
      </Text>
      
      {isLoadingCompanies ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading power companies...
          </Text>
        </View>
      ) : (
        <View style={styles.companiesGrid}>
          {powerCompanies.map((company) => (
            <TouchableOpacity
              key={company.id}
              style={[
                styles.companyCard,
                { backgroundColor: colors.card }
              ]}
              onPress={() => handleCompanySelect(company)}
              activeOpacity={0.8}
            >
              <View style={styles.companyIconContainer}>
                <Ionicons name="flash" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.companyName, { color: colors.text }]}>
                {company.name}
              </Text>
              <Text style={[styles.companyCovers, { color: colors.mutedForeground }]} numberOfLines={2}>
                {company.covers}
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
            <Ionicons name="flash" size={24} color={colors.primary} />
          </View>
          <View style={styles.companyDetails}>
            <Text style={[styles.companyName, { color: colors.text }]}>
              {selectedCompany?.name}
            </Text>
            <Text style={[styles.companyCovers, { color: colors.mutedForeground }]}>
              {selectedCompany?.covers}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Meter Type</Text>
        <TouchableOpacity
          style={[styles.selector, { borderColor: colors.border }]}
          onPress={() => setShowVariationSelector(true)}
        >
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {variationType === 'prepaid' ? 'Prepaid Meter' : 'Postpaid Meter'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Customer/Meter Number</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter customer ID or meter number"
          placeholderTextColor={colors.mutedForeground}
          value={customerId}
          onChangeText={setCustomerId}
          keyboardType="numeric"
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      {verificationError ? (
        <View style={[styles.errorContainer, { backgroundColor: colors.destructive + '15' }]}>
          <Ionicons name="alert-circle" size={20} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {verificationError}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.primary },
          (!customerId.trim() || isVerifying) && { opacity: 0.6 }
        ]}
        onPress={verifyCustomer}
        disabled={!customerId.trim() || isVerifying}
        activeOpacity={0.8}
      >
        {isVerifying ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Verify Customer
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <View style={styles.confirmationCard}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>
            Customer Verified
          </Text>
        </View>
        
        <View style={styles.customerDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Company:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {selectedCompany?.name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Customer ID:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {customerData?.customer_id}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Name:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {customerData?.customer_name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Meter Number:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {customerData?.raw_response.data.meter_number}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Amount Range:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              ₦{customerData?.raw_response.data.min_purchase_amount} - ₦{customerData?.raw_response.data.max_purchase_amount}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleConfirmDetails}
        activeOpacity={0.8}
      >
        <View style={[styles.actionButtonGradient, { backgroundColor: colors.primary }]}>
          <Ionicons name="arrow-forward" size={20} color="white" />
          <Text style={styles.actionButtonText}>
            Continue to Purchase
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderPurchase = () => (
    <View style={styles.stepContent}>
      <View style={styles.purchaseCard}>
        <Text style={[styles.purchaseTitle, { color: colors.text }]}>
          Purchase Details
        </Text>
        <View style={styles.purchaseRow}>
          <Text style={[styles.purchaseLabel, { color: colors.mutedForeground }]}>
            {selectedCompany?.name} - {customerData?.customer_name}
          </Text>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Amount (₦)</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter amount"
          placeholderTextColor={colors.mutedForeground}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Transaction PIN</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter your transaction PIN"
          placeholderTextColor={colors.mutedForeground}
          value={tpin}
          onChangeText={setTpin}
          keyboardType="numeric"
          secureTextEntry
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.primary },
          (!amount.trim() || !tpin.trim() || isPurchasing) && { opacity: 0.6 }
        ]}
        onPress={purchaseElectricity}
        disabled={!amount.trim() || !tpin.trim() || isPurchasing}
        activeOpacity={0.8}
      >
        {isPurchasing ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Ionicons name="flash" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Purchase Electricity
            </Text>
          </>
        )}
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
      case 'purchase':
        return renderPurchase();
      default:
        return renderCompanySelection();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Electricity Bills</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
              <View style={styles.heroIconContainer}>
                <Ionicons name="flash" size={32} color="white" />
              </View>
              <Text style={styles.heroTitle}>Pay Electricity Bills</Text>
              <Text style={styles.heroSubtitle}>
                Pay your electricity bills securely and instantly
              </Text>
            </View>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          {renderCurrentStep()}
        </View>
      </ScrollView>

      {/* Variation Type Selector Modal */}
      <CustomModal
        visible={showVariationSelector}
        onClose={() => setShowVariationSelector(false)}
        title="Select Meter Type"
        message=""
        customContent={
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.variationOption,
                variationType === 'prepaid' && styles.variationOptionSelected
              ]}
              onPress={() => handleVariationSelect('prepaid')}
            >
              <View style={styles.variationOptionContent}>
                <Text style={[styles.variationOptionName, { color: colors.text }]}>Prepaid Meter</Text>
                <Text style={[styles.variationOptionDesc, { color: colors.mutedForeground }]}>
                  Pay for electricity before use
                </Text>
              </View>
              {variationType === 'prepaid' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.variationOption,
                variationType === 'postpaid' && styles.variationOptionSelected
              ]}
              onPress={() => handleVariationSelect('postpaid')}
            >
              <View style={styles.variationOptionContent}>
                <Text style={[styles.variationOptionName, { color: colors.text }]}>Postpaid Meter</Text>
                <Text style={[styles.variationOptionDesc, { color: colors.mutedForeground }]}>
                  Pay for electricity after use
                </Text>
              </View>
              {variationType === 'postpaid' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        }
        primaryButtonText="Cancel"
        onPrimaryPress={() => setShowVariationSelector(false)}
        singleButton={true}
      />

      {/* Success Modal */}
      <CustomModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message={successMessage}
        customContent={
          <View style={styles.successModalContent}>
            <View style={styles.successModalIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Electricity Purchase Successful!
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.mutedForeground }]}>
              Your electricity bill has been paid successfully.
            </Text>
          </View>
        }
        primaryButtonText="View Receipt"
        onPrimaryPress={() => {
          setShowSuccessModal(false);
          onNavigate('receipt', successData);
        }}
        secondaryButtonText="Close"
        onSecondaryPress={() => setShowSuccessModal(false)}
      />
    </KeyboardAvoidingView>
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
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
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
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  companiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  companyCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  companyCardPressed: {
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },

  companyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  companyCovers: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedCompanyCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyDetails: {
    flex: 1,
    marginLeft: 12,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.light.text,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
    borderColor: Colors.light.border,
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderColor: Colors.light.border,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  actionButtonGradient: {
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
  confirmationCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  successIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  customerDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  purchaseCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  purchaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  purchaseRow: {
    marginBottom: 8,
  },
  purchaseLabel: {
    fontSize: 14,
    color: Colors.light.mutedForeground,
  },
  modalContent: {
    maxHeight: 400,
  },
  variationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  variationOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  variationOptionContent: {
    flex: 1,
  },
  variationOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  variationOptionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  successModalContent: {
    alignItems: 'center',
    padding: 20,
  },
  successModalIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ElectricityScreen;
