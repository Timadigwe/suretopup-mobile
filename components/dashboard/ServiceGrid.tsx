import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Service {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isComingSoon?: boolean;
}

interface ServiceGridProps {
  onServiceClick: (serviceId: string) => void;
  serviceAvailability?: Record<string, boolean>;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ onServiceClick, serviceAvailability }) => {
  const { colors } = useTheme();
  const serviceNameMap: Record<string, string> = {
    "betting-funding": "betting",
    "printing": "card-print",
  };

  const services: Service[] = [
    {
      id: "airtime",
      name: "Airtime\nRecharge",
      icon: "phone-portrait",
      color: colors.primary,
    },
    {
      id: "data",
      name: "Data\nPurchase",
      icon: "wifi",
      color: "#3B82F6",
    },
    {
      id: "electricity",
      name: "Electricity\nBills",
      icon: "flash",
      color: "#F59E0B",
    },
    {
      id: "betting-funding",
      name: "Betting\nFunding",
      icon: "trophy",
      color: "#F59E0B",
    },
    {
      id: "printing",
      name: "Card\nPrinting",
      icon: "print",
      color: "#F97316",
    },
    {
      id: "cable",
      name: "Cable TV",
      icon: "tv",
      color: "#8B5CF6",
    },
    {
      id: "nin",
      name: "NIN\nServices",
      icon: "card",
      color: "#059669",
    },
    {
      id: "cac",
      name: "CAC\nServices",
      icon: "business",
      color: "#DC2626",
    }
  ];

  const isServiceDisabled = (serviceId: string) => {
    const serviceKey = serviceNameMap[serviceId] ?? serviceId;
    if (!serviceAvailability) {
      return false;
    }
    return serviceAvailability[serviceKey] === false;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Quick Services</Text>
      
      <View style={styles.grid}>
        {services.map((service) => {
          const disabled = isServiceDisabled(service.id);
          return (
            <TouchableOpacity
              key={service.id}
              onPress={() => {
                if (!disabled) {
                  onServiceClick(service.id);
                }
              }}
              style={[
                styles.serviceCard,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: disabled ? 0.5 : 1,
                },
              ]}
              activeOpacity={0.7}
              disabled={disabled}
            >
              {service.isComingSoon && (
                <View style={[styles.comingSoonBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.comingSoonText, { color: colors.cardForeground }]}>
                    Soon
                  </Text>
                </View>
              )}
              {disabled && (
                <View style={[styles.comingSoonBadge, { backgroundColor: colors.mutedForeground }]}>
                  <Text style={[styles.comingSoonText, { color: colors.card }]}>
                    Not Active
                  </Text>
                </View>
              )}
              
              <View style={[
                styles.iconContainer,
                { backgroundColor: `${service.color}20` }
              ]}>
                <Ionicons name={service.icon} size={18} color={service.color} />
              </View>
              
              <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={2}>
                {service.name}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '22%',
    minHeight: 85,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
    flexWrap: 'wrap',
    flexShrink: 1,
    paddingHorizontal: 2,
    marginTop: 2,
  },
});
