import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { configRegExp } from 'expo-router/build/fork/getStateFromPath-forks';
import { config } from '@/config';
import Constants from 'expo-constants';

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

  const handleTermsAndConditions = () => {
    triggerHapticFeedback('light');
    Alert.alert(
      'Terms and Conditions',
      'By using SureTopUp, you agree to our terms of service. For detailed terms, please visit our website at suretopup.com.ng/terms',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Visit Website', onPress: () => Linking.openURL('https://suretopup.com.ng/terms') }
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    triggerHapticFeedback('light');
    Alert.alert(
      'Privacy Policy',
      'We are committed to protecting your privacy. For our complete privacy policy, please visit our website at suretopup.com.ng/privacy',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Visit Website', onPress: () => Linking.openURL('https://suretopup.com.ng/privacy') }
      ]
    );
  };

  const handleSupport = () => {
    triggerHapticFeedback('light');
    Linking.openURL(`mailto:info@suretopup.com.ng?subject=Support Request&body=Hello, I need help with...`);
  };



  const appInfo = {
    company: 'SureTopUp Nigeria Limited',
    website: 'suretopup.com.ng',
    phone: config.whatsappNumber,
    address: 'Lagos, Nigeria',
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
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


        {/* App Information */}
        <View style={[styles.appCard, { backgroundColor: colors.card }]}>
          <View style={styles.appHeader}>
            <View style={styles.appIcon}>
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appTitle, { color: colors.text }]}>
              SureTopUp Mobile
            </Text>
            <Text style={[styles.appSubtitle, { color: colors.mutedForeground }]}>
              Version {appInfo.version} (Build {appInfo.buildNumber})
            </Text>
          </View>
          
          <View style={styles.appInfo}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Security</Text>
                <Text style={[styles.infoText, { color: colors.text }]}>
                  End-to-end encrypted
                </Text>
              </View>
            </View>
          </View>
        </View>


        {/* Legal Information */}
        <View style={[styles.legalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.legalTitle, { color: colors.text }]}>
            Legal Information
          </Text>
          
          <TouchableOpacity 
            style={styles.legalItem}
            onPress={handleTermsAndConditions}
            activeOpacity={0.7}
          >
            <View style={styles.legalItemContent}>
              <View style={[styles.legalIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
              </View>
              <View style={styles.legalTextContainer}>
                <Text style={[styles.legalItemTitle, { color: colors.text }]}>
                  Terms and Conditions
                </Text>
                <Text style={[styles.legalItemSubtitle, { color: colors.mutedForeground }]}>
                  Read our terms of service
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.legalItem}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.legalItemContent}>
              <View style={[styles.legalIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="shield" size={20} color={colors.primary} />
              </View>
              <View style={styles.legalTextContainer}>
                <Text style={[styles.legalItemTitle, { color: colors.text }]}>
                  Privacy Policy
                </Text>
                <Text style={[styles.legalItemSubtitle, { color: colors.mutedForeground }]}>
                  How we protect your data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Support Information */}
        <View style={[styles.supportCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.supportTitle, { color: colors.text }]}>
            Support & Contact
          </Text>
          
          <TouchableOpacity 
            style={styles.supportItem}
            onPress={handleSupport}
            activeOpacity={0.7}
          >
            <View style={styles.supportItemContent}>
              <View style={[styles.supportIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="mail" size={20} color={colors.primary} />
              </View>
              <View style={styles.supportTextContainer}>
                <Text style={[styles.supportItemTitle, { color: colors.text }]}>
                  Email Support
                </Text>
                <Text style={[styles.supportItemSubtitle, { color: colors.mutedForeground }]}>
                  info@suretopup.com.ng
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </View>
          </TouchableOpacity>
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
  appCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  appHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  appInfo: {
    gap: 16,
  },
  legalCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  legalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  legalItem: {
    marginBottom: 12,
  },
  legalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  legalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  legalTextContainer: {
    flex: 1,
  },
  legalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  legalItemSubtitle: {
    fontSize: 14,
  },
  supportCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  supportItem: {
    marginBottom: 12,
  },
  supportItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  supportTextContainer: {
    flex: 1,
  },
  supportItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  supportItemSubtitle: {
    fontSize: 14,
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
