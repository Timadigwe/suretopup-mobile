import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, TextInput, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';

interface DropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  data: Array<{ label: string; value: string }>;
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  onValueChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  data,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const [isOpen, setIsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const selectedItem = data.find(item => item.value === value);

  // Filter data based on search text
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item =>
        item.label.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchText, data]);

  // Animate modal
  useEffect(() => {
    if (isOpen) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, slideAnim]);

  const handleSelect = (item: { label: string; value: string }) => {
    triggerHapticFeedback('light');
    onValueChange(item.value);
    setIsOpen(false);
    setFocused(false);
    setSearchText('');
  };

  const handlePress = () => {
    if (!disabled) {
      triggerHapticFeedback('light');
      setIsOpen(true);
      setFocused(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setFocused(false);
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : focused ? colors.primary : colors.border,
            borderWidth: error || focused ? 2 : 1,
          },
          disabled && styles.disabled
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.inputContent}>
          <Ionicons
            name="location"
            size={20}
            color={selectedItem ? colors.primary : colors.mutedForeground}
            style={styles.inputIcon}
          />
          <Text style={[
            styles.inputText,
            { color: selectedItem ? colors.text : colors.mutedForeground }
          ]}>
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <Animated.View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.card,
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  })
                }],
                opacity: slideAnim
              }
            ]}
          >
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select State
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={[styles.searchContainer, { borderBottomColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.mutedForeground} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search states..."
                placeholderTextColor={colors.mutedForeground}
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={true}
              />
            </View>

            {/* Options List */}
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: value === item.value ? colors.primary + '15' : 'transparent',
                      borderBottomColor: colors.border,
                    }
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={value === item.value ? colors.primary : colors.mutedForeground}
                      style={styles.optionIcon}
                    />
                    <Text style={[
                      styles.optionText,
                      { 
                        color: value === item.value ? colors.primary : colors.text,
                        fontWeight: value === item.value ? '600' : '400'
                      }
                    ]}>
                      {item.label}
                    </Text>
                  </View>
                  {value === item.value && (
                    <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
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
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    fontSize: 16,
    flex: 1,
  },
  disabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
