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
          <Ionicons name="wallet" size={20} color="rgba(255, 255, 255, 0.9)" />
          <Text style={styles.title}>Wallet Balance</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowBalance(!showBalance)}
          style={styles.toggleButton}
        >
          <Ionicons 
            name={showBalance ? 'eye-off' : 'eye'} 
            size={20} 
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
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.addFundsText}>Add Funds</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  toggleButton: {
    padding: 4,
  },
  balanceContainer: {
    marginBottom: 24,
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceSkeleton: {
    width: 150,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    marginBottom: 4,
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  addFundsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});
