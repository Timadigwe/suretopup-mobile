import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PhoneInputComponent from 'react-native-phone-number-input';
import { useTheme } from '@/contexts/ThemeContext';

interface CustomPhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onChangeFormattedText: (text: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export const CustomPhoneInput: React.FC<CustomPhoneInputProps> = ({
  value,
  onChangeText,
  onChangeFormattedText,
  error,
  placeholder = 'Enter phone number',
  disabled = false,
  label,
}) => {
  const { colors } = useTheme();
  const phoneInput = useRef<any>(null);
  const [isValid, setIsValid] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      <View style={[
        styles.inputContainer,
        {
          backgroundColor: colors.card,
          borderColor: error ? colors.destructive : colors.border,
          borderWidth: error ? 2 : 1,
        }
      ]}>
        {React.createElement(PhoneInputComponent as any, {
          ref: phoneInput,
          defaultValue: value,
          defaultCode: "NG",
          layout: "first",
          onChangeText: onChangeText,
          onChangeFormattedText: onChangeFormattedText,
          withDarkTheme: colors.background === '#000000',
          withShadow: false,
          autoFocus: false,
          placeholder: placeholder,
          disabled: disabled,
          containerStyle: [
            styles.phoneContainer,
            { backgroundColor: colors.card }
          ],
          textContainerStyle: [
            styles.textContainer,
            { backgroundColor: colors.card }
          ],
          textInputStyle: [
            styles.textInput,
            { color: colors.text }
          ],
          codeTextStyle: [
            styles.codeText,
            { color: colors.text }
          ],
          flagButtonStyle: [
            styles.flagButton,
            { backgroundColor: colors.card }
          ],
          countryPickerProps: {
            withAlphaFilter: true,
            withCallingCode: true,
            withEmoji: true,
            withFilter: true,
            withFlag: true,
            withModal: true,
            flagSize: 24,
            flagStyle: {
              borderRadius: 4,
            }
          }
        })}
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  phoneContainer: {
    width: '100%',
    height: 56,
    borderRadius: 16,
  },
  textContainer: {
    borderRadius: 16,
    paddingLeft: 0,
  },
  textInput: {
    fontSize: 16,
    height: 56,
    paddingLeft: 0,
  },
  codeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  flagButton: {
    width: 60,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
});
