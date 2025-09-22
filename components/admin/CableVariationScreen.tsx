import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useSafeArea } from '@/hooks/useSafeArea';
import { apiService } from '@/services/api';
import { CustomModal } from '../ui/CustomModal';

interface CableVariation {
  id: number;
  variation_id: string;
  service_name: string;
  service_id: string;
  package_bouquet: string;
  price: string;
  percentage_charge: string;
  payment_price: string;
  availability: string;
  created_at: string;
  updated_at: string;
}

interface CableVariationScreenProps {
  onBack: () => void;
}

export const CableVariationScreen: React.FC<CableVariationScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  const [variations, setVariations] = useState<CableVariation[]>([]);
  const [filteredVariations, setFilteredVariations] = useState<CableVariation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<CableVariation | null>(null);
  const [editPercentage, setEditPercentage] = useState('');

  useEffect(() => {
    fetchCableVariations();
  }, []);

  useEffect(() => {
    filterVariations();
  }, [variations, searchQuery, selectedProvider]);

  const fetchCableVariations = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAdminCableVariations();
      if (response.success && response.data) {
        setVariations(response.data.services);
        
        // Extract unique providers
        const uniqueProviders = [...new Set(response.data.services.map(item => item.service_name))];
        setProviders(['All', ...uniqueProviders]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch cable variations');
    } finally {
      setIsLoading(false);
    }
  };

  const filterVariations = () => {
    let filtered = variations;

    // Filter by provider
    if (selectedProvider !== 'All') {
      filtered = filtered.filter(item => item.service_name === selectedProvider);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.package_bouquet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.service_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredVariations(filtered);
  };

  const handleUpdateVariation = async (id: number, percentage: number) => {
    setIsUpdating(true);
    try {
      const response = await apiService.updateCableVariation(id, percentage);
      if (response.success) {
        triggerHapticFeedback('medium');
        setSuccessData({
          type: 'single',
          data: response.data,
        });
        setShowSuccessModal(true);
        fetchCableVariations(); // Refresh data
      } else {
        Alert.alert('Error', response.message || 'Failed to update variation');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update variation');
      triggerHapticFeedback('heavy');
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditModal = (variation: CableVariation) => {
    setSelectedVariation(variation);
    setEditPercentage(variation.percentage_charge);
    setShowEditModal(true);
    triggerHapticFeedback('light');
  };

  const handleEditSubmit = () => {
    if (!selectedVariation) return;
    
    const percentage = parseFloat(editPercentage);
    if (isNaN(percentage) || percentage < 0) {
      Alert.alert('Error', 'Please enter a valid percentage');
      return;
    }
    
    setShowEditModal(false);
    handleUpdateVariation(selectedVariation.id, percentage);
  };

  const handleBulkUpdate = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please select items to update');
      return;
    }

    const percentage = parseFloat(bulkPercentage);
    if (isNaN(percentage) || percentage < 0) {
      Alert.alert('Error', 'Please enter a valid percentage');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiService.bulkUpdateCableVariations({
        percentage_charge: percentage,
        service_ids: selectedItems,
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        setSuccessData({
          type: 'bulk',
          data: response.data,
        });
        setShowSuccessModal(true);
        setSelectedItems([]);
        setBulkPercentage('');
        setShowBulkUpdate(false);
        fetchCableVariations(); // Refresh data
      } else {
        Alert.alert('Error', response.message || 'Failed to bulk update');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to bulk update');
      triggerHapticFeedback('heavy');
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(filteredVariations.map(item => item.id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const formatAmount = (amount: string) => {
    return `₦${parseFloat(amount).toLocaleString()}`;
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'dstv':
        return 'tv';
      case 'gotv':
        return 'tv';
      case 'startimes':
        return 'tv';
      case 'showmax':
        return 'play';
      default:
        return 'tv';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'dstv':
        return '#FF6B35';
      case 'gotv':
        return '#4CAF50';
      case 'startimes':
        return '#2196F3';
      case 'showmax':
        return '#9C27B0';
      default:
        return colors.primary;
    }
  };

  const renderVariationItem = ({ item }: { item: CableVariation }) => (
    <TouchableOpacity
      style={[
        styles.variationCard,
        { backgroundColor: colors.card },
        selectedItems.includes(item.id) && { borderColor: colors.primary, borderWidth: 2 }
      ]}
      onPress={() => toggleItemSelection(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.variationHeader}>
        <View style={styles.variationInfo}>
          <View style={styles.providerInfo}>
            <View style={[styles.providerIcon, { backgroundColor: getProviderColor(item.service_name) + '20' }]}>
              <Ionicons name={getProviderIcon(item.service_name)} size={20} color={getProviderColor(item.service_name)} />
            </View>
            <View style={styles.providerDetails}>
              <Text style={[styles.serviceName, { color: colors.text }]}>{item.service_name}</Text>
              <Text style={[styles.packageBouquet, { color: colors.mutedForeground }]}>{item.package_bouquet}</Text>
            </View>
          </View>
        </View>
        <View style={styles.variationActions}>
          {selectedItems.includes(item.id) && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </View>
      </View>

      <View style={styles.variationDetails}>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Base Price:</Text>
          <Text style={[styles.priceValue, { color: colors.text }]}>{formatAmount(item.price)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Charge:</Text>
          <Text style={[styles.priceValue, { color: colors.primary }]}>{item.percentage_charge}%</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Final Price:</Text>
          <Text style={[styles.priceValue, { color: colors.success }]}>{formatAmount(item.payment_price)}</Text>
        </View>
      </View>

      <View style={styles.variationFooter}>
        <View style={[styles.availabilityBadge, { 
          backgroundColor: item.availability === 'Available' ? colors.success + '20' : colors.destructive + '20' 
        }]}>
          <Text style={[styles.availabilityText, { 
            color: item.availability === 'Available' ? colors.success : colors.destructive 
          }]}>
            {item.availability}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="create" size={16} color={colors.primary} />
          <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: safeAreaTop + 20 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Cable Variations</Text>
          <TouchableOpacity
            onPress={fetchCableVariations}
            style={[styles.refreshButton, { backgroundColor: colors.primary + '20' }]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="refresh" size={16} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
      >
        {/* Search and Filter */}
        <View style={[styles.searchCard, { backgroundColor: colors.card }]}>
          <View style={styles.searchSection}>
            <Ionicons name="search" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search cable packages..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.providerFilter}
          >
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider}
                style={[
                  styles.providerChip,
                  { backgroundColor: selectedProvider === provider ? colors.primary : colors.background },
                  { borderColor: colors.border }
                ]}
                onPress={() => setSelectedProvider(provider)}
              >
                <Text style={[
                  styles.providerChipText,
                  { color: selectedProvider === provider ? 'white' : colors.text }
                ]}>
                  {provider}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <View style={[styles.bulkActionsCard, { backgroundColor: colors.card }]}>
            <View style={styles.bulkActionsHeader}>
              <Text style={[styles.bulkActionsTitle, { color: colors.text }]}>
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity
                onPress={clearSelection}
                style={[styles.clearButton, { backgroundColor: colors.destructive + '20' }]}
              >
                <Text style={[styles.clearButtonText, { color: colors.destructive }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            {!showBulkUpdate ? (
              <TouchableOpacity
                style={[styles.bulkUpdateButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowBulkUpdate(true)}
              >
                <Ionicons name="layers" size={20} color="white" />
                <Text style={styles.bulkUpdateButtonText}>Bulk Update</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.bulkUpdateForm}>
                <TextInput
                  style={[styles.bulkPercentageInput, { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background,
                  }]}
                  placeholder="Enter percentage"
                  placeholderTextColor={colors.mutedForeground}
                  value={bulkPercentage}
                  onChangeText={setBulkPercentage}
                  keyboardType="numeric"
                />
                <View style={styles.bulkUpdateActions}>
                  <TouchableOpacity
                    style={[styles.bulkActionButton, { backgroundColor: colors.mutedForeground }]}
                    onPress={() => setShowBulkUpdate(false)}
                  >
                    <Text style={styles.bulkActionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.bulkActionButton,
                      { backgroundColor: colors.primary },
                      (!bulkPercentage.trim() || isUpdating) && { opacity: 0.6 }
                    ]}
                    onPress={handleBulkUpdate}
                    disabled={!bulkPercentage.trim() || isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.bulkActionButtonText}>Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.card }]}
            onPress={selectAllItems}
          >
            <Ionicons name="checkmark-done" size={20} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Select All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: colors.card }]}
            onPress={clearSelection}
          >
            <Ionicons name="close" size={20} color={colors.destructive} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Variations List */}
        <View style={styles.variationsList}>
          <Text style={[styles.listTitle, { color: colors.text }]}>
            {filteredVariations.length} Cable Package{filteredVariations.length !== 1 ? 's' : ''}
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading cable variations...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredVariations}
              renderItem={renderVariationItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <CustomModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Update Percentage Charge"
        message={`Service: ${selectedVariation?.service_name}\nCurrent charge: ${selectedVariation?.percentage_charge}%`}
        customContent={
          <View style={styles.editModalContent}>
            <Text style={[styles.editModalLabel, { color: colors.text }]}>
              Enter new percentage:
            </Text>
            <TextInput
              style={[styles.editModalInput, { 
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.background,
              }]}
              placeholder="Enter percentage"
              placeholderTextColor={colors.mutedForeground}
              value={editPercentage}
              onChangeText={setEditPercentage}
              keyboardType="numeric"
              textAlignVertical="center"
              underlineColorAndroid="transparent"
            />
          </View>
        }
        primaryButtonText="Update"
        onPrimaryPress={handleEditSubmit}
        secondaryButtonText="Cancel"
        onSecondaryPress={() => setShowEditModal(false)}
        primaryButtonDisabled={isUpdating}
        primaryButtonLoading={isUpdating}
      />

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Ionicons 
                name="checkmark-circle" 
                size={48} 
                color={colors.success} 
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {successData.type === 'single' ? 'Cable Package Updated!' : 'Bulk Update Complete!'}
              </Text>
            </View>

            <View style={styles.modalBody}>
              {successData.type === 'single' ? (
                <View style={styles.singleUpdateResult}>
                  <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
                    Service: {successData.data.service.service_name}
                  </Text>
                  <Text style={[styles.resultText, { color: colors.text }]}>
                    Old Charge: {successData.data.service.old_percentage_charge}%
                  </Text>
                  <Text style={[styles.resultText, { color: colors.primary }]}>
                    New Charge: {successData.data.service.new_percentage_charge}%
                  </Text>
                  <Text style={[styles.resultText, { color: colors.success }]}>
                    Price Difference: ₦{successData.data.service.price_difference.toLocaleString()}
                  </Text>
                </View>
              ) : (
                <View style={styles.bulkUpdateResult}>
                  <Text style={[styles.resultText, { color: colors.text }]}>
                    Percentage Applied: {successData.data.percentage_charge_applied}%
                  </Text>
                  <Text style={[styles.resultText, { color: colors.success }]}>
                    Successfully Updated: {successData.data.successfully_updated}
                  </Text>
                  <Text style={[styles.resultText, { color: colors.destructive }]}>
                    Failed Updates: {successData.data.failed_count}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  searchCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  providerFilter: {
    marginTop: 8,
  },
  providerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  providerChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bulkActionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bulkActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulkActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bulkUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  bulkUpdateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bulkUpdateForm: {
    gap: 12,
  },
  bulkPercentageInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bulkUpdateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bulkActionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  variationsList: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  variationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  variationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  variationInfo: {
    flex: 1,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  packageBouquet: {
    fontSize: 14,
    lineHeight: 20,
  },
  variationActions: {
    marginLeft: 12,
  },
  variationDetails: {
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  variationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
  },
  modalBody: {
    marginBottom: 24,
  },
  singleUpdateResult: {
    gap: 8,
  },
  bulkUpdateResult: {
    gap: 8,
  },
  resultText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  editModalContent: {
    padding: 16,
  },
  editModalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  editModalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
});

export default CableVariationScreen;
