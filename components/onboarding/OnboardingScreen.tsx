import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: "Fast Mobile Recharge",
    subtitle: "Instant airtime and data purchase for all networks. Quick and reliable service anytime.",
    icon: 'phone-portrait'
  },
  {
    id: 2,
    title: "Secure Payments",
    subtitle: "Your transactions are protected with bank-level security. Pay with confidence.",
    icon: 'shield-checkmark'
  },
  {
    id: 3,
    title: "All-in-One Wallet",
    subtitle: "Manage all your bills, recharge, and payments in one convenient platform.",
    icon: 'wallet'
  }
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();

  const nextSlide = () => {
    triggerHapticFeedback('light');
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    triggerHapticFeedback('light');
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[`${colors.primary}10`, colors.background, `${colors.accent}10`]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.slideCounter, { color: colors.mutedForeground }]}>
            {currentSlide + 1} / {slides.length}
          </Text>
          <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          pagingEnabled
          horizontal
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentSlide(newIndex);
          }}
        >
          {slides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name={slide.icon} size={80} color={colors.primary} />
              </View>

              {/* Title and subtitle */}
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {slide.title}
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {slide.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentSlide ? colors.primary : colors.muted,
                  width: index === currentSlide ? 32 : 8,
                }
              ]}
            />
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={styles.navigation}>
          <TouchableOpacity
            onPress={prevSlide}
            disabled={currentSlide === 0}
            style={[styles.navButton, currentSlide === 0 && styles.hidden]}
          >
            <Ionicons 
              name="chevron-back" 
              size={Platform.OS === 'android' ? 15 : 20} 
              color={colors.primary} 
            />
            <Text style={[styles.navButtonText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nextSlide}
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.primaryButtonText, { color: 'white' }]}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
            {!isLastSlide && (
              <Ionicons 
                name="chevron-forward" 
                size={Platform.OS === 'android' ? 15 : 20} 
                color="white" 
              />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerSpacer: {
    width: 48,
  },
  slideCounter: {
    fontSize: 14,
    fontWeight: '500',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Platform.OS === 'android' ? 6 : 4,
  },
  hidden: {
    opacity: 0,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 128,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: Platform.OS === 'android' ? 6 : 4,
  },
});
