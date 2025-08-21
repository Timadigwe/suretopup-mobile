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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { CustomModal } from '@/components/ui/CustomModal';

interface EmailVerificationScreenProps {
  onVerificationComplete: () => void;
  onBack: () => void;
  userEmail: string;
  registrationData?: any;
}

const { width } = Dimensions.get('window');

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  onVerificationComplete,
  onBack,
  userEmail,
  registrationData,
}) => {
  const [verificationCode, setVerificationCode] = useState('');
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
  const { verifyEmail, resendVerificationCode, storeAuthDataAfterVerification, user } = useAuth();
  
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

  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      showModal('Verification Required', 'Please enter the verification code sent to your email.', 'warning');
      return;
    }

    if (verificationCode.length !== 5) {
      showModal('Invalid Code', 'Please enter the 5-digit verification code.', 'error');
      return;
    }

    if (!registrationData?.token) {
      showModal('Error', 'Authentication token is missing. Please try registering again.', 'error');
      return;
    }



    setIsLoading(true);
    triggerNotificationHaptic();

    try {
      const result = await verifyEmail(verificationCode, registrationData?.token || '');
      
      if (result.success) {
        triggerHapticFeedback('light');
        
        // Store auth data after successful verification
        if (registrationData) {
          await storeAuthDataAfterVerification(registrationData);
        }
        
        showModal(
          'Email Verified!',
          'Your email has been successfully verified. You can now access all features.',
          'success',
          () => {
            setModalVisible(false);
            onVerificationComplete();
          }
        );
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

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;

    setIsResending(true);
    triggerHapticFeedback('light');

    try {
      const result = await resendVerificationCode(userEmail);
      
      if (result.success) {
        triggerHapticFeedback('light');
        setResendCountdown(60); // 60 seconds countdown
        showModal('Code Sent', result.message || 'A new verification code has been sent to your email.', 'success');
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
      <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
    </View>
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
        <View style={styles.content}>
          {renderLogo()}

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Verify Your Email
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              We've sent a 5-digit verification code to
            </Text>
            <Text style={[styles.emailText, { color: colors.primary }]}>
              {userEmail}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Please enter the code to verify your email address
            </Text>
          </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Verification Code
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="key" 
                size={20} 
                color={focusedField === 'code' ? colors.primary : colors.mutedForeground} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={[styles.input, { 
                  color: colors.text,
                  backgroundColor: colors.card,
                  borderColor: focusedField === 'code' ? colors.primary : colors.border,
                  borderWidth: focusedField === 'code' ? 2 : 1,
                }]}
                placeholder="Enter 5-digit code"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={5}
                value={verificationCode}
                onChangeText={setVerificationCode}
                onFocus={() => setFocusedField('code')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleVerification}
            disabled={isLoading}
            style={[
              styles.verifyButton,
              isLoading && styles.verifyButtonDisabled
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryHover || '#008000']}
              style={styles.verifyButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <Animated.View style={[styles.loadingSpinner, { transform: [{ rotate: spin }] }]} />
              ) : (
                <Text style={[styles.verifyButtonText, { color: 'white' }]}>
                  Verify Email
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResendCode}
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
        </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
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
    marginBottom: 32,
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
  verifyButton: {
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
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
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
