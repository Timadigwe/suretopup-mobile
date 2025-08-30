import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface Service {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  isComingSoon?: boolean;
}

interface ServiceGridProps {
  onServiceClick: (serviceId: string) => void;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ onServiceClick }) => {
  const { colors } = useTheme();

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
      isComingSoon: true,
    },
    {
      id: "betting-funding",
      name: "Betting\nFunding",
      icon: "trophy",
      color: "#F59E0B",
    },
    {
      id: "bills",
      name: "Bill\nPayments",
      icon: "card",
      color: "#8B5CF6",
    },
    {
      id: "printing",
      name: "Card\nPrinting",
      icon: "print",
      color: "#F97316",
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Quick Services</Text>
      
      <View style={styles.grid}>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            onPress={() => onServiceClick(service.id)}
            style={[
              styles.serviceCard,
              { 
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}
            activeOpacity={0.7}
          >
            {service.isComingSoon && (
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.comingSoonText, { color: colors.cardForeground }]}>
                  Soon
                </Text>
              </View>
            )}
            
            <View style={[
              styles.iconContainer,
              { backgroundColor: `${service.color}20` }
            ]}>
              <Ionicons name={service.icon} size={22} color={service.color} />
            </View>
            
            <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={2}>
              {service.name}
            </Text>
          </TouchableOpacity>
        ))}
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
    width: '30%',
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
    paddingVertical: 16,
    paddingHorizontal: 4,
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
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    flexWrap: 'wrap',
    flexShrink: 1,
    paddingHorizontal: 2,
    marginTop: 4,
  },
});
