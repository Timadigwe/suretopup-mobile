/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#00A900';
const tintColorDark = '#00CC00';

export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorLight,
    // SureTopUp specific colors
    primary: '#00A900',
    primaryHover: '#008800',
    accent: '#FFD700',
    success: '#00A900',
    warning: '#FFD700',
    destructive: '#FF4444',
    muted: '#F5F5F5',
    mutedForeground: '#737373',
    border: '#E5E5E5',
    card: '#FFFFFF',
    cardForeground: '#000000',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: tintColorDark,
    tabIconDefault: '#CCCCCC',
    tabIconSelected: tintColorDark,
    // SureTopUp specific colors
    primary: '#00CC00',
    primaryHover: '#00AA00',
    accent: '#FFD700',
    success: '#00CC00',
    warning: '#FFD700',
    destructive: '#FF6666',
    muted: '#1A1A1A',
    mutedForeground: '#A3A3A3',
    border: '#333333',
    card: '#1A1A1A',
    cardForeground: '#FFFFFF',
  },
};
