import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { config } from '../../config';

interface HelpSupportScreenProps {
  onNavigate: (page: string, data?: any) => void;
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({
  onNavigate,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();

  const handleGoBack = () => {
    triggerHapticFeedback('light');
    onNavigate('profile');
  };

  const handleContactSupport = () => {
    triggerHapticFeedback('light');
    // You can replace this with actual support contact method
    Linking.openURL('mailto:support@suretopup.com.ng');
  };

  const handleWhatsAppSupport = () => {
    triggerHapticFeedback('light');
    // You can replace this with actual WhatsApp number
    Linking.openURL('https://wa.me/${config.whatsappNumber}');
  };



  const contactMethods = [
    {
      title: 'WhatsApp Support',
      subtitle: 'Chat with us on WhatsApp',
      icon: 'logo-whatsapp',
      action: handleWhatsAppSupport,
      color: '#25D366',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card + 'F5' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Help & Support
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="help-circle" size={32} color="white" />
          </View>
          <Text style={styles.heroTitle}>Need Help?</Text>
          <Text style={styles.heroSubtitle}>
            Our support team is here to assist you
          </Text>
        </View>

        {/* Contact Support */}
        <View style={[styles.contactCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>
            Still need help?
          </Text>
          <Text style={[styles.contactSubtitle, { color: colors.mutedForeground }]}>
            Our support team is here to help you
          </Text>
          
          <View style={styles.contactMethods}>
            {contactMethods.map((method, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.contactMethod, { borderColor: colors.border }]}
                onPress={method.action}
                activeOpacity={0.7}
              >
                <View style={[styles.contactIcon, { backgroundColor: method.color + '20' }]}>
                  <Ionicons name={method.icon as any} size={24} color={method.color} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactMethodTitle, { color: colors.text }]}>
                    {method.title}
                  </Text>
                  <Text style={[styles.contactMethodSubtitle, { color: colors.mutedForeground }]}>
                    {method.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
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
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  heroCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 20,
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
  sectionCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionItems: {
    gap: 8,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sectionItemText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  contactCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  contactMethods: {
    gap: 12,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactMethodSubtitle: {
    fontSize: 14,
  },
  faqCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  faqSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  faqButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  faqButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});

export default HelpSupportScreen;
