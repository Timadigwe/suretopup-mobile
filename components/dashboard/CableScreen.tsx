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

interface CableCompany {
  id: string;
  name: string;
}

interface CableVariation {
  id: number;
  variation_id: number;
  service_name: string;
  service_id: string;
  package_bouquet: string;
  price: string;
  percentage_charge: number;
  payment_price: number;
  availability: string;
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
      status: string;
      due_date: string;
      balance: string;
      current_bouquet: string;
      renewal_amount: number;
    };
  };
}

const CableScreen: React.FC<{ onNavigate: (screen: string, data?: any) => void }> = ({ onNavigate }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  
  const [step, setStep] = useState<'company' | 'verify' | 'confirm' | 'subscribe'>('company');
  const [cableCompanies, setCableCompanies] = useState<CableCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CableCompany | null>(null);
  const [cableVariations, setCableVariations] = useState<CableVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<CableVariation | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [subscriptionType, setSubscriptionType] = useState<'renew' | 'change'>('renew');
  const [amount, setAmount] = useState('');
  const [tpin, setTpin] = useState('');
  
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  const [showVariationSelector, setShowVariationSelector] = useState(false);
  const [showSubscriptionTypeSelector, setShowSubscriptionTypeSelector] = useState(false);
  
  const [customerData, setCustomerData] = useState<CustomerVerification | null>(null);
  const [verificationError, setVerificationError] = useState('');
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  
  useEffect(() => {
    fetchCableCompanies();
  }, []);

  const fetchCableCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const response = await apiService.getCableCompanies();
      if (response.status === 'success' && response.data) {
        setCableCompanies(response.data);
      } else {
        Alert.alert('Error', 'Failed to fetch cable companies');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch cable companies');
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const fetchCableVariations = async (serviceId: string) => {
    setIsLoadingVariations(true);
    try {
      const response = await apiService.getCableVariations();
      if (response.status === 'success' && response.data?.cableplans) {
        // Filter variations for the selected company
        const filteredVariations = response.data.cableplans.filter(
          (variation: CableVariation) => variation.service_id === serviceId
        );
        setCableVariations(filteredVariations);
      } else {
        Alert.alert('Error', 'Failed to fetch cable variations');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch cable variations');
    } finally {
      setIsLoadingVariations(false);
    }
  };

  const handleCompanySelect = (company: CableCompany) => {
    setSelectedCompany(company);
    setSelectedVariation(null);
    setCableVariations([]);
    fetchCableVariations(company.id);
    setStep('verify');
    triggerHapticFeedback('light');
  };

  const handleVariationSelect = (variation: CableVariation) => {
    setSelectedVariation(variation);
    setAmount(variation.payment_price.toString());
    setShowVariationSelector(false);
    triggerHapticFeedback('light');
  };

  const handleSubscriptionTypeSelect = (type: 'renew' | 'change') => {
    setSubscriptionType(type);
    setShowSubscriptionTypeSelector(false);
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
      const response = await apiService.verifyCableCustomer({
        customer_id: customerId.trim(),
        service_id: selectedCompany.id,
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
    setStep('subscribe');
    triggerHapticFeedback('light');
  };

  const subscribeCable = async () => {
    if (!customerData || !selectedVariation || !amount.trim() || !tpin.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await apiService.subscribeCable({
        variation_id: selectedVariation.variation_id.toString(),
        service_id: customerData.service_id,
        customer_id: customerData.customer_id,
        subscription_type: subscriptionType,
        amount: amountValue,
        tpin: tpin.trim(),
      });

      if (response.status === 'success') {
        triggerHapticFeedback('medium');
        
        // Log the response for debugging
        console.log('Cable subscription response:', response);
        
        // Show success modal
        setSuccessMessage(response.message || 'Cable subscription successful!');
        setSuccessData({
          reference: response.data?.receipt_data?.reference || 'N/A',
          amount: amountValue,
          service: 'Cable Bill',
          date: new Date().toISOString(),
          businessName: 'SureTopUp',
          // Cable-specific data
          serviceName: selectedCompany?.name || '',
          customerId: customerData.customer_id,
          customerName: customerData.customer_name,
          packageBouquet: selectedVariation.package_bouquet,
          subscriptionType: subscriptionType,
          // Additional data for receipt
          transaction_id: response.data?.transaction?.id,
        });
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', response.message || 'Subscription failed');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Subscription failed');
      triggerHapticFeedback('heavy');
    } finally {
      setIsSubscribing(false);
    }
  };

  const resetForm = () => {
    setSelectedCompany(null);
    setSelectedVariation(null);
    setCableVariations([]);
    setCustomerId('');
    setSubscriptionType('renew');
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
      setSelectedVariation(null);
      setCableVariations([]);
    } else if (step === 'confirm') {
      setStep('verify');
      setCustomerData(null);
    } else if (step === 'subscribe') {
      setStep('confirm');
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'company', title: 'Select Company' },
      { key: 'verify', title: 'Verify Customer' },
      { key: 'confirm', title: 'Confirm Details' },
      { key: 'subscribe', title: 'Subscribe' },
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
        Select your cable TV provider
      </Text>
      
      {isLoadingCompanies ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading cable companies...
          </Text>
        </View>
      ) : (
        <View style={styles.companiesGrid}>
          {cableCompanies.map((company) => (
            <TouchableOpacity
              key={company.id}
              style={[
                styles.companyCard,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
              onPress={() => handleCompanySelect(company)}
              activeOpacity={0.7}
            >
              <View style={styles.companyIconContainer}>
                <Ionicons name="tv" size={24} color={colors.primary} />
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
            <Ionicons name="tv" size={24} color={colors.primary} />
          </View>
          <View style={styles.companyDetails}>
            <Text style={[styles.companyName, { color: colors.text }]}>
              {selectedCompany?.name}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Customer ID</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter your customer ID"
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
              Current Bouquet:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {customerData?.raw_response.data.current_bouquet}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Due Date:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {customerData?.raw_response.data.due_date}
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
            Continue to Subscription
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSubscription = () => (
    <View style={styles.stepContent}>
      <View style={styles.subscriptionCard}>
        <Text style={[styles.subscriptionTitle, { color: colors.text }]}>
          Subscription Details
        </Text>
        <View style={styles.subscriptionRow}>
          <Text style={[styles.subscriptionLabel, { color: colors.mutedForeground }]}>
            {selectedCompany?.name} - {customerData?.customer_name}
          </Text>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Package/Bouquet</Text>
        <TouchableOpacity
          style={[styles.selector, { borderColor: colors.border }]}
          onPress={() => setShowVariationSelector(true)}
        >
          <Text style={[styles.selectorText, { color: selectedVariation ? colors.text : colors.mutedForeground }]}>
            {selectedVariation ? `${selectedVariation.package_bouquet} - ₦${selectedVariation.payment_price}` : 'Select a package'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {selectedVariation && (
        <View style={styles.packageDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Package:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {selectedVariation.package_bouquet}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Amount:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              ₦{selectedVariation.payment_price}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Subscription Type</Text>
        <TouchableOpacity
          style={[styles.selector, { borderColor: colors.border }]}
          onPress={() => setShowSubscriptionTypeSelector(true)}
        >
          <Text style={[styles.selectorText, { color: colors.text }]}>
            {subscriptionType === 'renew' ? 'Renew Subscription' : 'Change Package'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
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
          (!selectedVariation || !amount.trim() || !tpin.trim() || isSubscribing) && { opacity: 0.6 }
        ]}
        onPress={subscribeCable}
        disabled={!selectedVariation || !amount.trim() || !tpin.trim() || isSubscribing}
        activeOpacity={0.8}
      >
        {isSubscribing ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Ionicons name="tv" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Subscribe to Cable
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
      case 'subscribe':
        return renderSubscription();
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cable TV</Text>
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
                <Ionicons name="tv" size={32} color="white" />
              </View>
              <Text style={styles.heroTitle}>Cable TV Subscription</Text>
              <Text style={styles.heroSubtitle}>
                Subscribe to your favorite cable TV packages
              </Text>
            </View>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          {renderCurrentStep()}
        </View>
      </ScrollView>

      {/* Package/Bouquet Selector Modal */}
      <CustomModal
        visible={showVariationSelector}
        onClose={() => setShowVariationSelector(false)}
        title="Select Package/Bouquet"
        message=""
        customContent={
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {isLoadingVariations ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              cableVariations.map((variation) => (
                <TouchableOpacity
                  key={variation.id}
                  style={[
                    styles.variationOption,
                    selectedVariation?.id === variation.id && styles.variationOptionSelected
                  ]}
                  onPress={() => handleVariationSelect(variation)}
                >
                  <View style={styles.variationOptionContent}>
                    <Text style={[styles.variationOptionName, { color: colors.text }]}>
                      {variation.package_bouquet}
                    </Text>
                    <Text style={[styles.variationOptionDesc, { color: colors.mutedForeground }]}>
                      ₦{variation.payment_price}
                    </Text>
                  </View>
                  {selectedVariation?.id === variation.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        }
        primaryButtonText="Cancel"
        onPrimaryPress={() => setShowVariationSelector(false)}
        singleButton={true}
      />

      {/* Subscription Type Selector Modal */}
      <CustomModal
        visible={showSubscriptionTypeSelector}
        onClose={() => setShowSubscriptionTypeSelector(false)}
        title="Select Subscription Type"
        message=""
        customContent={
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.variationOption,
                subscriptionType === 'renew' && styles.variationOptionSelected
              ]}
              onPress={() => handleSubscriptionTypeSelect('renew')}
            >
              <View style={styles.variationOptionContent}>
                <Text style={[styles.variationOptionName, { color: colors.text }]}>Renew Subscription</Text>
                <Text style={[styles.variationOptionDesc, { color: colors.mutedForeground }]}>
                  Continue with current package
                </Text>
              </View>
              {subscriptionType === 'renew' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.variationOption,
                subscriptionType === 'change' && styles.variationOptionSelected
              ]}
              onPress={() => handleSubscriptionTypeSelect('change')}
            >
              <View style={styles.variationOptionContent}>
                <Text style={[styles.variationOptionName, { color: colors.text }]}>Change Package</Text>
                <Text style={[styles.variationOptionDesc, { color: colors.mutedForeground }]}>
                  Switch to a different package
                </Text>
              </View>
              {subscriptionType === 'change' && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        }
        primaryButtonText="Cancel"
        onPrimaryPress={() => setShowSubscriptionTypeSelector(false)}
        singleButton={true}
      />

      {/* Success Modal */}
      <CustomModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success!"
        message={successMessage}
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
  },
  companyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
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
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
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
  subscriptionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  subscriptionRow: {
    marginBottom: 8,
  },
  subscriptionLabel: {
    fontSize: 14,
  },
  packageDetails: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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

export default CableScreen;
