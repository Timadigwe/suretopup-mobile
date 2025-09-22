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
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useSafeArea } from '@/hooks/useSafeArea';
import { apiService } from '@/services/api';
import { CustomModal } from '../ui/CustomModal';

interface SlipType {
  id: number;
  type: string;
  name: string;
  price: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SlipTypesSummary {
  total_slips: number;
  active_slips: number;
  inactive_slips: number;
}

interface AdminSlipTypesScreenProps {
  onBack: () => void;
}

export const AdminSlipTypesScreen: React.FC<AdminSlipTypesScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  const [slipTypes, setSlipTypes] = useState<SlipType[]>([]);
  const [summary, setSummary] = useState<SlipTypesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSlipTypes, setFilteredSlipTypes] = useState<SlipType[]>([]);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSlipType, setSelectedSlipType] = useState<SlipType | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSlipTypes();
  }, []);

  useEffect(() => {
    filterSlipTypes();
  }, [searchQuery, slipTypes]);

  const fetchSlipTypes = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAdminSlipTypes();
      
      if (response.success && response.data) {
        setSlipTypes(response.data.slip_types);
        setSummary({
          total_slips: response.data.total_slips,
          active_slips: response.data.active_slips,
          inactive_slips: response.data.inactive_slips,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch slip types');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSlipTypes().finally(() => setIsRefreshing(false));
  };

  const filterSlipTypes = () => {
    if (!searchQuery.trim()) {
      setFilteredSlipTypes(slipTypes);
      return;
    }

    const filtered = slipTypes.filter(slipType =>
      slipType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slipType.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      slipType.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSlipTypes(filtered);
  };

  const handleCreateSlipType = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiService.createSlipType({
        name: formData.name.trim(),
        price,
        status: formData.status,
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        setShowCreateModal(false);
        resetForm();
        fetchSlipTypes();
        Alert.alert('Success', 'Slip type created successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to create slip type');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create slip type');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSlipType = async () => {
    if (!selectedSlipType || !formData.name.trim() || !formData.price.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiService.updateSlipType(selectedSlipType.id, {
        name: formData.name.trim(),
        price,
        status: formData.status,
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        setShowEditModal(false);
        resetForm();
        fetchSlipTypes();
        Alert.alert('Success', 'Slip type updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update slip type');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update slip type');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSlipType = async () => {
    if (!selectedSlipType) return;

    setIsDeleting(true);
    try {
      const response = await apiService.deleteSlipType(selectedSlipType.id);

      if (response.success) {
        triggerHapticFeedback('medium');
        setShowDeleteModal(false);
        setSelectedSlipType(null);
        fetchSlipTypes();
        Alert.alert('Success', 'Slip type deleted successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to delete slip type');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete slip type');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      status: 'active',
    });
    setSelectedSlipType(null);
  };

  const openEditModal = (slipType: SlipType) => {
    setSelectedSlipType(slipType);
    setFormData({
      name: slipType.name,
      price: slipType.price,
      status: slipType.status,
    });
    setShowEditModal(true);
    triggerHapticFeedback('light');
  };

  const openDeleteModal = (slipType: SlipType) => {
    setSelectedSlipType(slipType);
    setShowDeleteModal(true);
    triggerHapticFeedback('light');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? colors.success : colors.destructive;
  };

  const renderSlipTypeItem = ({ item }: { item: SlipType }) => (
    <View style={[styles.slipTypeCard, { backgroundColor: colors.card }]}>
      <View style={styles.slipTypeHeader}>
        <View style={styles.slipTypeInfo}>
          <Text style={[styles.slipTypeName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.slipTypeType, { color: colors.mutedForeground }]}>
            Type: {item.type}
          </Text>
        </View>
        <View style={styles.slipTypePrice}>
          <Text style={[styles.priceValue, { color: colors.primary }]}>
            ₦{parseFloat(item.price).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.slipTypeDetails}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.createdDate, { color: colors.mutedForeground }]}>
          Created: {formatDate(item.created_at)}
        </Text>
      </View>

      <View style={styles.slipTypeActions}>
        <TouchableOpacity
          style={[
            styles.actionButton, 
            { backgroundColor: colors.primary + '20' },
            (isUpdating || isDeleting) && { opacity: 0.6 }
          ]}
          onPress={() => openEditModal(item)}
          disabled={isUpdating || isDeleting}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="create" size={16} color={colors.primary} />
          )}
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>
            {isUpdating ? 'Updating...' : 'Edit'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton, 
            { backgroundColor: colors.destructive + '20' },
            (isUpdating || isDeleting) && { opacity: 0.6 }
          ]}
          onPress={() => openDeleteModal(item)}
          disabled={isUpdating || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.destructive} />
          ) : (
            <Ionicons name="trash" size={16} color={colors.destructive} />
          )}
          <Text style={[styles.actionButtonText, { color: colors.destructive }]}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSummaryCard = () => {
    if (!summary) return null;

    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Slip Types Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{summary.total_slips}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.active_slips}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Active</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.destructive }]}>{summary.inactive_slips}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Inactive</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCreateModal = () => (
    <CustomModal
      visible={showCreateModal}
      onClose={() => {
        setShowCreateModal(false);
        resetForm();
      }}
      title="Create Slip Type"
      message=""
      customContent={
        <View style={styles.modalContent}>
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Name *</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.background,
              }]}
              placeholder="Enter slip type name"
              placeholderTextColor={colors.mutedForeground}
              value={formData.name}
              onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Price (₦) *</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.background,
              }]}
              placeholder="Enter price"
              placeholderTextColor={colors.mutedForeground}
              value={formData.price}
              onChangeText={(value) => setFormData(prev => ({ ...prev, price: value }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Status *</Text>
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  { backgroundColor: formData.status === 'active' ? colors.primary : colors.background },
                  { borderColor: colors.border }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, status: 'active' }))}
              >
                <Text style={[
                  styles.statusOptionText,
                  { color: formData.status === 'active' ? 'white' : colors.text }
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  { backgroundColor: formData.status === 'inactive' ? colors.primary : colors.background },
                  { borderColor: colors.border }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, status: 'inactive' }))}
              >
                <Text style={[
                  styles.statusOptionText,
                  { color: formData.status === 'inactive' ? 'white' : colors.text }
                ]}>
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      }
      primaryButtonText="Create"
      onPrimaryPress={handleCreateSlipType}
      secondaryButtonText="Cancel"
      onSecondaryPress={() => {
        setShowCreateModal(false);
        resetForm();
      }}
      primaryButtonDisabled={isCreating}
      primaryButtonLoading={isCreating}
    />
  );

  const renderEditModal = () => (
    <CustomModal
      visible={showEditModal}
      onClose={() => {
        setShowEditModal(false);
        resetForm();
      }}
      title="Edit Slip Type"
      message=""
      customContent={
        <View style={styles.modalContent}>
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Name *</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.background,
              }]}
              placeholder="Enter slip type name"
              placeholderTextColor={colors.mutedForeground}
              value={formData.name}
              onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Price (₦) *</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.background,
              }]}
              placeholder="Enter price"
              placeholderTextColor={colors.mutedForeground}
              value={formData.price}
              onChangeText={(value) => setFormData(prev => ({ ...prev, price: value }))}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Status *</Text>
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  { backgroundColor: formData.status === 'active' ? colors.primary : colors.background },
                  { borderColor: colors.border }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, status: 'active' }))}
              >
                <Text style={[
                  styles.statusOptionText,
                  { color: formData.status === 'active' ? 'white' : colors.text }
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  { backgroundColor: formData.status === 'inactive' ? colors.primary : colors.background },
                  { borderColor: colors.border }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, status: 'inactive' }))}
              >
                <Text style={[
                  styles.statusOptionText,
                  { color: formData.status === 'inactive' ? 'white' : colors.text }
                ]}>
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      }
      primaryButtonText="Update"
      onPrimaryPress={handleEditSlipType}
      secondaryButtonText="Cancel"
      onSecondaryPress={() => {
        setShowEditModal(false);
        resetForm();
      }}
      primaryButtonDisabled={isUpdating}
      primaryButtonLoading={isUpdating}
    />
  );

  const renderDeleteModal = () => (
    <CustomModal
      visible={showDeleteModal}
      onClose={() => {
        setShowDeleteModal(false);
        setSelectedSlipType(null);
      }}
      title="Delete Slip Type"
      message={`Are you sure you want to delete "${selectedSlipType?.name}"? This action cannot be undone.`}
      primaryButtonText="Delete"
      onPrimaryPress={handleDeleteSlipType}
      secondaryButtonText="Cancel"
      onSecondaryPress={() => {
        setShowDeleteModal(false);
        setSelectedSlipType(null);
      }}
      primaryButtonDisabled={isDeleting}
      primaryButtonLoading={isDeleting}
      primaryButtonColor={colors.destructive}
    />
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Slip Types</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={[
              styles.addButton, 
              { backgroundColor: colors.primary },
              (isCreating || isUpdating || isDeleting) && { opacity: 0.6 }
            ]}
            disabled={isCreating || isUpdating || isDeleting}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="add" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Summary Card */}
        {renderSummaryCard()}

        {/* Search Bar */}
        <View style={[styles.searchCard, { backgroundColor: colors.card }]}>
          <View style={styles.searchSection}>
            <Ionicons name="search" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search slip types..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Slip Types List */}
        <View style={styles.slipTypesList}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              {filteredSlipTypes.length} slip type{filteredSlipTypes.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading slip types...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredSlipTypes}
              renderItem={renderSlipTypeItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={48} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    {searchQuery ? 'No slip types found matching your search' : 'No slip types available'}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {renderCreateModal()}
      {renderEditModal()}
      {renderDeleteModal()}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
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
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  slipTypesList: {
    marginBottom: 16,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  slipTypeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  slipTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  slipTypeInfo: {
    flex: 1,
  },
  slipTypeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  slipTypeType: {
    fontSize: 12,
  },
  slipTypePrice: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  slipTypeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  createdDate: {
    fontSize: 12,
  },
  slipTypeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalContent: {
    padding: 16,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminSlipTypesScreen;
