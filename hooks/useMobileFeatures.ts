import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';

export const useMobileFeatures = () => {
  useEffect(() => {
    const initializeMobileFeatures = async () => {
      // Initialize any mobile-specific features here
    };

    initializeMobileFeatures();
  }, []);

  const triggerHapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      switch (style) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      // Haptic feedback not available on this device
      console.log('Haptic feedback not available');
    }
  };

  const triggerNotificationHaptic = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptic feedback not available on this device
      console.log('Haptic feedback not available');
    }
  };

  return {
    triggerHapticFeedback,
    triggerNotificationHaptic
  };
};
