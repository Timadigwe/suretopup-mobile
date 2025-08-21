import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ServicePlaceholderProps {
  serviceName: string;
  onBack: () => void;
}

export const ServicePlaceholder: React.FC<ServicePlaceholderProps> = ({ 
  serviceName, 
  onBack 
}) => {
  const { colors } = useTheme();

  const getServiceMessage = (name: string) => {
    switch (name.toLowerCase()) {
      case 'electricity':
        return 'Coming soon! Electricity bill payments will be available shortly.';
      default:
        return `${name.charAt(0).toUpperCase() + name.slice(1)} service page is under development.`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="construct" size={60} color={colors.primary} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>
          {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service
        </Text>
        
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          {getServiceMessage(serviceName)}
        </Text>
        
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.backButtonText, { color: colors.cardForeground }]}>
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
