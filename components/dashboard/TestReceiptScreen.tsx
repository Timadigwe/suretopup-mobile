import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { TransactionReceiptScreen } from './TransactionReceiptScreen';

interface TestReceiptScreenProps {
  onNavigate: (page: string) => void;
}

const { width } = Dimensions.get('window');

export const TestReceiptScreen: React.FC<TestReceiptScreenProps> = ({ onNavigate }) => {
  const [showReceiptScreen, setShowReceiptScreen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();

  // Test functions for receipt screens
  const showTestReceipt = (type: 'airtime' | 'data' | 'betting') => {
    triggerHapticFeedback('light');
    
    const testData = {
      airtime: {
        reference: 'AIR' + Date.now(),
        amount: 1000,
        phone: '08012345678',
        service: 'Airtime',
        date: new Date().toISOString(),
        network: 'MTN',
        transaction_id: 12345,
        new_balance: 5000,
      },
      data: {
        reference: 'DATA' + Date.now(),
        amount: 1500,
        phone: '08012345678',
        service: 'Data',
        date: new Date().toISOString(),
        network: 'Airtel',
        dataPlan: '2GB - 30 Days',
        transaction_id: 12346,
        new_balance: 3500,
      },
      betting: {
        reference: 'BET' + Date.now(),
        amount: 2000,
        phone: '',
        service: 'Betting',
        date: new Date().toISOString(),
        transaction_id: 12347,
        new_balance: 1500,
        bettingCompany: 'Bet9ja',
        bettingCustomer: 'John Doe',
      },
    };

    setReceiptData(testData[type]);
    setShowReceiptScreen(true);
  };

  const handleReceiptClose = () => {
    setShowReceiptScreen(false);
    setReceiptData(null);
  };

  const handleGoBack = () => {
    onNavigate('home');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#ffffff' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#000000' }]}>
          Test Receipt UI
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#10B981', '#059669', '#047857']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroIconContainer}>
              <Ionicons name="receipt" size={32} color="white" />
            </View>
            <Text style={styles.heroTitle}>Receipt Testing</Text>
            <Text style={styles.heroSubtitle}>
              Test the new receipt screen design for different services
            </Text>
          </LinearGradient>
        </View>

        {/* Test Buttons Section */}
        <View style={styles.testSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Select Receipt Type
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Choose a service type to test the receipt UI
          </Text>

          <View style={styles.testButtons}>
            {/* Airtime Receipt */}
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.card }]}
              onPress={() => showTestReceipt('airtime')}
              activeOpacity={0.8}
            >
              <View style={[styles.testButtonIcon, { backgroundColor: '#00A900' + '20' }]}>
                <Ionicons name="call" size={24} color="#00A900" />
              </View>
              <View style={styles.testButtonContent}>
                <Text style={[styles.testButtonTitle, { color: colors.text }]}>
                  Airtime Receipt
                </Text>
                <Text style={[styles.testButtonSubtitle, { color: colors.mutedForeground }]}>
                  Test airtime recharge receipt
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Data Receipt */}
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.card }]}
              onPress={() => showTestReceipt('data')}
              activeOpacity={0.8}
            >
              <View style={[styles.testButtonIcon, { backgroundColor: '#2563eb' + '20' }]}>
                <Ionicons name="wifi" size={24} color="#2563eb" />
              </View>
              <View style={styles.testButtonContent}>
                <Text style={[styles.testButtonTitle, { color: colors.text }]}>
                  Data Receipt
                </Text>
                <Text style={[styles.testButtonSubtitle, { color: colors.mutedForeground }]}>
                  Test data purchase receipt
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            {/* Betting Receipt */}
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.card }]}
              onPress={() => showTestReceipt('betting')}
              activeOpacity={0.8}
            >
              <View style={[styles.testButtonIcon, { backgroundColor: '#dc2626' + '20' }]}>
                <Ionicons name="trophy" size={24} color="#dc2626" />
              </View>
              <View style={styles.testButtonContent}>
                <Text style={[styles.testButtonTitle, { color: colors.text }]}>
                  Betting Receipt
                </Text>
                <Text style={[styles.testButtonSubtitle, { color: colors.mutedForeground }]}>
                  Test betting funding receipt
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.card }]}>
          <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              About Receipt Testing
            </Text>
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              This screen allows you to test the new receipt UI design for different service types. 
              Each receipt includes service-specific styling, transaction details, and sharing options.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Receipt Screen */}
      {showReceiptScreen && receiptData && (
        <TransactionReceiptScreen
          receiptData={receiptData}
          onClose={handleReceiptClose}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
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
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  testSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  testButtons: {
    gap: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  testButtonSubtitle: {
    fontSize: 14,
  },
  infoSection: {
    marginHorizontal: 24,
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
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
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
