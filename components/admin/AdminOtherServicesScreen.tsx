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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useSafeArea } from '@/hooks/useSafeArea';
import { apiService } from '@/services/api';
import { CustomModal } from '../ui/CustomModal';

interface RequestUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  balance: string;
  state: string;
  status: string;
}

interface NinRequest {
  id: number | string;
  userid: string;
  slip_type: string;
  nin_number: string;
  slip_type_image_url?: string;
  amount: string;
  status: string;
  user?: RequestUser;
}

interface CacRequest {
  id: number | string;
  userid: string;
  certificate_type: string;
  business_name_1: string;
  business_name_2: string;
  company_address: string;
  residential_address: string;
  nature_of_business: string;
  share_capital: string;
  id_card_of_directors: string;
  passport_photograph: string;
  phone: string;
  email: string;
  fullname: string;
  dob: string;
  country: string;
  state: string;
  lga: string;
  city: string;
  sign: string;
  status: string;
  user?: RequestUser;
}

interface AdminOtherServicesScreenProps {
  onBack: () => void;
  initialTab?: 'nin' | 'cac';
}

export const AdminOtherServicesScreen: React.FC<AdminOtherServicesScreenProps> = ({ onBack, initialTab }) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  const [ninRequests, setNinRequests] = useState<NinRequest[]>([]);
  const [cacRequests, setCacRequests] = useState<CacRequest[]>([]);
  const [totalNin, setTotalNin] = useState(0);
  const [totalCac, setTotalCac] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'nin' | 'cac'>(initialTab ?? 'nin');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNinRequests, setFilteredNinRequests] = useState<NinRequest[]>([]);
  const [filteredCacRequests, setFilteredCacRequests] = useState<CacRequest[]>([]);
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<NinRequest | CacRequest | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('completed');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: colors.warning },
    { value: 'processing', label: 'Processing', color: colors.primary },
    { value: 'completed', label: 'Completed', color: colors.success },
    { value: 'rejected', label: 'Rejected', color: colors.destructive },
  ];

  useEffect(() => {
    fetchOtherServices();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setSelectedTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    filterRequests();
  }, [searchQuery, selectedTab, ninRequests, cacRequests]);

  const fetchOtherServices = async () => {
    setIsLoading(true);
    try {
      const [ninResponse, cacResponse] = await Promise.all([
        apiService.getAdminNinSubmissions(),
        apiService.getAdminCacSubmissions(),
      ]);

      if (ninResponse.success && ninResponse.data) {
        setNinRequests(ninResponse.data.submissions);
        setTotalNin(ninResponse.data.total);
      }
      if (cacResponse.success && cacResponse.data) {
        setCacRequests(cacResponse.data.submissions);
        setTotalCac(cacResponse.data.total);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch other services data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOtherServices().finally(() => setIsRefreshing(false));
  };

  const filterRequests = () => {
    if (selectedTab === 'nin') {
      const filtered = ninRequests.filter(request =>
        request.nin_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.slip_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNinRequests(filtered);
    } else {
      const filtered = cacRequests.filter(request =>
        request.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.business_name_1.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCacRequests(filtered);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;

    setIsUpdating(true);
    try {
      const response = await apiService.updateOtherServiceStatus({
        table: selectedTab,
        id: parseInt(selectedRequest.id),
        status: selectedStatus as any,
      });

      if (response.success) {
        triggerHapticFeedback('medium');
        setShowStatusModal(false);
        setSelectedRequest(null);
        fetchOtherServices();
        Alert.alert('Success', 'Status updated successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedRequest) return;

    setIsDeleting(true);
    try {
      const requestId = parseInt(String(selectedRequest.id), 10);
      const response = selectedTab === 'nin'
        ? await apiService.deleteAdminNinSubmission(requestId)
        : await apiService.deleteAdminCacSubmission(requestId);

      if (response.success) {
        triggerHapticFeedback('medium');
        setShowDeleteModal(false);
        setSelectedRequest(null);
        fetchOtherServices();
        Alert.alert('Success', 'Record deleted successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to delete record');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete record');
    } finally {
      setIsDeleting(false);
    }
  };

  const openStatusModal = (request: any) => {
    setSelectedRequest(request);
    setSelectedStatus(request.status);
    setShowStatusModal(true);
    triggerHapticFeedback('light');
  };

  const openDeleteModal = (request: any) => {
    setSelectedRequest(request);
    setShowDeleteModal(true);
    triggerHapticFeedback('light');
  };

  const openDetailsModal = async (request: NinRequest | CacRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
    setIsLoadingDetails(true);
    try {
      const requestId = parseInt(String(request.id), 10);
      if (selectedTab === 'nin') {
        const response = await apiService.getAdminNinSubmission(requestId);
        if (response.success && response.data) {
          setDetailsData(response.data);
        } else {
          setDetailsData(request);
        }
      } else {
        const response = await apiService.getAdminCacSubmission(requestId);
        if (response.success && response.data) {
          setDetailsData(response.data);
        } else {
          setDetailsData(request);
        }
      }
    } catch (error) {
      setDetailsData(request);
    } finally {
      setIsLoadingDetails(false);
      triggerHapticFeedback('light');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'processing':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const renderDetailRow = (label: string, value?: string | number | null) => (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}:</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>
        {value ?? 'N/A'}
      </Text>
    </View>
  );

  const renderNinRequest = ({ item }: { item: NinRequest }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.card }]}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={[styles.requestTitle, { color: colors.text }]}>
            NIN Request #{item.id}
          </Text>
          <Text style={[styles.requestSubtitle, { color: colors.mutedForeground }]}>
            NIN: {item.nin_number}
          </Text>
        </View>
        <View style={styles.requestStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {item.slip_type_image_url ? (
        <View style={styles.imagePreviewRow}>
          <Image
            source={{ uri: item.slip_type_image_url }}
            style={styles.ninSlipPreview}
          />
        </View>
      ) : null}

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Slip Type:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.slip_type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Amount:</Text>
          <Text style={[styles.detailValue, { color: colors.primary }]}>₦{parseFloat(item.amount).toLocaleString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>User ID:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.userid}</Text>
        </View>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => openDetailsModal(item)}
        >
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => openStatusModal(item)}
        >
          <Ionicons name="create" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Update Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.destructive + '20' }]}
          onPress={() => openDeleteModal(item)}
        >
          <Ionicons name="trash" size={16} color={colors.destructive} />
          <Text style={[styles.actionButtonText, { color: colors.destructive }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCacRequest = ({ item }: { item: CacRequest }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.card }]}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={[styles.requestTitle, { color: colors.text }]}>
            CAC Request #{item.id}
          </Text>
          <Text style={[styles.requestSubtitle, { color: colors.mutedForeground }]}>
            {item.business_name_1}
          </Text>
        </View>
        <View style={styles.requestStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.imagePreviewRow}>
        {item.id_card_of_directors ? (
          <Image
            source={{ uri: item.id_card_of_directors }}
            style={styles.cacPreviewImage}
          />
        ) : null}
        {item.passport_photograph ? (
          <Image
            source={{ uri: item.passport_photograph }}
            style={styles.cacPreviewImage}
          />
        ) : null}
        {item.sign ? (
          <Image
            source={{ uri: item.sign }}
            style={styles.cacPreviewImage}
          />
        ) : null}
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Certificate Type:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.certificate_type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Full Name:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.fullname}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Email:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.email}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Phone:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>State:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.state}</Text>
        </View>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => openDetailsModal(item)}
        >
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => openStatusModal(item)}
        >
          <Ionicons name="create" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Update Status</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.destructive + '20' }]}
          onPress={() => openDeleteModal(item)}
        >
          <Ionicons name="trash" size={16} color={colors.destructive} />
          <Text style={[styles.actionButtonText, { color: colors.destructive }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSummaryCard = () => {
    return (
      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>Other Services Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {totalNin + totalCac}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Pending</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {totalNin}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>NIN Requests</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {totalCac}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>CAC Requests</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={[
          styles.tab,
          { backgroundColor: selectedTab === 'nin' ? colors.primary : colors.background },
          { borderColor: colors.border }
        ]}
        onPress={() => setSelectedTab('nin')}
      >
        <Text style={[
          styles.tabText,
          { color: selectedTab === 'nin' ? 'white' : colors.text }
        ]}>
          NIN ({totalNin})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tab,
          { backgroundColor: selectedTab === 'cac' ? colors.primary : colors.background },
          { borderColor: colors.border }
        ]}
        onPress={() => setSelectedTab('cac')}
      >
        <Text style={[
          styles.tabText,
          { color: selectedTab === 'cac' ? 'white' : colors.text }
        ]}>
          CAC ({totalCac})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatusModal = () => (
    <CustomModal
      visible={showStatusModal}
      onClose={() => {
        setShowStatusModal(false);
        setSelectedRequest(null);
      }}
      title="Update Status"
      message=""
      customContent={
        <View style={styles.modalContent}>
          <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
            Select new status for this request:
          </Text>
          
          <View style={styles.statusOptions}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOption,
                  { 
                    backgroundColor: selectedStatus === option.value ? option.color : colors.background,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setSelectedStatus(option.value)}
              >
                <Text style={[
                  styles.statusOptionText,
                  { color: selectedStatus === option.value ? 'white' : colors.text }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      primaryButtonText="Update Status"
      onPrimaryPress={handleUpdateStatus}
      secondaryButtonText="Cancel"
      onSecondaryPress={() => {
        setShowStatusModal(false);
        setSelectedRequest(null);
      }}
      primaryButtonDisabled={isUpdating}
      primaryButtonLoading={isUpdating}
    />
  );

  const renderDetailsModal = () => (
    <CustomModal
      visible={showDetailsModal}
      onClose={() => {
        setShowDetailsModal(false);
        setSelectedRequest(null);
        setDetailsData(null);
      }}
      title={selectedTab === 'nin' ? 'NIN Submission Details' : 'CAC Submission Details'}
      message=""
      customContent={
        <View style={styles.modalContent}>
          {isLoadingDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading details...
              </Text>
            </View>
          ) : detailsData ? (
            <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
              {selectedTab === 'nin' ? (
                <>
                  {renderDetailRow('ID', detailsData.id)}
                  {renderDetailRow('Slip Type', (detailsData as NinRequest).slip_type)}
                  {renderDetailRow('NIN Number', (detailsData as NinRequest).nin_number)}
                  {renderDetailRow('Amount', (detailsData as NinRequest).amount)}
                  {renderDetailRow('Status', (detailsData as NinRequest).status)}
                  {(detailsData as NinRequest).slip_type_image_url ? (
                    <View style={styles.detailsImageBlock}>
                      <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Slip Image</Text>
                      <Image
                        source={{ uri: (detailsData as NinRequest).slip_type_image_url as string }}
                        style={styles.detailsImage}
                      />
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  {renderDetailRow('ID', detailsData.id)}
                  {renderDetailRow('Certificate Type', (detailsData as CacRequest).certificate_type)}
                  {renderDetailRow('Business Name 1', (detailsData as CacRequest).business_name_1)}
                  {renderDetailRow('Business Name 2', (detailsData as CacRequest).business_name_2)}
                  {renderDetailRow('Company Address', (detailsData as CacRequest).company_address)}
                  {renderDetailRow('Residential Address', (detailsData as CacRequest).residential_address)}
                  {renderDetailRow('Nature of Business', (detailsData as CacRequest).nature_of_business)}
                  {renderDetailRow('Share Capital', (detailsData as CacRequest).share_capital)}
                  <View style={styles.detailsImageBlock}>
                    <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Documents</Text>
                    <View style={styles.detailsImageRow}>
                      {(detailsData as CacRequest).id_card_of_directors ? (
                        <Image
                          source={{ uri: (detailsData as CacRequest).id_card_of_directors }}
                          style={styles.detailsImageSmall}
                        />
                      ) : null}
                      {(detailsData as CacRequest).passport_photograph ? (
                        <Image
                          source={{ uri: (detailsData as CacRequest).passport_photograph }}
                          style={styles.detailsImageSmall}
                        />
                      ) : null}
                      {(detailsData as CacRequest).sign ? (
                        <Image
                          source={{ uri: (detailsData as CacRequest).sign }}
                          style={styles.detailsImageSmall}
                        />
                      ) : null}
                    </View>
                  </View>
                  {renderDetailRow('Phone', (detailsData as CacRequest).phone)}
                  {renderDetailRow('Email', (detailsData as CacRequest).email)}
                  {renderDetailRow('Full Name', (detailsData as CacRequest).fullname)}
                  {renderDetailRow('DOB', (detailsData as CacRequest).dob)}
                  {renderDetailRow('Country', (detailsData as CacRequest).country)}
                  {renderDetailRow('State', (detailsData as CacRequest).state)}
                  {renderDetailRow('LGA', (detailsData as CacRequest).lga)}
                  {renderDetailRow('City', (detailsData as CacRequest).city)}
                  {renderDetailRow('Status', (detailsData as CacRequest).status)}
                </>
              )}

              {detailsData.user && (
                <>
                  <View style={styles.sectionDivider} />
                  <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>User Details</Text>
                  {renderDetailRow('User ID', detailsData.user.id)}
                  {renderDetailRow('Name', `${detailsData.user.firstname} ${detailsData.user.lastname}`)}
                  {renderDetailRow('Email', detailsData.user.email)}
                  {renderDetailRow('Phone', detailsData.user.phone)}
                  {renderDetailRow('State', detailsData.user.state)}
                  {renderDetailRow('Status', detailsData.user.status)}
                </>
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No details available
              </Text>
            </View>
          )}
        </View>
      }
      primaryButtonText="Close"
      onPrimaryPress={() => {
        setShowDetailsModal(false);
        setSelectedRequest(null);
        setDetailsData(null);
      }}
    />
  );

  const renderDeleteModal = () => (
    <CustomModal
      visible={showDeleteModal}
      onClose={() => {
        setShowDeleteModal(false);
        setSelectedRequest(null);
      }}
      title="Delete Record"
      message={`Are you sure you want to delete this ${selectedTab.toUpperCase()} request? This action cannot be undone.`}
      primaryButtonText="Delete"
      onPrimaryPress={handleDeleteRecord}
      secondaryButtonText="Cancel"
      onSecondaryPress={() => {
        setShowDeleteModal(false);
        setSelectedRequest(null);
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Other Services</Text>
          <TouchableOpacity
            onPress={handleRefresh}
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

        {/* Tabs */}
        {renderTabs()}

        {/* Search Bar */}
        <View style={[styles.searchCard, { backgroundColor: colors.card }]}>
          <View style={styles.searchSection}>
            <Ionicons name="search" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={`Search ${selectedTab.toUpperCase()} requests...`}
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Requests List */}
        <View style={styles.requestsList}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              {selectedTab === 'nin' 
                ? `${filteredNinRequests.length} NIN request${filteredNinRequests.length !== 1 ? 's' : ''}`
                : `${filteredCacRequests.length} CAC request${filteredCacRequests.length !== 1 ? 's' : ''}`
              }
            </Text>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Loading requests...
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedTab === 'nin' ? filteredNinRequests : filteredCacRequests}
              renderItem={selectedTab === 'nin' ? renderNinRequest : renderCacRequest}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={48} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    {searchQuery ? 'No requests found matching your search' : 'No requests available'}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {renderStatusModal()}
      {renderDetailsModal()}
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
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
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
  requestsList: {
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
  requestCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  requestSubtitle: {
    fontSize: 12,
  },
  requestStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestDetails: {
    marginBottom: 12,
  },
  imagePreviewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ninSlipPreview: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    resizeMode: 'contain',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  cacPreviewImage: {
    flex: 1,
    height: 90,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  requestActions: {
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
  detailsScroll: {
    maxHeight: 420,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  detailsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailsImageBlock: {
    marginTop: 8,
    marginBottom: 8,
  },
  detailsImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    resizeMode: 'contain',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  detailsImageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsImageSmall: {
    flex: 1,
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOptions: {
    gap: 8,
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminOtherServicesScreen;
