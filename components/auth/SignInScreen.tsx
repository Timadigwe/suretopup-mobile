import React, { useState, useRef, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { CustomModal } from '@/components/ui/CustomModal';

interface SignInScreenProps {
  onLogin: () => void;
  onBack: () => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

const { width } = Dimensions.get('window');

export const SignInScreen: React.FC<SignInScreenProps> = ({ 
  onLogin, 
  onBack, 
  onSwitchToSignUp, 
  onForgotPassword 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  
  // Remember me functionality
  const [rememberMe, setRememberMe] = useState(false);
  
  const [errors, setErrors] = useState({
    email: '',
    username: '',
    password: '',
  });
  
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
  const { login, adminLogin, isLoading: authLoading } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation for loading spinner
  const spinValue = React.useRef(new Animated.Value(0)).current;
  
  // Load saved credentials on component mount
  useEffect(() => {
    console.log('SignInScreen mounted - loading saved credentials');
    const loadSavedCredentials = async () => {
      try {
        // Check all AsyncStorage keys for debugging
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('All AsyncStorage keys:', allKeys);
        
        const savedEmail = await AsyncStorage.getItem('remembered_email');
        const savedUsername = await AsyncStorage.getItem('remembered_username');
        const savedPassword = await AsyncStorage.getItem('remembered_password');
        const rememberMeStatus = await AsyncStorage.getItem('remember_me');
        
        console.log('Loading saved credentials:', {
          savedEmail: savedEmail ? 'Found' : 'Not found',
          savedUsername: savedUsername ? 'Found' : 'Not found',
          savedPassword: savedPassword ? 'Found' : 'Not found',
          rememberMeStatus
        });
        
        if ((savedEmail || savedUsername) && savedPassword && rememberMeStatus === 'true') {
          console.log('Auto-filling credentials');
          setFormData({
            email: savedEmail || '',
            username: savedUsername || '',
            password: savedPassword,
          });
          setRememberMe(true);
        } else {
          console.log('No saved credentials found or remember me not enabled');
          // In development mode, AsyncStorage might be cleared on reload
          // This is normal behavior and doesn't affect production
          if (__DEV__ && allKeys.length === 0) {
            console.log('Development mode: AsyncStorage cleared on reload (normal behavior)');
          }
        }
      } catch (error) {
        console.log('Error loading saved credentials:', error);
      }
    };
    
    loadSavedCredentials();
  }, []);

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
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
  const getUserFriendlyError = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('wrong password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    } else if (lowerMessage.includes('user not found') || lowerMessage.includes('email not found')) {
      return 'No account found with this email. Please check your email or sign up for a new account.';
    } else if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return 'Connection error. Please check your internet connection and try again.';
    } else if (lowerMessage.includes('validation')) {
      return 'Please check your email and password format.';
    }
    
    return message;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email') {
      // Handle combined email/username field
      const isEmail = value.includes('@');
      if (isEmail) {
        setFormData(prev => ({ ...prev, email: value, username: '' }));
      } else {
        setFormData(prev => ({ ...prev, username: value, email: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const scrollToFocusedInput = (field: string) => {
    if (field === 'password') {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 250);
    }
  };
  
  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'email':
        if (value.length > 0) {
          // Only validate email format if it contains @
          if (value.includes('@')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              error = 'Please enter a valid email address';
            }
          }
          // For usernames (no @), no validation needed
        }
        break;
      case 'password':
        if (value.length > 0 && value.length < 6) {
          error = 'Password must be at least 6 characters';
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
    // Get the input value (either email or username)
    const inputValue = formData.email || formData.username;
    const isEmailLogin = inputValue.includes('@');
    
    // Validate all fields
    const newErrors = {
      email: '',
      username: '',
      password: '',
    };
    
    if (!inputValue) {
      newErrors.email = 'Email or username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    // Additional validation for email (only when it's an email)
    if (isEmailLogin && inputValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
    
    // Handle login based on input type
    if (isEmailLogin) {
      // User login with email
      login(inputValue, formData.password).then(async (result) => {
        setIsLoading(false);
        if (result.success) {
          // Save credentials if remember me is checked
          if (rememberMe) {
            try {
              await AsyncStorage.setItem('remembered_email', inputValue);
              await AsyncStorage.setItem('remembered_password', formData.password);
              await AsyncStorage.setItem('remember_me', 'true');
            } catch (error) {
              console.log('Error saving credentials:', error);
            }
          } else {
            // Clear saved credentials if remember me is unchecked
            try {
              await AsyncStorage.removeItem('remembered_email');
              await AsyncStorage.removeItem('remembered_password');
              await AsyncStorage.removeItem('remember_me');
            } catch (error) {
              console.log('Error clearing credentials:', error);
            }
          }
          onLogin();
        } else {
          const errorMessage = getUserFriendlyError(result.message);
          showModal('Login Failed', errorMessage, 'error');
        }
      });
    } else {
      // Admin login with username
      adminLogin(inputValue, formData.password).then(async (result) => {
        setIsLoading(false);
        if (result.success) {
          // Save credentials if remember me is checked
          if (rememberMe) {
            try {
              await AsyncStorage.setItem('remembered_username', inputValue);
              await AsyncStorage.setItem('remembered_password', formData.password);
              await AsyncStorage.setItem('remember_me', 'true');
            } catch (error) {
              console.log('Error saving credentials:', error);
            }
          } else {
            // Clear saved credentials if remember me is unchecked
            try {
              await AsyncStorage.removeItem('remembered_username');
              await AsyncStorage.removeItem('remembered_password');
              await AsyncStorage.removeItem('remember_me');
            } catch (error) {
              console.log('Error clearing credentials:', error);
            }
          }
          onLogin();
        } else {
          const errorMessage = getUserFriendlyError(result.message);
          showModal('Login Failed', errorMessage, 'error');
        }
      });
    }
  };

  const togglePasswordVisibility = () => {
    triggerHapticFeedback('light');
    setShowPassword(!showPassword);
  };

  const toggleRememberMe = () => {
    triggerHapticFeedback('light');
    setRememberMe(!rememberMe);
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
    label?: string
  ) => {
    const isFocused = focusedField === field;
    const hasError = errors[field as keyof typeof errors];
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
            onChangeText={(text) => handleInputChange(field, text)}
            onFocus={() => {
              setFocusedField(field);
              scrollToFocusedInput(field);
            }}
            onBlur={() => {
              setFocusedField(null);
              validateField(field, value);
            }}
          />
          {field === 'password' && (
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.passwordToggle}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
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
          onPress={onBack} 
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
              {/* Logo */}
              {renderLogo()}

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Welcome Back
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  Sign in to continue managing your payments and recharges
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {renderInput('person', 'Enter your email or username', formData.email || formData.username, 'email', 'default', false, 'Email or Username')}
                {renderInput('lock-closed', 'Enter your password', formData.password, 'password', 'default', !showPassword, 'Password')}

                {/* Remember Me Checkbox */}
                <View style={styles.rememberMeContainer}>
                  <TouchableOpacity 
                    style={styles.rememberMeCheckbox} 
                    onPress={toggleRememberMe}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.checkbox,
                      { 
                        borderColor: rememberMe ? colors.primary : colors.border,
                        backgroundColor: rememberMe ? colors.primary : 'transparent'
                      }
                    ]}>
                      {rememberMe && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text style={[styles.rememberMeText, { color: colors.text }]}>
                      Remember me
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.forgotPassword} onPress={onForgotPassword}>
                    <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>

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
                        Sign In
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Toggle Auth Mode */}
              <View style={styles.toggleContainer}>
                <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={onSwitchToSignUp} style={styles.toggleButtonContainer}>
                  <Text style={[styles.toggleButton, { color: colors.primary }]}>
                    Sign Up
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={16} 
                    color={colors.primary} 
                    style={styles.toggleIcon}
                  />
                </TouchableOpacity>
              </View>
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
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rememberMeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPassword: {
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
    marginTop: Platform.OS === 'ios' ? 8 : 0,
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

export default SignInScreen;
