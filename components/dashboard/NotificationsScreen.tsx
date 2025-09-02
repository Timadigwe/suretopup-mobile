import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';

interface NotificationsScreenProps {
  onNavigate: (page: string, data?: any) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onNavigate,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();

  const handleGoBack = () => {
    triggerHapticFeedback('light');
    onNavigate('home');
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
            Notifications
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
        {/* Empty State */}
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.mutedForeground + '20' }]}>
            <Ionicons name="notifications-off" size={64} color={colors.mutedForeground} />
          </View>
          
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Notifications
          </Text>
          
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            You're all caught up! Check back later for updates and important information.
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
});

export default NotificationsScreen;
