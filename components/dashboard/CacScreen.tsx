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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';
import { apiService } from '../../services/api';
import { CustomModal } from '../ui/CustomModal';

interface CacFormData {
  certificate_type: string;
  business_name_1: string;
  business_name_2: string;
  company_address: string;
  residential_address: string;
  nature_of_business: string;
  share_capital: string;
  id_card_of_directors: any;
  passport_photograph: any;
  phone: string;
  email: string;
  fullname: string;
  dob: string;
  country: string;
  city: string;
  state: string;
  lga: string;
  sign: any;
  amount: string;
}

const CacScreen: React.FC<{ onNavigate: (screen: string, data?: any) => void }> = ({ onNavigate }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  
  const [step, setStep] = useState<'info' | 'business' | 'personal' | 'documents' | 'confirm'>('info');
  const [cacPrice, setCacPrice] = useState<string>('');
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  
  const [formData, setFormData] = useState<CacFormData>({
    certificate_type: '',
    business_name_1: '',
    business_name_2: '',
    company_address: '',
    residential_address: '',
    nature_of_business: '',
    share_capital: '',
    id_card_of_directors: null,
    passport_photograph: null,
    phone: '',
    email: '',
    fullname: '',
    dob: '',
    country: '',
    city: '',
    state: '',
    lga: '',
    sign: null,
    amount: '',
  });
  
  useEffect(() => {
    fetchCacPrice();
  }, []);

  const fetchCacPrice = async () => {
    setIsLoadingPrice(true);
    try {
      const response = await apiService.getCacPrice();
      
      if (response.success && response.cac_price) {
        const cacPrice = response.cac_price;
        setCacPrice(cacPrice);
        setFormData(prev => ({ ...prev, amount: cacPrice }));
      } else {
        Alert.alert('Error', 'Failed to fetch CAC price');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch CAC price');
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const pickImage = async (field: keyof CacFormData) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, [field]: result.assets[0] }));
        triggerHapticFeedback('light');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickDocument = async (field: keyof CacFormData) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, [field]: result.assets[0] }));
        triggerHapticFeedback('light');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleInputChange = (field: keyof CacFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (step === 'info') {
      if (!formData.certificate_type.trim()) {
        Alert.alert('Error', 'Please enter certificate type');
        return;
      }
      setStep('business');
    } else if (step === 'business') {
      if (!formData.business_name_1.trim() || !formData.company_address.trim()) {
        Alert.alert('Error', 'Please fill in all required business fields');
        return;
      }
      setStep('personal');
    } else if (step === 'personal') {
      if (!formData.fullname.trim() || !formData.phone.trim() || !formData.email.trim()) {
        Alert.alert('Error', 'Please fill in all required personal fields');
        return;
      }
      setStep('documents');
    } else if (step === 'documents') {
      if (!formData.id_card_of_directors || !formData.passport_photograph || !formData.sign) {
        Alert.alert('Error', 'Please upload all required documents');
        return;
      }
      setStep('confirm');
    }
    triggerHapticFeedback('light');
  };

  const handlePreviousStep = () => {
    if (step === 'business') {
      setStep('info');
    } else if (step === 'personal') {
      setStep('business');
    } else if (step === 'documents') {
      setStep('personal');
    } else if (step === 'confirm') {
      setStep('documents');
    }
    triggerHapticFeedback('light');
  };

  const submitCacRequest = async () => {
    if (!formData.amount.trim()) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'id_card_of_directors' && key !== 'passport_photograph' && key !== 'sign') {
          formDataToSend.append(key, formData[key as keyof CacFormData] as string);
        }
      });

      // Add file fields
      if (formData.id_card_of_directors) {
        const idCardFile = {
          uri: formData.id_card_of_directors.uri,
          type: 'image/jpeg',
          name: 'id_card.jpg',
        };
        formDataToSend.append('id_card_of_directors', idCardFile as any);
      }

      if (formData.passport_photograph) {
        const passportFile = {
          uri: formData.passport_photograph.uri,
          type: 'image/jpeg',
          name: 'passport.jpg',
        };
        formDataToSend.append('passport_photograph', passportFile as any);
      }

      if (formData.sign) {
        const signFile = {
          uri: formData.sign.uri,
          type: 'image/jpeg',
          name: 'sign.jpg',
        };
        formDataToSend.append('sign', signFile as any);
      }

      const response = await apiService.submitCacRequest(formDataToSend);

      if (response.success) {
        triggerHapticFeedback('medium');
        setSuccessMessage(response.message || 'CAC request submitted successfully!');
        setSuccessData({
          reference: 'CAC-' + Date.now(),
          amount: parseFloat(formData.amount),
          service: 'CAC Registration',
          date: new Date().toISOString(),
          businessName: 'SureTopUp',
          // CAC-specific data
          serviceName: 'CAC Registration',
          certificateType: formData.certificate_type,
          businessName1: formData.business_name_1,
          fullname: formData.fullname,
        });
        setShowSuccessModal(true);
      } else {
        Alert.alert('Error', response.message || 'CAC request failed');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'CAC request failed');
      triggerHapticFeedback('heavy');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      certificate_type: '',
      business_name_1: '',
      business_name_2: '',
      company_address: '',
      residential_address: '',
      nature_of_business: '',
      share_capital: '',
      id_card_of_directors: null,
      passport_photograph: null,
      phone: '',
      email: '',
      fullname: '',
      dob: '',
      country: '',
      city: '',
      state: '',
      lga: '',
      sign: null,
      amount: '',
    });
    setStep('info');
  };

  const handleGoBack = () => {
    if (step === 'info') {
      onNavigate('home');
    } else {
      handlePreviousStep();
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'info', title: 'Basic Info' },
      { key: 'business', title: 'Business' },
      { key: 'personal', title: 'Personal' },
      { key: 'documents', title: 'Documents' },
      { key: 'confirm', title: 'Confirm' },
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

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Enter basic information for your CAC registration
      </Text>
      
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Certificate Type *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter certificate type"
          placeholderTextColor={colors.mutedForeground}
          value={formData.certificate_type}
          onChangeText={(value) => handleInputChange('certificate_type', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.priceCard}>
        <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>CAC Registration Fee</Text>
        {isLoadingPrice ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <Text style={[styles.priceValue, { color: colors.primary }]}>
            ₦{cacPrice ? parseInt(cacPrice).toLocaleString() : '0'}
          </Text>
        )}
      </View>
    </View>
  );

  const renderBusinessInfo = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Provide your business information
      </Text>
      
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Business Name 1 *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter business name"
          placeholderTextColor={colors.mutedForeground}
          value={formData.business_name_1}
          onChangeText={(value) => handleInputChange('business_name_1', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Business Name 2</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter second business name (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={formData.business_name_2}
          onChangeText={(value) => handleInputChange('business_name_2', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Company Address *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter company address"
          placeholderTextColor={colors.mutedForeground}
          value={formData.company_address}
          onChangeText={(value) => handleInputChange('company_address', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Residential Address</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter residential address"
          placeholderTextColor={colors.mutedForeground}
          value={formData.residential_address}
          onChangeText={(value) => handleInputChange('residential_address', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Nature of Business</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter nature of business"
          placeholderTextColor={colors.mutedForeground}
          value={formData.nature_of_business}
          onChangeText={(value) => handleInputChange('nature_of_business', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Share Capital</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter share capital"
          placeholderTextColor={colors.mutedForeground}
          value={formData.share_capital}
          onChangeText={(value) => handleInputChange('share_capital', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Provide your personal information
      </Text>
      
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter your full name"
          placeholderTextColor={colors.mutedForeground}
          value={formData.fullname}
          onChangeText={(value) => handleInputChange('fullname', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter phone number"
          placeholderTextColor={colors.mutedForeground}
          value={formData.phone}
          onChangeText={(value) => handleInputChange('phone', value)}
          keyboardType="phone-pad"
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address *</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter email address"
          placeholderTextColor={colors.mutedForeground}
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Date of Birth</Text>
        <TextInput
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.background,
          }]}
          placeholder="Enter date of birth"
          placeholderTextColor={colors.mutedForeground}
          value={formData.dob}
          onChangeText={(value) => handleInputChange('dob', value)}
          textAlignVertical="center"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputSection, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Country</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.background,
            }]}
            placeholder="Country"
            placeholderTextColor={colors.mutedForeground}
            value={formData.country}
            onChangeText={(value) => handleInputChange('country', value)}
            textAlignVertical="center"
            underlineColorAndroid="transparent"
          />
        </View>
        <View style={[styles.inputSection, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>State</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.background,
            }]}
            placeholder="State"
            placeholderTextColor={colors.mutedForeground}
            value={formData.state}
            onChangeText={(value) => handleInputChange('state', value)}
            textAlignVertical="center"
            underlineColorAndroid="transparent"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputSection, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>City</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.background,
            }]}
            placeholder="City"
            placeholderTextColor={colors.mutedForeground}
            value={formData.city}
            onChangeText={(value) => handleInputChange('city', value)}
            textAlignVertical="center"
            underlineColorAndroid="transparent"
          />
        </View>
        <View style={[styles.inputSection, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>LGA</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.background,
            }]}
            placeholder="LGA"
            placeholderTextColor={colors.mutedForeground}
            value={formData.lga}
            onChangeText={(value) => handleInputChange('lga', value)}
            textAlignVertical="center"
            underlineColorAndroid="transparent"
          />
        </View>
      </View>
    </View>
  );

  const renderDocuments = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Upload required documents for CAC registration
      </Text>
      
      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>ID Card of Directors *</Text>
        <TouchableOpacity
          style={[styles.fileUploadButton, { borderColor: colors.border }]}
          onPress={() => pickImage('id_card_of_directors')}
        >
          {formData.id_card_of_directors ? (
            <View style={styles.filePreview}>
              <Image 
                source={{ uri: formData.id_card_of_directors.uri }} 
                style={styles.filePreviewImage} 
              />
              <Text style={[styles.fileName, { color: colors.text }]}>
                ID Card uploaded
              </Text>
            </View>
          ) : (
            <View style={styles.fileUploadContent}>
              <Ionicons name="cloud-upload" size={24} color={colors.primary} />
              <Text style={[styles.fileUploadText, { color: colors.text }]}>
                Upload ID Card
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Passport Photograph *</Text>
        <TouchableOpacity
          style={[styles.fileUploadButton, { borderColor: colors.border }]}
          onPress={() => pickImage('passport_photograph')}
        >
          {formData.passport_photograph ? (
            <View style={styles.filePreview}>
              <Image 
                source={{ uri: formData.passport_photograph.uri }} 
                style={styles.filePreviewImage} 
              />
              <Text style={[styles.fileName, { color: colors.text }]}>
                Passport uploaded
              </Text>
            </View>
          ) : (
            <View style={styles.fileUploadContent}>
              <Ionicons name="cloud-upload" size={24} color={colors.primary} />
              <Text style={[styles.fileUploadText, { color: colors.text }]}>
                Upload Passport
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Signature *</Text>
        <TouchableOpacity
          style={[styles.fileUploadButton, { borderColor: colors.border }]}
          onPress={() => pickImage('sign')}
        >
          {formData.sign ? (
            <View style={styles.filePreview}>
              <Image 
                source={{ uri: formData.sign.uri }} 
                style={styles.filePreviewImage} 
              />
              <Text style={[styles.fileName, { color: colors.text }]}>
                Signature uploaded
              </Text>
            </View>
          ) : (
            <View style={styles.fileUploadContent}>
              <Ionicons name="cloud-upload" size={24} color={colors.primary} />
              <Text style={[styles.fileUploadText, { color: colors.text }]}>
                Upload Signature
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmation = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.mutedForeground }]}>
        Review your information before submitting
      </Text>
      
      <View style={styles.confirmationCard}>
        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>Basic Information</Text>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Certificate Type:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>{formData.certificate_type}</Text>
          </View>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>Business Information</Text>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Business Name:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>{formData.business_name_1}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Company Address:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>{formData.company_address}</Text>
          </View>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>Personal Information</Text>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Full Name:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>{formData.fullname}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Phone:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>{formData.phone}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Email:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>{formData.email}</Text>
          </View>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>Documents</Text>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>ID Card:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {formData.id_card_of_directors ? '✓ Uploaded' : '✗ Missing'}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Passport:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {formData.passport_photograph ? '✓ Uploaded' : '✗ Missing'}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Signature:</Text>
            <Text style={[styles.confirmationValue, { color: colors.text }]}>
              {formData.sign ? '✓ Uploaded' : '✗ Missing'}
            </Text>
          </View>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationTitle, { color: colors.text }]}>Payment</Text>
          <View style={styles.confirmationRow}>
            <Text style={[styles.confirmationLabel, { color: colors.mutedForeground }]}>Amount:</Text>
            <Text style={[styles.confirmationValue, { color: colors.primary }]}>₦{parseInt(formData.amount).toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          { backgroundColor: colors.primary },
          isSubmitting && { opacity: 0.6 }
        ]}
        onPress={submitCacRequest}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={colors.background} />
            <Text style={[styles.submitButtonText, { color: colors.background }]}>
              Submit CAC Request
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'info':
        return renderBasicInfo();
      case 'business':
        return renderBusinessInfo();
      case 'personal':
        return renderPersonalInfo();
      case 'documents':
        return renderDocuments();
      case 'confirm':
        return renderConfirmation();
      default:
        return renderBasicInfo();
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>CAC Registration</Text>
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
                <Ionicons name="business" size={32} color="white" />
              </View>
              <Text style={styles.heroTitle}>CAC Registration</Text>
              <Text style={styles.heroSubtitle}>
                Register your business with Corporate Affairs Commission
              </Text>
            </View>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          {step !== 'confirm' && (
            <View style={styles.navigationButtons}>
              {step !== 'info' && (
                <TouchableOpacity
                  style={[styles.navButton, { borderColor: colors.border }]}
                  onPress={handlePreviousStep}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.text} />
                  <Text style={[styles.navButtonText, { color: colors.text }]}>
                    Previous
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.navButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleNextStep}
                activeOpacity={0.8}
              >
                <Text style={[styles.navButtonText, { color: colors.background }]}>
                  Next
                </Text>
                <Ionicons name="arrow-forward" size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          )}
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
  row: {
    flexDirection: 'row',
  },
  priceCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    marginTop: 16,
  },
  priceLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  fileUploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  fileUploadContent: {
    alignItems: 'center',
  },
  fileUploadText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  filePreview: {
    alignItems: 'center',
  },
  filePreviewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmationCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  confirmationSection: {
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  confirmationLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  confirmationValue: {
    fontSize: 14,
    flex: 2,
    textAlign: 'right',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 120,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CacScreen;
