import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface FeatureSlide {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  colors: [string, string];
  navigateTo: string;
  icon: string;
}

const featureSlides: FeatureSlide[] = [
  {
    id: 1,
    title: "Instant Airtime",
    subtitle: "Recharge any network instantly with secure transactions",
    buttonText: "Recharge Now",
    colors: ['#00A900', '#008800'],
    navigateTo: 'airtime',
    icon: 'phone-portrait'
  },
  {
    id: 2,
    title: "Data Plans",
    subtitle: "Get the best data deals for all networks with instant activation",
    buttonText: "Buy Data",
    colors: ['#3B82F6', '#2563EB'],
    navigateTo: 'data',
    icon: 'cellular'
  },
  {
    id: 3,
    title: "Betting Funding",
    subtitle: "Fund your betting accounts securely with multiple providers",
    buttonText: "Fund Now",
    colors: ['#F59E0B', '#D97706'],
    navigateTo: 'betting-funding',
    icon: 'trophy'
  },
  {
    id: 4,
    title: "Card Printing",
    subtitle: "Print ePIN cards for all networks with professional receipts",
    buttonText: "Print Cards",
    colors: ['#8B5CF6', '#7C3AED'],
    navigateTo: 'card-printing',
    icon: 'card'
  },
  {
    id: 5,
    title: "Bill Payments",
    subtitle: "Pay electricity, cable TV, and other bills with ease",
    buttonText: "Pay Bills",
    colors: ['#EF4444', '#DC2626'],
    navigateTo: 'bills',
    icon: 'receipt'
  }
];

interface PromoCarouselProps {
  onNavigate: (screen: string) => void;
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { colors } = useTheme();

  // Auto slide every 6 seconds (longer for feature showcase)
  useEffect(() => {
    const timer = setInterval(() => {
      const newIndex = (currentSlide + 1) % featureSlides.length;
      setCurrentSlide(newIndex);
      scrollToSlide(newIndex);
    }, 6000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featureSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featureSlides.length) % featureSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToSlide = (index: number) => {
    const slideWidth = width - 32; // Account for padding
    scrollViewRef.current?.scrollTo({
      x: index * slideWidth,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Features</Text>
      <View style={styles.carouselContainer}>
        {/* Carousel */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 32));
            setCurrentSlide(newIndex);
          }}
          contentContainerStyle={styles.scrollContent}
        >
          {featureSlides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              <LinearGradient
                colors={slide.colors}
                style={styles.slideGradient}
              >
                <View style={styles.slideContent}>
                  <View style={styles.slideText}>
                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                    <TouchableOpacity 
                      style={styles.slideButton}
                      onPress={() => onNavigate(slide.navigateTo)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.slideButtonText}>{slide.buttonText}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Feature Icon */}
                  <View style={styles.featureIcon}>
                    <Ionicons name={slide.icon as any} size={32} color="white" />
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* Navigation Buttons */}
        <TouchableOpacity
          onPress={() => {
            const newIndex = (currentSlide - 1 + featureSlides.length) % featureSlides.length;
            setCurrentSlide(newIndex);
            scrollToSlide(newIndex);
          }}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const newIndex = (currentSlide + 1) % featureSlides.length;
            setCurrentSlide(newIndex);
            scrollToSlide(newIndex);
          }}
          style={[styles.navButton, styles.navButtonRight]}
        >
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {featureSlides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setCurrentSlide(index);
                scrollToSlide(index);
              }}
              style={[
                styles.dot,
                {
                  backgroundColor: index === currentSlide ? colors.primary : colors.muted,
                  width: index === currentSlide ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  carouselContainer: {
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  slide: {
    width: width - 32,
    height: 160,
    marginRight: 0,
  },
  slideGradient: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
  },
  slideContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slideText: {
    flex: 1,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  slideSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  slideButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  slideButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  featureIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    left: 8,
    transform: [{ translateY: -20 }],
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  navButtonRight: {
    left: undefined,
    right: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
