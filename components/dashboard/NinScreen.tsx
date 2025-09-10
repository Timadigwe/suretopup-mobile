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

interface NinSlipType {
  id: number;
  type: string;
  name: string;
  price: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const NinScreen: React.FC<{ onNavigate: (screen: string, data?: any) => void }> = ({ onNavigate }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  
  const [step, setStep] = useState<'slip-type' | 'details' | 'confirm'>('slip-type');
  const [slipTypes, setSlipTypes] = useState<NinSlipType[]>([]);
  const [selectedSlipType, setSelectedSlipType] = useState<NinSlipType | null>(null);
  const [ninNumber, setNinNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [tpin, setTpin] = useState('');
  
  const [isLoadingSlipTypes, setIsLoadingSlipTypes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showSlipTypeSelector, setShowSlipTypeSelector] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  
  useEffect(() => {
    fetchSlipTypes();
  }, []);

  const fetchSlipTypes = async () => {
    setIsLoadingSlipTypes(true);
    try {
      const response = await apiService.getNinSlipTypes();
      if (response.success && response.data) {
        setSlipTypes(response.data.slip_types);
      } else {
        Alert.alert('Error', 'Failed to fetch slip types');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch slip types');
    } finally {
      setIsLoadingSlipTypes(false);
    }
  };

  const handleSlipTypeSelect = (slipType: NinSlipType) => {
    setSelectedSlipType(slipType);
    setAmount(slipType.price.toString());
    setStep('details');
    setShowSlipTypeSelector(false);
    triggerHapticFeedback('light');
  };

  const handleContinueToConfirm = () => {
    if (!ninNumber.trim()) {
      Alert.alert('Error', 'Please enter your NIN number');
      return;
    }
    setStep('confirm');
    triggerHapticFeedback('light');
  };

  const submitNinRequest = async () => {
    if (!selectedSlipType || !ninNumber.trim() || !tpin.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.submitNinRequest({
        slip_type: selectedSlipType.type,
        nin_number: ninNumber.trim(),
        amount: amount,
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        // Show success modal
        setSuccessMessage(response.message || 'NIN request successful!');
        setSuccessData({
          reference: response.data?.transaction?.ref || 'N/A',
          amount: parseInt(amount),
          service: 'NIN Print',
          date: new Date().toISOString(),
          businessName: 'SureTopUp',
          // Transaction details for consistency with history
          transactionId: response.data?.transaction?.id,
          type: response.data?.transaction?.type || 'Debit',
          status: response.data?.transaction?.status || 'Pending',
          old_balance: response.data?.transaction?.old_balance?.toString(),
          new_balance: response.data?.transaction?.new_balance?.toString(),
          info: response.data?.transaction?.info || '',
          // NIN-specific data
          serviceName: selectedSlipType.name,
          customerId: ninNumber.trim(),
          slipType: selectedSlipType.type,
          ninId: response.data?.nin_id,
        });
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', response.message || 'NIN request failed');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'NIN request failed');
      triggerHapticFeedback('heavy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSlipType(null);
    setNinNumber('');
    setAmount('');
    setTpin('');
    setStep('slip-type');
  };

  const handleGoBack = () => {
    if (step === 'slip-type') {
      onNavigate('home');
    } else if (step === 'details') {
      setStep('slip-type');
      setSelectedSlipType(null);
      setAmount('');
    } else if (step === 'confirm') {
      setStep('details');
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'slip-type', title: 'Select Slip Type' },
      { key: 'details', title: 'Enter Details' },
      { key: 'confirm', title: 'Confirm & Pay' },
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

  const renderSlipTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Select the type of NIN slip you want to print
      </Text>
      
      {isLoadingSlipTypes ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading slip types...
          </Text>
        </View>
      ) : (
        <View style={styles.slipTypesGrid}>
          {slipTypes.map((slipType) => (
            <TouchableOpacity
              key={slipType.id}
              style={[
                styles.slipTypeCard,
                { backgroundColor: colors.card }
              ]}
              onPress={() => handleSlipTypeSelect(slipType)}
              activeOpacity={0.8}
            >
              <View style={styles.slipTypeIconContainer}>
                <Ionicons name="card" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.slipTypeName, { color: colors.text }]}>
                {slipType.name}
              </Text>
              <Text style={[styles.slipTypePrice, { color: colors.primary }]}>
                ₦{slipType.price.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderDetails = () => (
    <View style={styles.stepContent}>
      <View style={styles.selectedSlipTypeCard}>
        <View style={styles.slipTypeInfo}>
          <View style={styles.slipTypeIconContainer}>
            <Ionicons name="card" size={24} color={colors.primary} />
          </View>
          <View style={styles.slipTypeDetails}>
            <Text style={[styles.slipTypeName, { color: colors.text }]}>
              {selectedSlipType?.name}
            </Text>
            <Text style={[styles.slipTypePrice, { color: colors.primary }]}>
              ₦{selectedSlipType?.price.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>NIN Number</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter your 11-digit NIN number"
          placeholderTextColor={colors.mutedForeground}
          value={ninNumber}
          onChangeText={setNinNumber}
          keyboardType="numeric"
          maxLength={11}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.primary },
          (!ninNumber.trim()) && { opacity: 0.6 }
        ]}
        onPress={handleContinueToConfirm}
        disabled={!ninNumber.trim()}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-forward" size={20} color={colors.background} />
        <Text style={[styles.actionButtonText, { color: colors.background }]}>
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <View style={styles.confirmationCard}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>
            Confirm Details
          </Text>
        </View>
        
        <View style={styles.confirmationDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Slip Type:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {selectedSlipType?.name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              NIN Number:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {ninNumber}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              Amount:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              ₦{parseInt(amount).toLocaleString()}
            </Text>
          </View>
        </View>
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
          maxLength={4}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.actionButton,
          { backgroundColor: colors.primary },
          (!tpin.trim() || isSubmitting) && { opacity: 0.6 }
        ]}
        onPress={submitNinRequest}
        disabled={!tpin.trim() || isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Ionicons name="card" size={20} color={colors.background} />
            <Text style={[styles.actionButtonText, { color: colors.background }]}>
              Print NIN Slip
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'slip-type':
        return renderSlipTypeSelection();
      case 'details':
        return renderDetails();
      case 'confirm':
        return renderConfirmation();
      default:
        return renderSlipTypeSelection();
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>NIN Print</Text>
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
                <Ionicons name="card" size={32} color="white" />
              </View>
              <Text style={styles.heroTitle}>Print NIN Slip</Text>
              <Text style={styles.heroSubtitle}>
                Get your National Identity Number slip printed
              </Text>
            </View>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          {renderCurrentStep()}
        </View>
      </ScrollView>

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
  slipTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slipTypeCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  slipTypeIconContainer: {
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
  slipTypeName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  slipTypePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedSlipTypeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  slipTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slipTypeDetails: {
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  confirmationDetails: {
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

export default NinScreen;
