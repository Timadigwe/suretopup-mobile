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
import { configRegExp } from 'expo-router/build/fork/getStateFromPath-forks';
import { config } from '@/config';

interface AboutScreenProps {
  onNavigate: (page: string, data?: any) => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onNavigate,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();

  const handleGoBack = () => {
    triggerHapticFeedback('light');
    onNavigate('profile');
  };

  const handleWebsite = () => {
    triggerHapticFeedback('light');
    Linking.openURL('https://suretopup.com.ng');
  };



  const appInfo = {
    company: 'SureTopUp Nigeria Limited',
    website: 'suretopup.com.ng',
    phone: config.whatsappNumber,
    address: 'Lagos, Nigeria',
  };





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
            About
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


        {/* Company Information */}
        <View style={[styles.companyCard, { backgroundColor: colors.card }]}>
          <View style={styles.companyHeader}>
            <View style={[styles.companyIcon, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="business" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.companyTitle, { color: colors.text }]}>
              {appInfo.company}
            </Text>
          </View>
          
          <View style={styles.companyInfo}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="globe" size={18} color={colors.primary} />
              </View>
              <TouchableOpacity onPress={handleWebsite} style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Website</Text>
                <Text style={[styles.infoText, { color: colors.primary }]}>
                  {appInfo.website}
                </Text>
              </TouchableOpacity>
            </View>
            
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="call" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Phone</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {appInfo.phone}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Address</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {appInfo.address}
                </Text>
              </View>
            </View>
          </View>
        </View>





        {/* Copyright */}
        <View style={styles.copyrightContainer}>
          <Text style={[styles.copyrightText, { color: colors.mutedForeground }]}>
            © 2025 {appInfo.company}. All rights reserved.
          </Text>
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
  companyCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  companyHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  companyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  companyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  companyInfo: {
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 22,
  },
  copyrightContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  copyrightText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AboutScreen;
