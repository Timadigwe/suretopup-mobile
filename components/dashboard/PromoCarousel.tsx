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

interface PromoSlide {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  colors: [string, string];
  navigateTo: string;
}

const promoSlides: PromoSlide[] = [
  {
    id: 1,
    title: "Get 5% Bonus",
    subtitle: "On your first recharge above ₦1,000",
    buttonText: "Recharge Now",
    colors: ['#00A900', '#008800'],
    navigateTo: 'airtime'
  },
  {
    id: 2,
    title: "Data Deals",
    subtitle: "Buy 2GB and get 1GB free for new users",
    buttonText: "Buy Data",
    colors: ['#3B82F6', '#2563EB'],
    navigateTo: 'data'
  },
  {
    id: 3,
    title: "Weekend Special",
    subtitle: "50% off on all betting fund transfers",
    buttonText: "Fund Now",
    colors: ['#FFD700', '#F59E0B'],
    navigateTo: 'betting-funding'
  }
];

interface PromoCarouselProps {
  onNavigate: (screen: string) => void;
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({ onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { colors } = useTheme();

  // Auto slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const newIndex = (currentSlide + 1) % promoSlides.length;
      setCurrentSlide(newIndex);
      scrollToSlide(newIndex);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promoSlides.length) % promoSlides.length);
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
      <Text style={[styles.title, { color: colors.text }]}>Special Offers</Text>
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
          {promoSlides.map((slide) => (
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
                  
                  {/* Decorative element */}
                  <View style={styles.decorativeElement}>
                    <View style={styles.decorativeInner} />
                  </View>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* Navigation Buttons */}
        <TouchableOpacity
          onPress={() => {
            const newIndex = (currentSlide - 1 + promoSlides.length) % promoSlides.length;
            setCurrentSlide(newIndex);
            scrollToSlide(newIndex);
          }}
          style={styles.navButton}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            const newIndex = (currentSlide + 1) % promoSlides.length;
            setCurrentSlide(newIndex);
            scrollToSlide(newIndex);
          }}
          style={[styles.navButton, styles.navButtonRight]}
        >
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {promoSlides.map((_, index) => (
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
  decorativeElement: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  decorativeInner: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
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
