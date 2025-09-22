import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeArea } from '@/hooks/useSafeArea';
import { BottomTabNavigator } from '@/components/navigation/BottomTabNavigator';
import { apiService } from '@/services/api';
import { dashboardCacheUtils } from '@/utils/dashboardCache';
import { useRememberMe } from '@/contexts/RememberMeContext';

interface ProfileScreenProps {
  onNavigate: (page: string, data?: any) => void;
  onLogout: () => void;
}



export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { colors } = useTheme();
  const { triggerHapticFeedback } = useMobileFeatures();
  const { user } = useAuth();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  
  // Profile editing states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Preloaded profile data state
  const [preloadedProfileData, setPreloadedProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone_number: '',
    state: '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  
  const [pinForm, setPinForm] = useState({
    current_pin: '',
    new_pin: '',
    new_pin_confirmation: '',
  });

  // Get user data from global dashboard cache
  const cachedData = dashboardCacheUtils.getData();
  const userData = cachedData?.user;

  const { rememberMe, savedCredentials } = useRememberMe();

  console.log('rememberMe', rememberMe);
  console.log('savedCredentials', savedCredentials);
  
  // Initialize edit form with current user data
  useEffect(() => {
    if (userData) {
      // Extract first and last name from fullname
      const fullName = userData.fullname || '';
      const nameParts = fullName.split(' ');
      const firstname = nameParts[0] || '';
      const lastname = nameParts.slice(1).join(' ') || '';
      
      setEditForm({
        firstname: firstname,
        lastname: lastname,
        email: userData.email || '',
        phone_number: user?.phone || '',
        state: '',
      });
    }
  }, [userData, user]);

  // Preload profile data when component mounts
  useEffect(() => {
    const preloadProfileData = async () => {
      if (!preloadedProfileData && !isLoadingProfile) {
        setIsLoadingProfile(true);
        try {
          const response = await apiService.getUserProfile();
          
          if (response.success && response.data) {
            setPreloadedProfileData(response.data);
          }
        } catch (error) {
          // Silently fail - we'll fetch again when user clicks edit
          console.log('Failed to preload profile data:', error);
        } finally {
          setIsLoadingProfile(false);
        }
      }
    };

    preloadProfileData();
  }, [preloadedProfileData, isLoadingProfile]);

  // Show edit profile modal with preloaded data
  const handleEditProfilePress = async () => {
    // If we have preloaded data, use it immediately
    if (preloadedProfileData) {
      setEditForm({
        firstname: preloadedProfileData.firstname || '',
        lastname: preloadedProfileData.lastname || '',
        email: preloadedProfileData.email || '',
        phone_number: preloadedProfileData.phone || '',
        state: preloadedProfileData.state || '',
      });
      setShowEditProfile(true);
      return;
    }

    // Fallback: fetch data if preloading failed
    try {
      const response = await apiService.getUserProfile();
      
      if (response.success && response.data) {
        const profileData = response.data;
        // Populate form with detailed profile data
        setEditForm({
          firstname: profileData.firstname || '',
          lastname: profileData.lastname || '',
          email: profileData.email || '',
          phone_number: profileData.phone || '',
          state: profileData.state || '',
        });
        setShowEditProfile(true);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch profile data');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch profile data');
    }
  };

  // Profile editing functions
  const handleUpdateProfile = async () => {
    if (!editForm.firstname.trim() || !editForm.lastname.trim() || 
        !editForm.email.trim() || !editForm.phone_number.trim() || !editForm.state.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiService.updateProfile(editForm);
      
      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEditProfile(false);
        // Refresh global dashboard data
        // Refresh dashboard data to show updated profile info
        await dashboardCacheUtils.refreshData();
        
        // Also refresh the profile display by re-fetching
        const profileResponse = await apiService.getUserProfile();
        if (profileResponse.success && profileResponse.data) {
          const profileData = profileResponse.data;
          // Update preloaded data for future use
          setPreloadedProfileData(profileData);
          setEditForm({
            firstname: profileData.firstname || '',
            lastname: profileData.lastname || '',
            email: profileData.email || '',
            phone_number: profileData.phone || '',
            state: profileData.state || '',
          });
        }
        triggerHapticFeedback('medium');
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
      triggerHapticFeedback('heavy');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password.trim() || !passwordForm.new_password.trim() || 
        !passwordForm.new_password_confirmation.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiService.changePassword(passwordForm);
      
      if (response.success) {
        Alert.alert('Success', 'Password changed successfully');
        setShowChangePassword(false);
        setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        triggerHapticFeedback('medium');
      } else {
        Alert.alert('Error', response.message || 'Failed to change password');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
      triggerHapticFeedback('heavy');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePin = async () => {
    if (!pinForm.current_pin.trim() || !pinForm.new_pin.trim() || 
        !pinForm.new_pin_confirmation.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (pinForm.new_pin !== pinForm.new_pin_confirmation) {
      Alert.alert('Error', 'New PINs do not match');
      return;
    }

    if (pinForm.new_pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiService.changePin(pinForm);
      
      if (response.success) {
        Alert.alert('Success', 'PIN changed successfully');
        setShowChangePin(false);
        setPinForm({ current_pin: '', new_pin: '', new_pin_confirmation: '' });
        triggerHapticFeedback('medium');
      } else {
        Alert.alert('Error', response.message || 'Failed to change PIN');
        triggerHapticFeedback('heavy');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change PIN');
      triggerHapticFeedback('heavy');
    } finally {
      setIsUpdating(false);
    }
  };

  const profileMenuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      icon: 'person',
      action: () => handleEditProfilePress(),
    },
    {
      id: 'change-password',
      title: 'Change Password',
      subtitle: 'Update your account password',
      icon: 'lock-closed',
      action: () => setShowChangePassword(true),
    },
    {
      id: 'change-pin',
      title: 'Change PIN',
      subtitle: 'Update your transaction PIN',
      icon: 'key',
      action: () => setShowChangePin(true),
    },

    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle',
      action: () => onNavigate('help-support'),
    },
    {
      id: 'about',
      title: 'About',
      subtitle: 'App version and legal information',
      icon: 'information-circle',
      action: () => onNavigate('about'),
    },
  ];

  const handleLogout = () => {
    triggerHapticFeedback('light');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await onLogout();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card + 'F5', paddingTop: safeAreaTop + 20 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => onNavigate('home')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Profile
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={32} color="white" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {userData?.fullname}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
              {userData?.email}
            </Text>
            <View style={styles.emailVerificationStatus}>
              <Ionicons 
                name={userData?.email_verified ? "checkmark-circle" : "close-circle"} 
                size={16} 
                color={userData?.email_verified ? colors.success : colors.destructive} 
              />
              <Text style={[
                styles.verificationText, 
                { color: userData?.email_verified ? colors.success : colors.destructive }
              ]}>
                {userData?.email_verified ? 'Email Verified' : 'Email Not Verified'}
              </Text>
            </View>
            <Text style={[styles.profilePhone, { color: colors.mutedForeground }]}>
              {user?.phone}
            </Text>
            <Text style={[styles.profileBalance, { color: colors.primary }]}>
              ₦{userData?.balance ? parseFloat(userData.balance).toLocaleString() : '0'}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {profileMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.card }]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: colors.mutedForeground }]}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.destructive }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out" size={20} color="white" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={{ paddingBottom: Platform.OS === 'android' ? safeAreaBottom : 0 }}>
        <BottomTabNavigator
          activeTab="profile"
          onTabPress={(tabId) => {
            if (tabId !== 'profile') {
              onNavigate(tabId);
            }
          }}
        />
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={() => setShowEditProfile(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>First Name</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={editForm.firstname}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, firstname: text }))}
                placeholder="Enter first name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Last Name</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={editForm.lastname}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, lastname: text }))}
                placeholder="Enter last name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                placeholder="Enter email"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={editForm.phone_number}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, phone_number: text }))}
                placeholder="Enter phone number"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>State</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={editForm.state}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, state: text }))}
                placeholder="Enter state"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.primary },
                isUpdating && { opacity: 0.6 }
              ]}
              onPress={handleUpdateProfile}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.background }]}>
                  Update Profile
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={() => setShowChangePassword(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={passwordForm.current_password}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, current_password: text }))}
                placeholder="Enter current password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={passwordForm.new_password}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, new_password: text }))}
                placeholder="Enter new password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={passwordForm.new_password_confirmation}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, new_password_confirmation: text }))}
                placeholder="Confirm new password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.primary },
                isUpdating && { opacity: 0.6 }
              ]}
              onPress={handleChangePassword}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.background }]}>
                  Change Password
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Change PIN Modal */}
      <Modal
        visible={showChangePin}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={() => setShowChangePin(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change PIN</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Current PIN</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={pinForm.current_pin}
                onChangeText={(text) => setPinForm(prev => ({ ...prev, current_pin: text }))}
                placeholder="Enter current PIN"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>New PIN</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={pinForm.new_pin}
                onChangeText={(text) => setPinForm(prev => ({ ...prev, new_pin: text }))}
                placeholder="Enter new PIN"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New PIN</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: colors.background,
                }]}
                value={pinForm.new_pin_confirmation}
                onChangeText={(text) => setPinForm(prev => ({ ...prev, new_pin_confirmation: text }))}
                placeholder="Confirm new PIN"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: colors.primary },
                isUpdating && { opacity: 0.6 }
              ]}
              onPress={handleChangePin}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={[styles.modalButtonText, { color: colors.background }]}>
                  Change PIN
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  emailVerificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  verificationText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  profilePhone: {
    fontSize: 14,
  },
  profileState: {
    fontSize: 14,
    marginTop: 2,
  },
  profileBalance: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  menuSection: {
    gap: 12,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  logoutSection: {
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCloseButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
