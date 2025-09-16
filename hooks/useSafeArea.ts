import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export const useSafeArea = () => {
  const insets = useSafeAreaInsets();
  
  // Add extra bottom padding for Android devices to account for navigation bar
  const bottomPadding = Platform.OS === 'android' 
    ? Math.max(insets.bottom, 20) // Ensure at least 20px bottom padding on Android
    : insets.bottom;
  
  return {
    top: insets.top,
    bottom: bottomPadding,
    left: insets.left,
    right: insets.right,
    // Convenience properties for common use cases
    safeAreaTop: insets.top,
    safeAreaBottom: bottomPadding,
    safeAreaLeft: insets.left,
    safeAreaRight: insets.right,
    // Combined padding for content containers
    contentPadding: {
      paddingTop: insets.top,
      paddingBottom: bottomPadding,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    // Bottom-only padding for buttons and fixed elements
    bottomPadding: {
      paddingBottom: bottomPadding,
    },
    // Top-only padding for headers
    topPadding: {
      paddingTop: insets.top,
    },
  };
};
