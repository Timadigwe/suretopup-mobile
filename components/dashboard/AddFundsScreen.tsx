import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { CustomModal } from '@/components/ui/CustomModal';

interface AddFundsScreenProps {
  onNavigate: (page: string) => void;
}

const { width } = Dimensions.get('window');

export const AddFundsScreen: React.FC<AddFundsScreenProps> = ({ onNavigate }) => {
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    authorization_url: string;
    access_code: string;
    reference: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [webViewStartTime, setWebViewStartTime] = useState<number | null>(null);
  const [chargeData, setChargeData] = useState<{
    amount: number;
    percentage: number;
    percentage_charge: number;
    flat_fee: number;
    service_charge: number;
    total_to_pay: number;
  } | null>(null);
  const [isCalculatingCharge, setIsCalculatingCharge] = useState(false);
  
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const paymentCheckInterval = useRef<number | null>(null);
  const webViewTimeout = useRef<number | null>(null);
  const webViewCloseTimeout = useRef<number | null>(null);
  const lastCallbackTime = useRef<number>(0);
  const callbackCount = useRef<number>(0);

  // Set user email on component mount
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Calculate charge when amount changes
  const calculateCharge = async (amountValue: number) => {
    if (amountValue <= 0) {
      setChargeData(null);
      return;
    }

    setIsCalculatingCharge(true);
    try {
      const response = await apiService.calculateCharge(amountValue);
      if ((response.success || response.status === 'success') && response.data) {
        setChargeData(response.data);
      } else {
        console.log('Charge calculation failed:', response.message);
        setChargeData(null);
      }
    } catch (error) {
      console.log('Charge calculation error:', error);
      setChargeData(null);
    } finally {
      setIsCalculatingCharge(false);
    }
  };

  // Cleanup payment check interval on unmount
  useEffect(() => {
    return () => {
      if (paymentCheckInterval.current) {
        clearInterval(paymentCheckInterval.current);
      }
    };
  }, []);

  const validateForm = () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
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
    
    if (amountValue < 100) {
      setErrorMessage('Minimum deposit amount is ₦100');
      setShowErrorModal(true);
      return false;
    }
    
    return true;
  };

  const handleInitializePayment = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    triggerHapticFeedback('light');
    
    try {
      // Use total_to_pay if charge data is available, otherwise use original amount
      const paymentAmount = chargeData?.total_to_pay || parseFloat(amount);
      const response = await apiService.initializeDeposit(email, paymentAmount, chargeData || undefined);
      
      // Check if the response indicates success (API returns "status": "success")
      if ((response.success || response.status === 'success') && response.data) {
        setPaymentData(response.data);
        setShowWebView(true);
        setWebViewStartTime(Date.now());
        startPaymentStatusCheck(response.data.reference);
        
        // Set a timeout to check payment status even if no URL change is detected
        webViewTimeout.current = setTimeout(() => {
          console.log('WebView timeout reached, checking payment status...');
          if (paymentData?.reference) {
            checkFinalPaymentStatus(paymentData.reference);
          }
        }, 30000); // 30 seconds timeout
        
        // Set a timeout to close WebView after 3.5 minutes (210 seconds)
        webViewCloseTimeout.current = setTimeout(() => {
          console.log('WebView close timeout reached, closing WebView...');
          stopPaymentStatusCheck();
          setShowWebView(false);
          setErrorMessage('Payment session expired. Please try again.');
          setShowErrorModal(true);
        }, 210000); // 3.5 minutes timeout
      } else {
        // If it's a success message but no data, show it as info instead of error
        if (response.message && response.message.toLowerCase().includes('successfully')) {
          setErrorMessage('Payment initialized but no payment data received. Please try again.');
        } else {
          setErrorMessage(response.message || 'Failed to initialize payment');
        }
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const startPaymentStatusCheck = (reference: string) => {
    console.log('Starting payment status check for reference:', reference);
    
    let pollCount = 0;
    const maxPolls = 60; // 5 minutes max (60 * 5 seconds)
    
    // Check payment status every 3 seconds (more frequent since no URL change)
    paymentCheckInterval.current = setInterval(async () => {
      pollCount++;
      console.log(`Payment status check #${pollCount} for reference: ${reference}`);
      
      try {
        // Check if 50 seconds have passed since last callback
        const currentTime = Date.now();
        const timeSinceLastCallback = currentTime - lastCallbackTime.current;
        
        if (timeSinceLastCallback >= 50000) { // 50 seconds = 50000ms
          console.log(`Making payment callback #${callbackCount.current + 1} for reference: ${reference}`);
          callbackCount.current++;
          lastCallbackTime.current = currentTime;
          
          const response = await apiService.checkPaymentStatus(reference);
          console.log('Payment status response:', JSON.stringify(response, null, 2));
          
          if ((response.success || response.status === 'success') && response.data) {
            const transaction = response.data.transaction;
            console.log('Transaction status:', transaction.status);
            
            if (transaction.status === 'Completed') {
              console.log('Payment completed successfully!');
              setPaymentStatus('success');
              setSuccessData(response.data);
              setShowSuccessModal(true);
              stopPaymentStatusCheck();
              // Close WebView when payment is successful
              setShowWebView(false);
            } else if (transaction.status === 'Failed') {
              console.log('Payment failed!');
              setPaymentStatus('failed');
              setErrorMessage('Payment failed. Please try again.');
              setShowErrorModal(true);
              stopPaymentStatusCheck();
              // Close WebView when payment fails
              setShowWebView(false);
            } else {
              console.log('Payment still pending, status:', transaction.status);
            }
          } else {
            console.log('Payment status check failed:', response.message);
          }
        } else {
          const remainingTime = Math.ceil((50000 - timeSinceLastCallback) / 1000);
          console.log(`Skipping callback - ${remainingTime}s remaining until next allowed call`);
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          console.log('Max polling attempts reached, stopping...');
          stopPaymentStatusCheck();
          setErrorMessage('Payment verification timeout. Please check your wallet balance.');
          setShowErrorModal(true);
        }
      } catch (error) {
        console.log('Payment status check error:', error);
        // Continue checking even if there's an error
      }
            }, 3000);
  };

  const stopPaymentStatusCheck = () => {
    if (paymentCheckInterval.current) {
      clearInterval(paymentCheckInterval.current);
      paymentCheckInterval.current = null;
    }
    if (webViewTimeout.current) {
      clearTimeout(webViewTimeout.current);
      webViewTimeout.current = null;
    }
    if (webViewCloseTimeout.current) {
      clearTimeout(webViewCloseTimeout.current);
      webViewCloseTimeout.current = null;
    }
    // Reset callback tracking
    lastCallbackTime.current = 0;
    callbackCount.current = 0;
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const url = navState.url;
    console.log('WebView navigation change:', url);
    
    // Since Paystack doesn't redirect on success, we'll rely on polling
    // Only detect if user navigates away from Paystack completely
    const isAwayFromPaystack = !url.includes('paystack.com') && !url.includes('checkout');
    
    if (isAwayFromPaystack) {
      console.log('User navigated away from Paystack, checking payment status...');
      
      // Stop the payment check and close WebView
      stopPaymentStatusCheck();
      setShowWebView(false);
      
      // Always check final payment status
      if (paymentData?.reference) {
        console.log('Checking final payment status for reference:', paymentData.reference);
        checkFinalPaymentStatus(paymentData.reference);
      }
    }
  };

  const checkFinalPaymentStatus = async (reference: string) => {
    console.log('Checking final payment status for reference:', reference);
    
    // Check if 50 seconds have passed since last callback
    const currentTime = Date.now();
    const timeSinceLastCallback = currentTime - lastCallbackTime.current;
    
    if (timeSinceLastCallback < 50000) { // 50 seconds = 50000ms
      const remainingTime = Math.ceil((50000 - timeSinceLastCallback) / 1000);
      console.log(`Skipping final check - ${remainingTime}s remaining until next allowed call`);
      return;
    }
    
    console.log(`Making final payment callback #${callbackCount.current + 1} for reference: ${reference}`);
    callbackCount.current++;
    lastCallbackTime.current = currentTime;
    
    try {
      const response = await apiService.checkPaymentStatus(reference);
      console.log('Final payment status response:', JSON.stringify(response, null, 2));
      
      if ((response.success || response.status === 'success') && response.data) {
        const transaction = response.data.transaction;
        console.log('Final transaction status:', transaction.status);
        
        if (transaction.status === 'Completed') {
          console.log('Final check: Payment completed successfully!');
          setPaymentStatus('success');
          setSuccessData(response.data);
          setShowSuccessModal(true);
          stopPaymentStatusCheck();
          setShowWebView(false);
        } else if (transaction.status === 'Failed') {
          console.log('Final check: Payment failed, status:', transaction.status);
          setPaymentStatus('failed');
          setErrorMessage('Payment failed. Please try again.');
          setShowErrorModal(true);
          stopPaymentStatusCheck();
          setShowWebView(false);
        } else {
          console.log('Final check: Payment still pending, status:', transaction.status);
          // Don't show error modal for pending payments, let polling continue
          // User can try the button again later
        }
      } else {
        console.log('Final check failed:', response.message);
        setErrorMessage('Unable to verify payment status. Please check your wallet balance.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.log('Final payment status check error:', error);
      setErrorMessage('Unable to verify payment status. Please check your wallet balance.');
      setShowErrorModal(true);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setShowWebView(false);
    setPaymentData(null);
    setAmount('');
    setPaymentStatus('pending');
    onNavigate('home');
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
    setShowWebView(false);
    setPaymentData(null);
    setPaymentStatus('pending');
  };

  const handleGoBack = () => {
    if (showWebView) {
      Alert.alert(
        'Cancel Payment',
        'Are you sure you want to cancel this payment?',
        [
          { text: 'Continue Payment', style: 'cancel' },
          {
            text: 'Cancel Payment',
            style: 'destructive',
            onPress: () => {
              stopPaymentStatusCheck();
              setShowWebView(false);
              setPaymentData(null);
              setPaymentStatus('pending');
            },
          },
        ]
      );
    } else {
      onNavigate('home');
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000];

  if (showWebView && paymentData) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[colors.card + 'F5', colors.card + 'E0']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: paymentData.authorization_url }}
          style={styles.webView}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.webViewLoadingText, { color: colors.text }]}>
                Loading payment gateway...
              </Text>
            </View>
          )}
        />
        

        {/* Error Modal */}
        <CustomModal
          visible={showErrorModal}
          onClose={handleErrorModalClose}
          title="Payment Error"
          message={errorMessage}
          type="error"
          primaryButtonText="Try Again"
          secondaryButtonText="Go Back"
          onPrimaryPress={() => {
            setShowErrorModal(false);
            setShowWebView(false);
            setPaymentData(null);
            setPaymentStatus('pending');
          }}
          onSecondaryPress={handleErrorModalClose}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            Add Funds
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#10B981', '#059669', '#047857']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="wallet" size={32} color="white" />
            </View>
            <Text style={styles.heroTitle}>Fund Your Wallet</Text>
            <Text style={styles.heroSubtitle}>
              Add money securely and instantly to your SureTopUp wallet
            </Text>
          </LinearGradient>
        </View>

        {/* Amount Input Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Enter Amount
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
                onChangeText={(text) => {
                  setAmount(text);
                  const amountValue = parseFloat(text);
                  if (!isNaN(amountValue)) {
                    calculateCharge(amountValue);
                  } else {
                    setChargeData(null);
                  }
                }}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                autoFocus={true}
              />
            </View>
            <View style={styles.amountInputDecoration} />
          </LinearGradient>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Amounts
          </Text>
          <View style={styles.quickAmountsGrid}>
            {quickAmounts.map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountButtonSelected
                ]}
                onPress={() => {
                  setAmount(quickAmount.toString());
                  calculateCharge(quickAmount);
                  triggerHapticFeedback('light');
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quickAmountText,
                  amount === quickAmount.toString() && styles.quickAmountTextSelected
                ]}>
                  ₦{quickAmount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Charge Calculation Display */}
        {chargeData && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Payment Summary
            </Text>
            <LinearGradient
              colors={[colors.card, colors.card + 'F0']}
              style={styles.chargeContainer}
            >
              <View style={styles.chargeRow}>
                <Text style={[styles.chargeLabel, { color: colors.mutedForeground }]}>
                  Amount:
                </Text>
                <Text style={[styles.chargeValue, { color: colors.text }]}>
                  ₦{chargeData.amount.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.chargeRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Total to Pay:
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  ₦{chargeData.total_to_pay.toLocaleString()}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Email Input Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Email Address
          </Text>
          <LinearGradient
            colors={[colors.card, colors.card + 'F0']}
            style={styles.emailInputContainer}
          >
            <View style={styles.emailInputWrapper}>
              <Ionicons name="mail" size={20} color={colors.mutedForeground} />
              <TextInput
                style={[styles.emailInput, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.emailInputDecoration} />
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
              Secure Payment
            </Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Minimum deposit: ₦100
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Processed securely via Paystack
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Instant credit after successful payment
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
          onPress={handleInitializePayment}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLoading ? [colors.mutedForeground, colors.mutedForeground] : ['#10B981', '#059669']}
            style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="card" size={20} color="white" />
            )}
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Initializing Payment...' : 'Proceed to Payment'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
        title="Payment Successful!"
        message={`Your wallet has been credited with ₦${successData?.transaction?.amount || amount}. Your new balance is ₦${successData?.user?.new_balance || '0'}.`}
        type="success"
        primaryButtonText="Continue"
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
    paddingBottom: 60,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#10B981',
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#10B981',
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
  },
  amountInputDecoration: {
    height: 2,
    backgroundColor: '#10B981',
    marginHorizontal: 24,
    marginBottom: 20,
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
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
  emailInputContainer: {
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
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  emailInputDecoration: {
    height: 2,
    backgroundColor: '#10B981',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 1,
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
    shadowColor: '#10B981',
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
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },

  paymentCompleteButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  paymentButtonContent: {
    alignItems: 'center',
  },
  paymentButtonMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentButtonHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  paymentCompleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  chargeContainer: {
    padding: 20,
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
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  chargeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  chargeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },


});
