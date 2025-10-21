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
import { useSafeArea } from '@/hooks/useSafeArea';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { CustomModal } from '@/components/ui/CustomModal';
import { TransactionReceiptScreen } from './TransactionReceiptScreen';

interface DataPurchaseScreenProps {
  onNavigate: (page: string, data?: any) => void;
}

const { width } = Dimensions.get('window');

// Network provider constants
export const NETWORK_PROVIDERS = {
  mtn: {
    name: 'MTN',
    color: '#fbc404',
    logo: require('@/assets/images/mtn.png'),
    prefixes: ['0803', '0806', '0813', '0816', '0814', '0810', '0814', '0903', '0906', '0703', '0706', '0704', '0706', '07025', '07026', '0704'],
  },
  airtel: {
    name: 'Airtel',
    color: '#ec1c24',
    logo: require('@/assets/images/airtel.png'),
    prefixes: ['0802', '0808', '0812', '0701', '0708', '0902', '0907', '0809', '0818', '0817', '0708', '0702'],
  },
  glo: {
    name: 'Glo',
    color: '#1daa10',
    logo: require('@/assets/images/glo.png'),
    prefixes: ['0805', '0807', '0811', '0815', '0705', '0905', '0805', '0815', '0811', '0705'],
  },
  '9mobile': {
    name: '9mobile',
    color: '#040404',
    logo: require('@/assets/images/9mobile.png'),
    prefixes: ['0809', '0817', '0818', '0908', '0909', '0817', '0818', '0809'],
  },
};

interface DataPlan {
  id: number;
  variation_id: string;
  service_name: string;
  service_id: string;
  data_plan: string;
  price: string;
  percentage_charge: string;
  payment_price: string;
  availability: string;
  created_at: string;
  updated_at: string;
}

export const DataPurchaseScreen: React.FC<DataPurchaseScreenProps> = ({ onNavigate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [detectedNetwork, setDetectedNetwork] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [showNetworkSelector, setShowNetworkSelector] = useState(false);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [filteredDataPlans, setFilteredDataPlans] = useState<DataPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<'daily' | 'weekly' | 'monthly' | 'binge'>('daily');
  
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  const { user } = useAuth();

  // Fetch data plans on component mount
  useEffect(() => {
    fetchDataPlans();
  }, []);



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
        filterDataPlansByNetwork(detected);
      }
    } else {
      setDetectedNetwork(null);
      setSelectedNetwork(null);
      setFilteredDataPlans([]);
    }
  }, [phoneNumber, dataPlans]);

  const fetchDataPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const response = await apiService.getDataPlans();
      if ((response.success || response.status === 'success') && response.data) {
        setDataPlans(response.data.dataplans);
      } else {
        setErrorMessage('Failed to load data plans');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const filterDataPlansByNetwork = (network: string) => {
    const filtered = dataPlans.filter(plan => 
      plan.service_id.toLowerCase() === network.toLowerCase()
    );
    setFilteredDataPlans(filtered);
  };

  const categorizePlansByDuration = (plans: DataPlan[]) => {
    const categorized = {
      daily: [] as DataPlan[],
      weekly: [] as DataPlan[],
      monthly: [] as DataPlan[],
      binge: [] as DataPlan[],
    };

    plans.forEach((plan: DataPlan) => {
      const dataPlanText = plan.data_plan.toLowerCase();
      
      // Check for social/binge plans first
      if (dataPlanText.includes('social') || dataPlanText.includes('binge') || 
          dataPlanText.includes('whatsapp') || dataPlanText.includes('facebook') ||
          dataPlanText.includes('instagram') || dataPlanText.includes('twitter') ||
          dataPlanText.includes('youtube') || dataPlanText.includes('tiktok') ||
          dataPlanText.includes('snapchat') || dataPlanText.includes('telegram')) {
        categorized.binge.push(plan);
        return;
      }
      
      // Extract number of days from the plan text
      const dayMatch = dataPlanText.match(/(\d+)\s*days?/i);
      const dayNumber = dayMatch ? parseInt(dayMatch[1]) : null;
      
      if (dayNumber !== null) {
        // Categorize based on actual number of days
        if (dayNumber >= 1 && dayNumber <= 3) {
          categorized.daily.push(plan);
        } else if (dayNumber >= 4 && dayNumber <= 28) {
          categorized.weekly.push(plan);
        } else if (dayNumber >= 30) {
          categorized.monthly.push(plan);
        } else {
          // Fallback for any other day numbers
          categorized.monthly.push(plan);
        }
      } else {
        // Fallback for plans that don't specify days clearly
        if (dataPlanText.includes('day') || dataPlanText.includes('daily')) {
          categorized.daily.push(plan);
        } else if (dataPlanText.includes('week') || dataPlanText.includes('weekly')) {
          categorized.weekly.push(plan);
        } else if (dataPlanText.includes('month') || dataPlanText.includes('monthly')) {
          categorized.monthly.push(plan);
        } else {
          // Default to monthly for plans that don't specify duration
          categorized.monthly.push(plan);
        }
      }
    });

    return categorized;
  };

  const getCurrentPlans = () => {
    const categorized = categorizePlansByDuration(filteredDataPlans);
    const plans = categorized[selectedDuration] || [];
    
    // Sort plans by payment price from lowest to highest
    return plans.sort((a, b) => parseFloat(a.payment_price) - parseFloat(b.payment_price));
  };

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
    
    if (!selectedNetwork) {
      setErrorMessage('Please select a network provider');
      setShowErrorModal(true);
      return false;
    }
    
    if (!selectedPlan) {
      setErrorMessage('Please select a data plan');
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
        network: selectedNetwork!,
        dataplan: selectedPlan!.variation_id.toString(),
        amount: parseFloat(selectedPlan!.payment_price),
        phone: phoneNumber,
        tpin: transactionPin,
      };
      
      console.log('Sending data purchase request:', requestData);
      
      const response = await apiService.buyData(requestData);
      
      console.log('Data purchase response:', response);
      console.log('Ebills data structure:', response.data);
      
      if ((response.success || response.status === 'success') && response.data) {
        // Store network info before clearing state
        const networkName = selectedNetwork ? getNetworkInfo(selectedNetwork).name : undefined;
        const dataPlanName = selectedPlan?.data_plan;
        
        setSuccessData({
          ...response.data,
          network: networkName,
          dataPlan: dataPlanName,
        });
        setShowSuccessModal(true);
        // Clear form on success
        setPhoneNumber('');
        setTransactionPin('');
        setSelectedNetwork(null);
        setDetectedNetwork(null);
        setSelectedPlan(null);
        setFilteredDataPlans([]);
      } else {
        setErrorMessage(response.message || 'Failed to purchase data');
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
    // Navigate to receipt screen with data - match history screen structure
    onNavigate('receipt', {
      reference: successData.reference,
      amount: successData.amount,
      service: successData.service || 'Data',
      date: successData.transaction?.date || new Date().toISOString(),
      businessName: 'SureTopUp',
      // Network information
      network: successData.transaction?.network || selectedNetwork,
      // Data plan information
      dataPlan: selectedPlan?.data_plan,
      dataAmount: selectedPlan?.payment_price,
      // Megabytes information from API response
      megabytes: successData.megabytes || successData.transaction?.megabytes,
      // Additional transaction details
      transactionId: successData.transaction?.id,
      type: successData.transaction?.type,
      status: successData.transaction?.status,
      oldBalance: successData.transaction?.old_balance,
      newBalance: successData.transaction?.new_balance,
      info: successData.transaction?.info || successData.phone,
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
            Data Purchase
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
            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="cellular" size={32} color="white" />
            </View>
            <Text style={styles.heroTitle}>Buy Data</Text>
            <Text style={styles.heroSubtitle}>
              Get the best data plans for your network
            </Text>
          </LinearGradient>
        </View>

        {/* Phone Number Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Phone Number
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
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
                textAlignVertical="center"
                underlineColorAndroid="transparent"
              />
            </View>
          </View>
          
          {/* Network Selection - Compact */}
          {phoneNumber.length >= 4 && (
            <View style={styles.networkSection}>
              {selectedNetwork ? (
                <View style={styles.networkCard}>
                  <View style={styles.networkInfo}>
                    <View style={[
                      styles.networkIconContainer,
                    ]}>
                      <Image 
                        source={getNetworkInfo(selectedNetwork).logo}
                        style={styles.networkLogo}
                        resizeMode="cover"
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

        {/* Data Plans Section */}
        {selectedNetwork && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Available Plans
            </Text>
            
            {/* Duration Toggle */}
            <View style={styles.durationToggleContainer}>
              {(['daily', 'weekly', 'monthly', 'binge'] as const).map((duration) => {
                return (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationToggleButton,
                      selectedDuration === duration && styles.durationToggleButtonActive
                    ]}
                    onPress={() => {
                      setSelectedDuration(duration);
                      setSelectedPlan(null); // Clear selection when changing duration
                      triggerHapticFeedback('light');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.durationToggleText,
                      { color: selectedDuration === duration ? 'white' : colors.mutedForeground }
                    ]}>
                      {duration === 'binge' ? 'Binge/Social' : duration.charAt(0).toUpperCase() + duration.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isLoadingPlans ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  Loading data plans...
                </Text>
              </View>
            ) : getCurrentPlans().length > 0 ? (
              <View style={styles.dataPlansContainer}>
                {getCurrentPlans().map((plan) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.dataPlanCard,
                      selectedPlan?.id === plan.id && styles.dataPlanCardSelected
                    ]}
                    onPress={() => {
                      setSelectedPlan(plan);
                      triggerHapticFeedback('light');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dataPlanHeader}>
                      <View style={styles.dataPlanInfo}>
                        <Text style={[
                          styles.dataPlanName, 
                          { color: selectedPlan?.id === plan.id ? '#8B5CF6' : colors.text }
                        ]}>
                          {plan.data_plan}
                        </Text>
                        <Text style={[
                          styles.dataPlanNetwork, 
                          { color: selectedPlan?.id === plan.id ? '#8B5CF6' : colors.mutedForeground }
                        ]}>
                          {plan.service_name}
                        </Text>
                      </View>
                      <View style={styles.dataPlanPrice}>
                        <Text style={[
                          styles.dataPlanPriceText, 
                          { color: selectedPlan?.id === plan.id ? '#8B5CF6' : '#10B981' }
                        ]}>
                          {formatPrice(plan.payment_price)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dataPlanFooter}>
                      {selectedPlan?.id === plan.id && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noPlansContainer}>
                <Ionicons name="cellular-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.noPlansText, { color: colors.mutedForeground }]}>
                  No {selectedDuration} plans available for {getNetworkInfo(selectedNetwork).name}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Transaction PIN */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
              Secure Data Purchase
            </Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Instant activation
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
                Best prices guaranteed
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
          onPress={handlePurchase}
          disabled={isLoading || !selectedPlan}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLoading || !selectedPlan ? [colors.mutedForeground, colors.mutedForeground] : ['#8B5CF6', '#7C3AED']}
            style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="cellular" size={20} color="white" />
            )}
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Processing...' : selectedPlan ? `Buy ${selectedPlan.data_plan}` : `Select a ${selectedDuration} Plan`}
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
                  filterDataPlansByNetwork(network);
                  setShowNetworkSelector(false);
                  triggerHapticFeedback('light');
                }}
              >
                <View style={[
                  styles.networkOptionIcon,
                ]}>
                  <Image 
                    source={data.logo}
                    style={styles.networkLogo}
                    resizeMode="cover"
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
        title="Data Purchase Successful!"
        message={`${successData?.transaction?.info} has been credited with data. Your transaction reference is ${successData?.reference}.`}
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
  },
  heroSection: {
    marginBottom: 32,
  },
  heroCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
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
  networkSection: {
    marginTop: 8,
  },
  networkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  networkIconContainer: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  networkLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  dataPlansContainer: {
    gap: 12,
  },
  dataPlanCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dataPlanCardSelected: {
    backgroundColor: '#F8F7FF',
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  dataPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dataPlanInfo: {
    flex: 1,
  },
  dataPlanName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataPlanNetwork: {
    fontSize: 14,
    fontWeight: '500',
  },
  dataPlanPrice: {
    alignItems: 'center',
  },
  dataPlanPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  dataPlanOriginalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  dataPlanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  noPlansContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noPlansText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
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
    shadowColor: '#8B5CF6',
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
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderColor: '#8B5CF6',
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
  durationToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    paddingVertical: 8,
  },
  durationToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  durationToggleButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  durationToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },

});
