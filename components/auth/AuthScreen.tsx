import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { CustomPhoneInput } from '@/components/ui/PhoneInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { CustomModal } from '@/components/ui/CustomModal';
import { NIGERIAN_STATES } from '@/constants/NigerianStates';

interface AuthScreenProps {
  onLogin: () => void;
  onBack: () => void;
  onEmailVerification: (email: string, registrationData?: any) => void;
  onForgotPassword: () => void;
}

const { width } = Dimensions.get('window');

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onBack, onEmailVerification, onForgotPassword }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    phoneFormatted: '',
    tpin: '',
    state: '',
    password: '',
    password_confirmation: '',
  });
  
  // Forgot password form data
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: '',
  });
  
  // Input validation states
  const [errors, setErrors] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    tpin: '',
    state: '',
    password: '',
    password_confirmation: '',
  });
  
  // Forgot password validation states
  const [forgotPasswordErrors, setForgotPasswordErrors] = useState({
    email: '',
  });
  
  // Input focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    onPrimaryPress: () => {},
  });
  
  const { colors } = useTheme();
  const { triggerHapticFeedback, triggerNotificationHaptic } = useMobileFeatures();
  const { login, register, forgotPassword, isLoading: authLoading } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation for loading spinner
  const spinValue = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isLoading, spinValue]);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Helper function to get user-friendly error messages
  const getUserFriendlyError = (message: string, type: 'login' | 'register' | 'forgot-password') => {
    const lowerMessage = message.toLowerCase();
    
    if (type === 'login') {
      if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('wrong password')) {
        return 'Invalid email or password. Please check your credentials and try again.';
      } else if (lowerMessage.includes('user not found') || lowerMessage.includes('email not found')) {
        return 'No account found with this email. Please check your email or sign up for a new account.';
      }
    } else if (type === 'register') {
      if (lowerMessage.includes('email already exists') || lowerMessage.includes('email has already been taken')) {
        return 'An account with this email already exists. Please try logging in instead.';
      } else if (lowerMessage.includes('phone') && lowerMessage.includes('already exists')) {
        return 'An account with this phone number already exists. Please try logging in instead.';
      }
    } else if (type === 'forgot-password') {
      if (lowerMessage.includes('email not found') || lowerMessage.includes('user not found')) {
        return 'No account found with this email address. Please check your email or sign up for a new account.';
      }
    }
    
    // Common error patterns
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'Connection error. Please check your internet connection and try again.';
    } else if (lowerMessage.includes('validation')) {
      return type === 'login' 
        ? 'Please check your email and password format.'
        : 'Please check your information and try again. Make sure all fields are filled correctly.';
    }
    
    return message; // Return original message if no specific pattern matches
  };

  // Helper function to handle API validation errors and update form field errors
  const handleApiValidationErrors = (apiResponse: any) => {
    if (apiResponse.errors && typeof apiResponse.errors === 'object') {
      const newErrors = { ...errors };
      
      // Map API field errors to form field errors
      Object.keys(apiResponse.errors).forEach(field => {
        const fieldError = apiResponse.errors[field];
        if (Array.isArray(fieldError) && fieldError.length > 0) {
          // Map API field names to form field names
          const formField = field === 'password_confirmation' ? 'password_confirmation' : field;
          if (formField in newErrors) {
            newErrors[formField as keyof typeof newErrors] = fieldError[0];
          }
        }
      });
      
      setErrors(newErrors);
      return true; // Indicates that field errors were set
    }
    return false; // No field errors to set
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation
    validateField(field, value);
  };

  const scrollToFocusedInput = (field: string) => {
    // Only scroll for the last few fields that might be hidden by keyboard
    const fieldsNeedingScroll = ['password', 'password_confirmation'];
    
    if (fieldsNeedingScroll.includes(field)) {
      // Add a small delay to ensure the keyboard is shown
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 250);
    }
  };
  
  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'firstname':
        if (value.length > 0 && value.length < 2) {
          error = 'First name must be at least 2 characters';
        }
        break;
      case 'lastname':
        if (value.length > 0 && value.length < 2) {
          error = 'Last name must be at least 2 characters';
        }
        break;
      case 'email':
        if (value.length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            error = 'Please enter a valid email address';
          }
        }
        break;
      case 'phone':
        if (value.length > 0 && value.length < 10) {
          error = 'Please enter a valid phone number';
        }
        break;
      case 'tpin':
        if (value.length > 0) {
          if (value.length !== 4 || !/^\d{4}$/.test(value)) {
            error = 'TPIN must be exactly 4 digits';
          }
        }
        break;
      case 'state':
        if (value.length > 0 && !NIGERIAN_STATES.some(state => state.value === value)) {
          error = 'Please select a valid state';
        }
        break;
      case 'password':
        if (value.length > 0 && value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      case 'password_confirmation':
        if (value.length > 0 && value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onPrimaryPress?: () => void) => {
    setModalConfig({
      title,
      message,
      type,
      onPrimaryPress: onPrimaryPress || (() => setModalVisible(false)),
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    // Validate all fields
    const newErrors = {
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      tpin: '',
      state: '',
      password: '',
      password_confirmation: '',
    };
    
    if (isLogin) {
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
    } else {
      if (!formData.firstname) newErrors.firstname = 'First name is required';
      if (!formData.lastname) newErrors.lastname = 'Last name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.tpin) newErrors.tpin = 'TPIN is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (!formData.password_confirmation) newErrors.password_confirmation = 'Password confirmation is required';
    }
    
    // Additional validation for filled fields
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (formData.tpin && (formData.tpin.length !== 4 || !/^\d{4}$/.test(formData.tpin))) {
      newErrors.tpin = 'TPIN must be exactly 4 digits';
    }
    if (formData.state && !NIGERIAN_STATES.some(state => state.value === formData.state)) {
      newErrors.state = 'Please select a valid state';
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password_confirmation && formData.password_confirmation !== formData.password) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    if (formData.firstname && formData.firstname.length < 2) {
      newErrors.firstname = 'First name must be at least 2 characters';
    }
    if (formData.lastname && formData.lastname.length < 2) {
      newErrors.lastname = 'Last name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    
    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    
    if (hasErrors) {
      triggerHapticFeedback('heavy');
      return;
    }

    setIsLoading(true);
    triggerNotificationHaptic();
    
    if (isLogin) {
      // Handle login
      login(formData.email, formData.password).then((result) => {
        setIsLoading(false);
        if (result.success) {
          onLogin();
        } else {
          const errorMessage = getUserFriendlyError(result.message, 'login');
          showModal('Login Failed', errorMessage, 'error');
        }
      });
    } else {
      // Handle registration
      const userData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        phone: formData.phoneFormatted || formData.phone,
        tpin: formData.tpin,
        state: formData.state,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      };
      
      register(userData).then((result: { success: boolean; message: string; data?: any; userData?: any }) => {
        setIsLoading(false);
        if (result.success) {
          // Navigate to email verification with the registration data
          onEmailVerification(formData.email, result.data);
        } else {
          // Check if there are specific field validation errors
          if (result.data && handleApiValidationErrors(result.data)) {
            // Field errors were set, show a general message
            showModal('Registration Failed', 'Please correct the errors in the form and try again.', 'error');
          } else {
            // Show the user-friendly error message
            const errorMessage = getUserFriendlyError(result.message, 'register');
            showModal('Registration Failed', errorMessage, 'error');
          }
        }
      });
    }
  };

  const toggleAuthMode = () => {
    triggerHapticFeedback('light');
    setIsLogin(!isLogin);
    setShowForgotPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormData({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      phoneFormatted: '',
      tpin: '',
      state: '',
      password: '',
      password_confirmation: '',
    });
    // Clear all errors when switching modes
    setErrors({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      tpin: '',
      state: '',
      password: '',
      password_confirmation: '',
    });
    setForgotPasswordErrors({
      email: '',
    });
    setFocusedField(null);
  };

  const handleForgotPassword = () => {
    triggerHapticFeedback('light');
    onForgotPassword();
  };

  const handleBackToLogin = () => {
    triggerHapticFeedback('light');
    setShowForgotPassword(false);
    setForgotPasswordData({ email: '' });
    setForgotPasswordErrors({ email: '' });
    setFocusedField(null);
  };

  const handleForgotPasswordSubmit = () => {
    // Validate email
    const newErrors = { email: '' };
    
    if (!forgotPasswordData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setForgotPasswordErrors(newErrors);
    
    if (newErrors.email) {
      triggerHapticFeedback('heavy');
      return;
    }

    setIsLoading(true);
    triggerNotificationHaptic();
    
    // Use actual API for password reset
    forgotPassword(forgotPasswordData.email).then((result: { success: boolean; message: string }) => {
      setIsLoading(false);
      if (result.success) {
        showModal(
          'Reset Link Sent',
          'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions.',
          'success',
          () => {
            setModalVisible(false);
            handleBackToLogin();
          }
        );
      } else {
        const errorMessage = getUserFriendlyError(result.message, 'forgot-password');
        showModal('Reset Failed', errorMessage, 'error');
      }
    });
  };

  const togglePasswordVisibility = () => {
    triggerHapticFeedback('light');
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    triggerHapticFeedback('light');
    setShowConfirmPassword(!showConfirmPassword);
  };

  const renderLogo = () => (
    <View style={styles.logoContainer}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
    </View>
  );

  const renderInput = (
    icon: string,
    placeholder: string,
    value: string,
    field: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    secureTextEntry?: boolean,
    errorField?: string,
    onChangeText?: (text: string) => void,
    label?: string
  ) => {
    const isFocused = focusedField === field;
    const hasError = errorField ? errors[errorField as keyof typeof errors] : errors[field as keyof typeof errors];
    const isTyping = value.length > 0;
    
    // Determine border color based on state
    let borderColor = colors.border;
    if (hasError) {
      borderColor = colors.destructive;
    } else if (isFocused || isTyping) {
      borderColor = colors.primary;
    }
    
    return (
      <View style={styles.inputContainer}>
        {label && (
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {label}
          </Text>
        )}
        <View style={styles.inputWrapper}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={isFocused || isTyping ? colors.primary : colors.mutedForeground} 
            style={styles.inputIcon} 
          />
          <TextInput
            style={[styles.input, { 
              color: colors.text,
              backgroundColor: colors.card,
              borderColor: borderColor,
              borderWidth: isFocused || isTyping || hasError ? 2 : 1,
            }]}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            keyboardType={keyboardType}
            autoCapitalize="none"
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={onChangeText || ((text) => handleInputChange(field, text))}
            onFocus={() => {
              setFocusedField(field);
              scrollToFocusedInput(field);
            }}
            onBlur={() => setFocusedField(null)}
          />
          {(field === 'password' || field === 'password_confirmation') && (
            <TouchableOpacity
              onPress={field === 'password' ? togglePasswordVisibility : toggleConfirmPasswordVisibility}
              style={styles.passwordToggle}
            >
              <Ionicons 
                name={field === 'password' 
                  ? (showPassword ? 'eye-off' : 'eye') 
                  : (showConfirmPassword ? 'eye-off' : 'eye')
                } 
                size={20} 
                color={isFocused || isTyping ? colors.primary : colors.mutedForeground} 
              />
            </TouchableOpacity>
          )}
        </View>
        {hasError && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            {hasError}
          </Text>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.muted]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card + 'E6' }]}>
        <TouchableOpacity 
          onPress={showForgotPassword ? handleBackToLogin : onBack} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentInsetAdjustmentBehavior="automatic"
            automaticallyAdjustContentInsets={Platform.OS === 'android'}
            keyboardShouldPersistTaps="handled"
          >
        <View style={styles.authContainer}>
          {showForgotPassword ? (
            // Forgot Password Screen
            <>
              {/* Logo */}
              {renderLogo()}

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Forgot Password? 
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Enter your email address and we'll send you a link to reset your password
                </Text>
              </View>

              {/* Forgot Password Form */}
              <View style={styles.form}>
                {renderInput(
                  'mail', 
                  'Enter your email address', 
                  forgotPasswordData.email, 
                  'forgotEmail', 
                  'email-address',
                  false,
                  'email',
                  (text) => {
                    setForgotPasswordData(prev => ({ ...prev, email: text }));
                    if (forgotPasswordErrors.email) {
                      setForgotPasswordErrors(prev => ({ ...prev, email: '' }));
                    }
                  }
                )}

                <TouchableOpacity
                  onPress={handleForgotPasswordSubmit}
                  disabled={isLoading}
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled
                  ]}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryHover || '#008000']}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]} />
                    ) : (
                      <Text style={[styles.submitButtonText, { color: 'white' }]}>
                        Send Reset Link
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Back to Login */}
              <View style={styles.toggleContainer}>
                <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
                  Remember your password?{' '}
                </Text>
                <TouchableOpacity onPress={handleBackToLogin} style={styles.toggleButtonContainer}>
                  <Text style={[styles.toggleButton, { color: colors.primary }]}>
                    Back to Login
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={16} 
                    color={colors.primary} 
                    style={styles.toggleIcon}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Login/Signup Screen
            <>
              {/* Logo */}
              {renderLogo()}

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isLogin ? 'Welcome Back' : 'Create Your Account'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {isLogin 
                    ? 'Sign in to continue managing your payments and recharges' 
                    : 'Join thousands of users who trust SureTopUp for their financial needs'
                  }
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                            {!isLogin && (
              <>
                {renderInput('person', 'Enter your first name', formData.firstname, 'firstname', 'default', undefined, undefined, undefined, 'First Name')}
                {renderInput('person', 'Enter your last name', formData.lastname, 'lastname', 'default', undefined, undefined, undefined, 'Last Name')}
              </>
            )}

                {renderInput('mail', 'Enter your email', formData.email, 'email', 'email-address', undefined, undefined, undefined, 'Email')}

                {!isLogin && (
                  <>
                    <CustomPhoneInput
                      value={formData.phone}
                      onChangeText={(text) => handleInputChange('phone', text)}
                      onChangeFormattedText={(formattedText) => {
                        setFormData(prev => ({ ...prev, phoneFormatted: formattedText }));
                      }}
                      error={errors.phone}
                      placeholder="Enter phone number"
                      label="Phone Number"
                    />
                    {renderInput('key', 'Enter your TPIN (4 digits)', formData.tpin, 'tpin', 'phone-pad', undefined, undefined, undefined, 'Transation PIN')}
                    <Dropdown
                      value={formData.state}
                      onValueChange={(value) => handleInputChange('state', value)}
                      placeholder="Select your state"
                      label="State"
                      error={errors.state}
                      data={NIGERIAN_STATES}
                    />
                  </>
                )}

                {renderInput('lock-closed', 'Enter your password', formData.password, 'password', 'default', !showPassword, undefined, undefined, 'Password')}

                {!isLogin && (
                  renderInput('lock-closed', 'Confirm your password', formData.password_confirmation, 'password_confirmation', 'default', !showConfirmPassword, undefined, undefined, 'Confirm Password')
                )}

                {isLogin && (
                  <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
                    <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled
                  ]}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryHover || '#008000']}
                    style={styles.submitButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]} />
                    ) : (
                      <Text style={[styles.submitButtonText, { color: 'white' }]}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Toggle Auth Mode */}
              <View style={styles.toggleContainer}>
                <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleButtonContainer}>
                  <Text style={[styles.toggleButton, { color: colors.primary }]}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={16} 
                    color={colors.primary} 
                    style={styles.toggleIcon}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onPrimaryPress={modalConfig.onPrimaryPress}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  authContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 60 : 32,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 1,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 48,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 18,
    zIndex: 1,
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    height: 64,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#00A900',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: Platform.OS === 'android' ? 8 : 0,
    marginBottom: Platform.OS === 'android' ? 20 : 0,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleIcon: {
    marginLeft: 2,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});
