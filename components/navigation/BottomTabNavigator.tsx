import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';

interface BottomTabNavigatorProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

const tabItems = [
  { id: 'home', icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  { id: 'transactions', icon: 'receipt-outline', activeIcon: 'receipt', label: 'History' },
  { id: 'wallet', icon: 'wallet-outline', activeIcon: 'wallet', label: 'Wallet' },
  { id: 'profile', icon: 'person-outline', activeIcon: 'person', label: 'Profile' },
];

export const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();

  const handleTabPress = (tabId: string) => {
    triggerHapticFeedback('light');
    onTabPress(tabId);
  };

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: colors.card,
        borderTopColor: colors.border,
      }
    ]}>
      <View style={styles.tabContainer}>
        {tabItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.tabButton,
                isActive && {
                  backgroundColor: colors.primary + '15',
                }
              ]}
              onPress={() => handleTabPress(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? (item.activeIcon as any) : (item.icon as any)}
                size={24}
                color={isActive ? colors.primary : colors.mutedForeground}
                style={styles.tabIcon}
              />
              <Text style={[
                styles.tabLabel,
                { 
                  color: isActive ? colors.primary : colors.mutedForeground,
                }
              ]}>
                {item.label}
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
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  tabIcon: {
    marginBottom: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
