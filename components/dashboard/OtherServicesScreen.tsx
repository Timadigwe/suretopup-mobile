import { apiService } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useMobileFeatures } from '../../hooks/useMobileFeatures';

interface OtherServicesScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

const OtherServicesScreen: React.FC<OtherServicesScreenProps> = ({ onNavigate }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const [serviceAvailability, setServiceAvailability] = useState<Record<string, boolean>>({});

  const services = [
    {
      id: 'cable',
      name: 'Cable TV',
      description: 'Pay for DSTV, GOTV, Startimes and more',
      icon: 'tv',
      color: '#8B5CF6',
      isComingSoon: false,
    },
    {
      id: 'nin',
      name: 'NIN Services',
      description: 'National Identity Number services',
      icon: 'card',
      color: '#059669',
      isComingSoon: false,
    },
    {
      id: 'cac',
      name: 'CAC Services',
      description: 'Corporate Affairs Commission services',
      icon: 'business',
      color: '#DC2626',
      isComingSoon: false,
    },
  ];

  useEffect(() => {
    const fetchServiceAvailability = async () => {
      try {
        const response = await apiService.getServiceAvailability();
        const isSuccess = response.success || response.status === 'success';
        if (isSuccess && response.data) {
          const availabilityMap: Record<string, boolean> = {};
          response.data.forEach(item => {
            availabilityMap[item.service_name] = item.is_available;
          });
          setServiceAvailability(availabilityMap);
        }
      } catch (error) {
        // Ignore service availability errors here.
      }
    };

    fetchServiceAvailability();
  }, []);

  const isServiceDisabled = (serviceId: string) => {
    return serviceAvailability[serviceId] === false;
  };

  const handleServicePress = (service: any) => {
    triggerHapticFeedback('light');
    if (!service.isDisabled) {
      onNavigate(service.id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          onPress={() => onNavigate('home')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Other Services</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
              <View style={styles.heroIconContainer}>
                <Ionicons name="apps" size={32} color="white" />
              </View>
              <Text style={styles.heroTitle}>Other Services</Text>
              <Text style={styles.heroSubtitle}>
                Access additional services and utilities
              </Text>
            </View>
          </View>

          {/* Services Grid */}
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                 key={service.id}
                 style={[
                   styles.serviceCard,
                   { 
                     backgroundColor: colors.card,
                     borderColor: colors.border,
                     opacity: isServiceDisabled(service.id) ? 0.5 : 1,
                   }
                 ]}
                 onPress={() => handleServicePress({ ...service, isDisabled: isServiceDisabled(service.id) })}
                 activeOpacity={0.7}
                 disabled={isServiceDisabled(service.id)}
               >
                 {isServiceDisabled(service.id) && (
                   <View style={[styles.comingSoonBadge, { backgroundColor: colors.mutedForeground }]}>
                     <Text style={[styles.comingSoonText, { color: colors.card }]}>Not Active</Text>
                   </View>
                 )}
                 <View style={[
                   styles.iconContainer,
                   { backgroundColor: `${service.color}20` }
                 ]}>
                   <Ionicons name={service.icon as any} size={28} color={service.color} />
                 </View>
                 
                 <Text style={[styles.serviceName, { color: colors.text }]}>
                   {service.name}
                 </Text>
                 
                 <Text style={[styles.serviceDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                   {service.description}
                 </Text>
               </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    minHeight: 140,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default OtherServicesScreen;
