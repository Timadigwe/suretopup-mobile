import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { Share } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';

interface EPinsModalProps {
  visible: boolean;
  onClose: () => void;
  epinsData: any;
}

const { width } = Dimensions.get('window');

export const EPinsModal: React.FC<EPinsModalProps> = ({
  visible,
  onClose,
  epinsData,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const viewShotRef = useRef<ViewShot>(null);

  const formatDate = (dateString: string) => {
    try {
      let date: Date;
      
      if (dateString.includes('T')) {
        // ISO format like "2025-08-27T08:58:58.000000Z"
        date = new Date(dateString);
      } else if (dateString.includes('th') || dateString.includes('st') || dateString.includes('nd') || dateString.includes('rd')) {
        // Format like "August 27th, 2025"
        const cleanDate = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
        date = new Date(cleanDate);
      } else {
        // Try direct parsing
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateString;
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      triggerHapticFeedback('light');
      
      // Capture the ePINs as an image first
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        
        // Share the image
        await Share.share({
          url: uri,
          title: 'ePINs Generated',
          message: `ePINs for ${epinsData?.service_name} - Reference: ${epinsData?.reference}`,
        });
      }
    } catch (error) {
      console.error('Error sharing ePINs:', error);
      Alert.alert('Error', 'Failed to share ePINs');
    } finally {
      setIsSharing(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      triggerHapticFeedback('medium');
      
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to save the ePINs to your gallery.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Capture the ePINs as an image
      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        
        // Save to media library
        await MediaLibrary.saveToLibraryAsync(uri);
        
        Alert.alert(
          'ePINs Saved!',
          'ePINs have been saved to your gallery.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving ePINs:', error);
      Alert.alert(
        'Error',
        'Failed to save ePINs. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible || !epinsData) return null;

  console.log('EPinsModal - epinsData:', JSON.stringify(epinsData, null, 2));

  return (
    <View style={styles.overlay}>
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Your ePINs
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Save or share your recharge pins
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 0.9,
              result: 'tmpfile',
            }}
            style={styles.epinsCaptureContainer}
          >
            {/* ePINs Content */}
            <View style={[styles.epinsCard, { backgroundColor: 'white' }]}>
              {/* Header */}
              <View style={styles.epinsHeader}>
                <View style={styles.epinsLogo}>
                  <Ionicons name="card" size={28} color="#F59E0B" />
                </View>
                <View style={styles.epinsHeaderText}>
                  <Text style={styles.epinsCompany}>SureTopUp</Text>
                  <Text style={styles.epinsType}>ePINs Receipt</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Transaction Details */}
              <View style={styles.epinsDetails}>
                <View style={styles.epinsRow}>
                  <Text style={styles.epinsLabel}>Reference:</Text>
                  <Text style={styles.epinsValue}>{epinsData.reference}</Text>
                </View>
                <View style={styles.epinsRow}>
                  <Text style={styles.epinsLabel}>Business:</Text>
                  <Text style={styles.epinsValue}>{epinsData.business_name}</Text>
                </View>
                <View style={styles.epinsRow}>
                  <Text style={styles.epinsLabel}>Network:</Text>
                  <Text style={styles.epinsValue}>{epinsData.service_name}</Text>
                </View>
                <View style={styles.epinsRow}>
                  <Text style={styles.epinsLabel}>Pin Value:</Text>
                  <Text style={styles.epinsValue}>₦{epinsData.value}</Text>
                </View>
                <View style={styles.epinsRow}>
                  <Text style={styles.epinsLabel}>Quantity:</Text>
                  <Text style={styles.epinsValue}>{epinsData.quantity} {epinsData.quantity === 1 ? 'ePIN' : 'ePINs'}</Text>
                </View>
                <View style={styles.epinsRow}>
                  <Text style={styles.epinsLabel}>Date:</Text>
                  <Text style={styles.epinsValue}>
                    {formatDate(new Date().toISOString())}
                  </Text>
                </View>
                <View style={styles.epinsRow}>
                  <Text style={styles.epinsLabel}>Total Amount:</Text>
                  <Text style={[styles.epinsValue, styles.amountValue]}>
                    ₦{parseFloat(epinsData.amount).toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* ePINs List */}
              <View style={styles.epinsList}>
                <Text style={styles.epinsListTitle}>ePINs:</Text>
                {epinsData.epins && epinsData.epins.length > 0 ? (
                  epinsData.epins.map((epin: any, index: number) => (
                  <View key={index} style={styles.epinCard}>
                    <View style={styles.epinHeader}>
                      <Text style={styles.epinNumber}>Pin #{index + 1}</Text>
                      <Text style={styles.epinAmount}>₦{epin.amount}</Text>
                    </View>
                    <View style={styles.epinDetails}>
                      <View style={styles.epinRow}>
                        <Text style={styles.epinLabel}>PIN:</Text>
                        <Text style={styles.epinValue}>{epin.pin}</Text>
                      </View>
                      <View style={styles.epinRow}>
                        <Text style={styles.epinLabel}>Serial:</Text>
                        <Text style={styles.epinValue}>{epin.serial}</Text>
                      </View>
                      <View style={styles.epinRow}>
                        <Text style={styles.epinLabel}>Dial:</Text>
                        <Text style={styles.epinInstruction}>{epin.instruction}</Text>
                      </View>
                                          </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.epinCard}>
                    <Text style={styles.epinValue}>No ePINs available</Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={[styles.epinsFooter, { backgroundColor: 'white' }]}>
                <Text style={styles.footerText}>Thank you for using SureTopUp</Text>
              </View>
            </View>
          </ViewShot>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="download" size={20} color="white" />
            )}
            <Text style={styles.actionButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="share" size={20} color="white" />
            )}
            <Text style={styles.actionButtonText}>
              {isSharing ? 'Sharing...' : 'Share'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.closeButton]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.text} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: width - 32,
    maxHeight: '90%',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  epinsCaptureContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  epinsCard: {
    padding: 20,
    borderRadius: 16,
  },
  epinsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  epinsLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  epinsHeaderText: {
    flex: 1,
  },
  epinsCompany: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  epinsType: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  epinsDetails: {
    marginBottom: 16,
  },
  epinsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  epinsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  epinsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  epinsList: {
    marginBottom: 16,
  },
  epinsListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  epinCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  epinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  epinNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  epinAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  epinDetails: {
    gap: 8,
  },
  epinRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  epinLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    width: 80,
  },
  epinValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  epinInstruction: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    flex: 1,
    fontStyle: 'italic',
  },
  epinsFooter: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  closeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
