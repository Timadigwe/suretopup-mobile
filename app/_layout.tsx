import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { App } from '@/components/App';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      // Add a small delay to show the splash screen for a moment
      const hideSplash = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1500)); // Show splash for 1.5 seconds
          await SplashScreen.hideAsync();
        } catch (error) {
          console.log('Error hiding splash screen:', error);
        }
      };
      hideSplash();
    }
  }, [loaded]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <App />
        <StatusBar style="auto" />
      </AuthProvider>
    </ThemeProvider>
  );
}
