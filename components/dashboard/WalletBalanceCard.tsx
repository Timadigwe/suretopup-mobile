import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet } from '@/contexts/WalletContext';
import { Ionicons } from '@expo/vector-icons';

interface WalletBalanceCardProps {
  balance: number;
  onAddFunds: () => void;
  showSkeleton?: boolean;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({ 
  balance, 
  onAddFunds, 
  showSkeleton = false 
}) => {
  const { showBalance, setShowBalance } = useWallet();
  const { colors } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <LinearGradient
      colors={['#FFD700', '#00A900', '#FFD700']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="wallet" size={18} color="rgba(255, 255, 255, 0.9)" />
          <Text style={styles.title}>Wallet Balance</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowBalance(!showBalance)}
          style={styles.toggleButton}
        >
          <Ionicons 
            name={showBalance ? 'eye-off' : 'eye'} 
            size={18} 
            color="rgba(255, 255, 255, 0.8)" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceContainer}>
        {showSkeleton ? (
          <View style={styles.balanceSkeleton} />
        ) : (
          <Text style={styles.balance}>
            {showBalance ? formatCurrency(balance) : '••••••'}
          </Text>
        )}
        <Text style={styles.balanceSubtitle}>
          Available for transactions
        </Text>
      </View>

        <TouchableOpacity
          onPress={onAddFunds}
          style={styles.addFundsButton}
        >
          <Ionicons name="add" size={18} color="white" />
          <Text style={styles.addFundsText}>Add Funds</Text>
        </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
  },
  toggleButton: {
    padding: 4,
  },
  balanceContainer: {
    marginBottom: 12,
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  balanceSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceSkeleton: {
    width: 120,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    marginBottom: 2,
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addFundsText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
});
