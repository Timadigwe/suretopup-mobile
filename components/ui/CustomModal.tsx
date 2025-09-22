import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface CustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  showIcon?: boolean;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  singleButton?: boolean;
  customContent?: React.ReactNode;
  primaryButtonDisabled?: boolean;
  primaryButtonLoading?: boolean;
  primaryButtonColor?: string;
}

export const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  showIcon = true,
  primaryButtonText = 'OK',
  secondaryButtonText = 'Cancel',
  onPrimaryPress,
  onSecondaryPress,
  singleButton = true,
  customContent,
  primaryButtonDisabled = false,
  primaryButtonLoading = false,
  primaryButtonColor,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      triggerHapticFeedback('light');
      
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim, triggerHapticFeedback]);

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          gradientColors: [colors.primary, colors.primaryHover || '#008000'],
          iconColor: '#ffffff',
          backgroundColor: colors.card,
        };
      case 'error':
        return {
          icon: 'close-circle',
          gradientColors: ['#FF6B6B', '#FF5252'],
          iconColor: '#ffffff',
          backgroundColor: colors.card,
        };
      case 'warning':
        return {
          icon: 'warning',
          gradientColors: ['#FFA726', '#FF9800'],
          iconColor: '#ffffff',
          backgroundColor: colors.card,
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          gradientColors: [colors.primary, colors.primaryHover || '#008000'],
          iconColor: '#ffffff',
          backgroundColor: colors.card,
        };
    }
  };

  const typeConfig = getTypeConfig();

  const handlePrimaryPress = () => {
    if (primaryButtonDisabled || primaryButtonLoading) return;
    
    triggerHapticFeedback('light');
    if (onPrimaryPress) {
      onPrimaryPress();
    } else {
      onClose();
    }
  };

  const handleSecondaryPress = () => {
    triggerHapticFeedback('light');
    if (onSecondaryPress) {
      onSecondaryPress();
    } else {
      onClose();
    }
  };

  const handleBackdropPress = () => {
    triggerHapticFeedback('light');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View 
        style={[
          styles.backdrop,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}} // Prevent closing when touching modal content
            >
              <LinearGradient
                colors={[colors.background, colors.muted]}
                style={[
                  styles.modalContent,
                  { backgroundColor: typeConfig.backgroundColor },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Icon */}
                {showIcon && (
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={typeConfig.gradientColors as any}
                      style={styles.iconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons
                        name={typeConfig.icon as any}
                        size={32}
                        color={typeConfig.iconColor}
                      />
                    </LinearGradient>
                  </View>
                )}

                {/* Title */}
                <Text style={[styles.title, { color: colors.text }]}>
                  {title}
                </Text>

                {/* Message or Custom Content */}
                {customContent ? (
                  customContent
                ) : (
                  <Text style={[styles.message, { color: colors.mutedForeground }]}>
                    {message}
                  </Text>
                )}

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                  {!singleButton && (
                    <TouchableOpacity
                      onPress={handleSecondaryPress}
                      style={[
                        styles.button,
                        styles.secondaryButton,
                        { borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                        {secondaryButtonText}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    onPress={handlePrimaryPress}
                    style={[
                      styles.button, 
                      styles.primaryButton,
                      (primaryButtonDisabled || primaryButtonLoading) && styles.disabledButton
                    ]}
                    disabled={primaryButtonDisabled || primaryButtonLoading}
                  >
                    <LinearGradient
                      colors={primaryButtonColor ? [primaryButtonColor, primaryButtonColor] : typeConfig.gradientColors as any}
                      style={styles.primaryButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {primaryButtonLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="white" />
                          <Text style={[styles.primaryButtonText, { color: 'white', marginLeft: 8 }]}>
                            Loading...
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.primaryButtonText, { color: 'white' }]}>
                          {primaryButtonText}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    width: width * 0.85,
    maxWidth: 400,
    marginHorizontal: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  secondaryButton: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    shadowColor: '#00A900',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
