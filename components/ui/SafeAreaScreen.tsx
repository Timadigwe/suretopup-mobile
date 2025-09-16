import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ViewStyle } from 'react-native';
import { useSafeArea } from '@/hooks/useSafeArea';

interface SafeAreaScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  keyboardAvoidingView?: boolean;
  keyboardVerticalOffset?: number;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export const SafeAreaScreen: React.FC<SafeAreaScreenProps> = ({
  children,
  style,
  scrollable = false,
  keyboardAvoidingView = true,
  keyboardVerticalOffset = Platform.OS === 'ios' ? 0 : 20,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
}) => {
  const { safeAreaTop, safeAreaBottom } = useSafeArea();

  const containerStyle = [
    styles.container,
    { paddingTop: safeAreaTop },
    style,
  ];

  const scrollContentStyle = [
    contentContainerStyle,
    { paddingBottom: safeAreaBottom + 20 },
  ];

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={scrollContentStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={scrollContentStyle}>
      {children}
    </View>
  );

  if (keyboardAvoidingView) {
    return (
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
