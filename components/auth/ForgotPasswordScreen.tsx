import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { CustomModal } from '@/components/ui/CustomModal';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

type ForgotPasswordStep = 'email' | 'otp' | 'password';

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBack,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
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
  const { forgotPassword, verifyForgotPasswordOtp, resetPassword } = useAuth();
  
  // Animation for loading spinner
  const spinValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
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

  // Countdown timer for resend button
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onPrimaryPress?: () => void) => {
    setModalConfig({
      title,
      message,
      type,
      onPrimaryPress: onPrimaryPress || (() => setModalVisible(false)),
    });
    setModalVisible(true);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      showModal('Email Required', 'Please enter your email address.', 'warning');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showModal('Invalid Email', 'Please enter a valid email address.', 'error');
      return;
    }

    setIsLoading(true);
    triggerNotificationHaptic();

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        triggerHapticFeedback('light');
        setCurrentStep('otp');
        setResendCountdown(60); // 60 seconds countdown
        showModal('OTP Sent', 'A verification code has been sent to your email.', 'success');
      } else {
        triggerHapticFeedback('heavy');
        showModal('Failed', result.message, 'error');
      }
    } catch (error) {
      triggerHapticFeedback('heavy');
      showModal('Error', 'An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showModal('OTP Required', 'Please enter the verification code.', 'warning');
      return;
    }

    if (otp.length !== 5) {
      showModal('Invalid OTP', 'Please enter the 5-digit verification code.', 'error');
      return;
    }

    setIsLoading(true);
    triggerNotificationHaptic();

    try {
      const result = await verifyForgotPasswordOtp(email, otp);
      
      if (result.success) {
        triggerHapticFeedback('light');
        setCurrentStep('password');
        showModal('OTP Verified', 'Please enter your new password.', 'success');
      } else {
        triggerHapticFeedback('heavy');
        showModal('Verification Failed', result.message, 'error');
      }
    } catch (error) {
      triggerHapticFeedback('heavy');
      showModal('Error', 'An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      showModal('Password Required', 'Please enter your new password.', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showModal('Invalid Password', 'Password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showModal('Passwords Don\'t Match', 'Please make sure both passwords are the same.', 'error');
      return;
    }

    setIsLoading(true);
    triggerNotificationHaptic();

    try {
      const result = await resetPassword(email, otp, newPassword, confirmPassword);
      
      if (result.success) {
        triggerHapticFeedback('light');
        showModal(
          'Password Reset Successfully',
          'Your password has been reset successfully. You can now login with your new password.',
          'success',
          () => {
            setModalVisible(false);
            onComplete();
          }
        );
      } else {
        triggerHapticFeedback('heavy');
        showModal('Reset Failed', result.message, 'error');
      }
    } catch (error) {
      triggerHapticFeedback('heavy');
      showModal('Error', 'An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    setIsResending(true);
    triggerHapticFeedback('light');

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        triggerHapticFeedback('light');
        setResendCountdown(60); // 60 seconds countdown
        showModal('OTP Sent', 'A new verification code has been sent to your email.', 'success');
      } else {
        triggerHapticFeedback('heavy');
        showModal('Resend Failed', result.message, 'error');
      }
    } catch (error) {
      triggerHapticFeedback('heavy');
      showModal('Error', 'Failed to resend verification code. Please try again.', 'error');
    } finally {
      setIsResending(false);
    }
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
    keyboardType: 'default' | 'email-address' | 'number-pad' = 'default',
    secureTextEntry?: boolean,
    onChangeText?: (text: string) => void,
    label?: string
  ) => {
    const isFocused = focusedField === field;
    const isTyping = value.length > 0;
    
    let borderColor = colors.border;
    if (isFocused || isTyping) {
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
              borderWidth: isFocused || isTyping ? 2 : 1,
            }]}
            placeholder={placeholder}
            placeholderTextColor={colors.mutedForeground}
            keyboardType={keyboardType}
            autoCapitalize="none"
            secureTextEntry={secureTextEntry}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocusedField(field)}
            onBlur={() => setFocusedField(null)}
          />
          {(field === 'newPassword' || field === 'confirmPassword') && (
            <TouchableOpacity
              onPress={field === 'newPassword' ? 
                () => setShowPassword(!showPassword) : 
                () => setShowConfirmPassword(!showConfirmPassword)
              }
              style={styles.passwordToggle}
            >
              <Ionicons 
                name={field === 'newPassword' 
                  ? (showPassword ? 'eye-off' : 'eye') 
                  : (showConfirmPassword ? 'eye-off' : 'eye')
                } 
                size={20} 
                color={isFocused || isTyping ? colors.primary : colors.mutedForeground} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[
        styles.stepDot, 
        { backgroundColor: currentStep === 'email' ? colors.primary : colors.border }
      ]} />
      <View style={[
        styles.stepLine, 
        { backgroundColor: currentStep === 'otp' || currentStep === 'password' ? colors.primary : colors.border }
      ]} />
      <View style={[
        styles.stepDot, 
        { backgroundColor: currentStep === 'otp' || currentStep === 'password' ? colors.primary : colors.border }
      ]} />
      <View style={[
        styles.stepLine, 
        { backgroundColor: currentStep === 'password' ? colors.primary : colors.border }
      ]} />
      <View style={[
        styles.stepDot, 
        { backgroundColor: currentStep === 'password' ? colors.primary : colors.border }
      ]} />
    </View>
  );

  const renderEmailStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Forgot Password?
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your email address and we'll send you a verification code to reset your password
        </Text>
      </View>

      <View style={styles.form}>
        {renderInput(
          'mail', 
          'Enter your email address', 
          email, 
          'email', 
          'email-address',
          false,
          setEmail,
          'Email Address'
        )}

        <TouchableOpacity
          onPress={handleSendOtp}
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
                Send Verification Code
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderOtpStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Verify Your Email 📧
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          We've sent a 5-digit verification code to
        </Text>
        <Text style={[styles.emailText, { color: colors.primary }]}>
          {email}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Please enter the code to continue
        </Text>
      </View>

      <View style={styles.form}>
        {renderInput(
          'key', 
          'Enter 5-digit code', 
          otp, 
          'otp', 
          'number-pad',
          false,
          setOtp,
          'Verification Code'
        )}

        <TouchableOpacity
          onPress={handleVerifyOtp}
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
                Verify Code
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
            Didn't receive the code?
          </Text>
          <TouchableOpacity
            onPress={handleResendOtp}
            disabled={resendCountdown > 0 || isResending}
            style={styles.resendButton}
          >
            <Text style={[
              styles.resendButtonText, 
              { 
                color: resendCountdown > 0 ? colors.mutedForeground : colors.primary 
              }
            ]}>
              {resendCountdown > 0 
                ? `Resend in ${resendCountdown}s` 
                : isResending 
                  ? 'Sending...' 
                  : 'Resend Code'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Reset Your Password 🔒
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Enter your new password below
        </Text>
      </View>

      <View style={styles.form}>
        {renderInput(
          'lock-closed', 
          'Enter new password', 
          newPassword, 
          'newPassword', 
          'default',
          !showPassword,
          setNewPassword,
          'New Password'
        )}

        {renderInput(
          'lock-closed', 
          'Confirm new password', 
          confirmPassword, 
          'confirmPassword', 
          'default',
          !showConfirmPassword,
          setConfirmPassword,
          'Confirm Password'
        )}

        <TouchableOpacity
          onPress={handleResetPassword}
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
                Reset Password
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <LinearGradient
      colors={[colors.background, colors.muted]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card + 'E6' }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderLogo()}
          {renderStepIndicator()}

          {currentStep === 'email' && renderEmailStep()}
          {currentStep === 'otp' && renderOtpStep()}
          {currentStep === 'password' && renderPasswordStep()}
        </ScrollView>
      </TouchableWithoutFeedback>

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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
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
    marginBottom: 24,
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
    fontWeight: 'bold',
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    padding: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
