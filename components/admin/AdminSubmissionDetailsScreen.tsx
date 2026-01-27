import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeArea } from '@/hooks/useSafeArea';
import { apiService, BASE_URL } from '@/services/api';

type SubmissionType = 'nin' | 'cac';

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

interface NinSubmission {
  id: number;
  userid: string;
  slip_type: string;
  nin_number: string;
  slip_type_image_url?: string;
  amount: string;
  status: string;
  user?: RequestUser;
}

interface CacSubmission {
  id: number;
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

interface AdminSubmissionDetailsScreenProps {
  onBack: () => void;
  submissionType: SubmissionType;
  submissionId: number;
}

export const AdminSubmissionDetailsScreen: React.FC<AdminSubmissionDetailsScreenProps> = ({
  onBack,
  submissionType,
  submissionId,
}) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { safeAreaTop, safeAreaBottom } = useSafeArea();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<NinSubmission | CacSubmission | null>(null);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<Record<string, string>>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        if (submissionType === 'nin') {
          const response = await apiService.getAdminNinSubmission(submissionId);
          if (response.success && response.data) {
            setData(response.data);
          }
        } else {
          const response = await apiService.getAdminCacSubmission(submissionId);
          if (response.success && response.data) {
            setData(response.data);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load submission details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [submissionId, submissionType]);

  const title = useMemo(() => {
    return submissionType === 'nin' ? 'NIN Submission' : 'CAC Submission';
  }, [submissionType]);

  const formatLabelValue = (label: string, value?: string | number | null) => (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}:</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value ?? 'N/A'}</Text>
    </View>
  );

  const getFileExtension = (url: string, fallback: string = 'jpg') => {
    const sanitizedUrl = url.split('?')[0].split('#')[0];
    const match = sanitizedUrl.match(/\.([a-zA-Z0-9]+)$/);
    if (!match) {
      return fallback;
    }
    const ext = match[1].toLowerCase();
    const allowedExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']);
    return allowedExts.has(ext) ? ext : fallback;
  };

  const normalizeImageUrl = (url: string) => {
    if (!url) {
      return url;
    }
    if (
      url.startsWith('data:') ||
      url.startsWith('file://') ||
      url.startsWith('content://') ||
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }
    try {
      return new URL(url, BASE_URL).toString();
    } catch {
      return url;
    }
  };

  const saveImageToLibrary = async (uri: string) => {
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
    } catch (error) {
      const asset = await MediaLibrary.createAssetAsync(uri);
      try {
        await MediaLibrary.createAlbumAsync('SureTopUp', asset, false);
      } catch {
        // Album creation can fail on some devices; asset still saved.
      }
    }
  };

  const setStatus = (key: string, status: string) => {
    setDownloadStatus(prev => ({ ...prev, [key]: status }));
  };

  const setProgress = (key: string, progress: number) => {
    setDownloadProgress(prev => ({ ...prev, [key]: progress }));
  };

  const downloadWithTimeout = async (
    url: string,
    targetUri: string,
    key: string,
    headers?: Record<string, string>,
    timeoutMs: number = 30000
  ) => {
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      targetUri,
      { headers },
      progress => {
        const total = progress.totalBytesExpectedToWrite;
        if (total > 0) {
          const percent = Math.round((progress.totalBytesWritten / total) * 100);
          setProgress(key, percent);
          setStatus(key, `Downloading... ${percent}%`);
        } else {
          setStatus(key, 'Downloading...');
        }
      }
    );

    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        reject(new Error('Download timed out'));
      }, timeoutMs);
    });

    const result = await Promise.race([downloadResumable.downloadAsync(), timeoutPromise]);
    if (!result) {
      throw new Error('Download failed');
    }
    if ('status' in result && typeof result.status === 'number' && result.status >= 400) {
      throw new Error(`Download failed with status ${result.status}`);
    }
    return result;
  };

  const downloadImage = async (url: string, prefix: string, key: string) => {
    if (!url) {
      Alert.alert('Error', 'Image URL not available');
      return;
    }
    setDownloadingKey(key);
    setStatus(key, 'Requesting permission...');
    setProgress(key, 0);
    try {
      const permissionTimeout = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          clearTimeout(timeoutId);
          reject(new Error('Permission request timed out'));
        }, 10000);
      });

      const currentPermissions = await MediaLibrary.getPermissionsAsync();
      let permissionStatus = currentPermissions.status;

      if (permissionStatus !== 'granted') {
        setStatus(key, 'Waiting for permission prompt...');
        const permissionResult = await Promise.race([
          MediaLibrary.requestPermissionsAsync(),
          permissionTimeout,
        ]);
        permissionStatus = permissionResult.status;
      }

      if (permissionStatus !== 'granted') {
        setStatus(key, 'Permission denied.');
        Alert.alert('Permission required', 'Please allow photo access to save images.');
        return;
      }

      setStatus(key, 'Preparing download...');
      const resolvedUrl = normalizeImageUrl(url);
      const fileExt = getFileExtension(resolvedUrl);
      const fileName = `${prefix}-${Date.now()}.${fileExt}`;
      const localUri = `${FileSystem.cacheDirectory}${fileName}`;

      if (resolvedUrl.startsWith('data:image')) {
        const match = resolvedUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
        const base64 = resolvedUrl.split(',')[1];
        if (!match || !base64) {
          throw new Error('Invalid image data');
        }
        setStatus(key, 'Saving image...');
        await FileSystem.writeAsStringAsync(localUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await saveImageToLibrary(localUri);
      } else if (resolvedUrl.startsWith('file://') || resolvedUrl.startsWith('content://')) {
        setStatus(key, 'Saving image...');
        await saveImageToLibrary(resolvedUrl);
      } else {
        const encodedUrl = encodeURI(resolvedUrl);
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const result = await downloadWithTimeout(encodedUrl, localUri, key, headers);
        setStatus(key, 'Saving image...');
        await saveImageToLibrary(result.uri);
      }
      setStatus(key, 'Saved to gallery.');
      Alert.alert('Saved', 'Image saved to your gallery.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save image';
      console.error('Image download failed:', error);
      setStatus(key, `Error: ${message}`);
      Alert.alert('Error', 'Failed to save image');
    } finally {
      setDownloadingKey(prev => (prev === key ? null : prev));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, paddingTop: safeAreaTop + 20 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{title} Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading details...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: safeAreaBottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Submission Details</Text>
            {data ? (
              submissionType === 'nin' ? (
                <>
                  {formatLabelValue('ID', data.id)}
                  {formatLabelValue('Slip Type', (data as NinSubmission).slip_type)}
                  {formatLabelValue('NIN Number', (data as NinSubmission).nin_number)}
                  {formatLabelValue('Amount', (data as NinSubmission).amount)}
                  {formatLabelValue('Status', (data as NinSubmission).status)}
                  {(data as NinSubmission).slip_type_image_url ? (
                    <View style={styles.imageBlock}>
                      <Text style={[styles.subsectionTitle, { color: colors.text }]}>Slip Image</Text>
                      <Image
                        source={{ uri: (data as NinSubmission).slip_type_image_url }}
                        style={styles.imageLarge}
                      />
                      <TouchableOpacity
                        style={[styles.downloadButton, { backgroundColor: colors.primary }]}
                        onPress={() =>
                          downloadImage(
                            (data as NinSubmission).slip_type_image_url as string,
                            'nin-slip',
                            'nin-slip'
                          )
                        }
                        disabled={downloadingKey === 'nin-slip'}
                      >
                        {downloadingKey === 'nin-slip' ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Ionicons name="download" size={16} color="white" />
                        )}
                        <Text style={styles.downloadButtonText}>
                          {downloadingKey === 'nin-slip' ? 'Saving...' : 'Download Image'}
                        </Text>
                      </TouchableOpacity>
                      {downloadStatus['nin-slip'] ? (
                        <Text style={[styles.downloadStatusText, { color: colors.mutedForeground }]}>
                          {downloadStatus['nin-slip']}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  {formatLabelValue('ID', data.id)}
                  {formatLabelValue('Certificate Type', (data as CacSubmission).certificate_type)}
                  {formatLabelValue('Business Name 1', (data as CacSubmission).business_name_1)}
                  {formatLabelValue('Business Name 2', (data as CacSubmission).business_name_2)}
                  {formatLabelValue('Company Address', (data as CacSubmission).company_address)}
                  {formatLabelValue('Residential Address', (data as CacSubmission).residential_address)}
                  {formatLabelValue('Nature of Business', (data as CacSubmission).nature_of_business)}
                  {formatLabelValue('Share Capital', (data as CacSubmission).share_capital)}
                  {formatLabelValue('Phone', (data as CacSubmission).phone)}
                  {formatLabelValue('Email', (data as CacSubmission).email)}
                  {formatLabelValue('Full Name', (data as CacSubmission).fullname)}
                  {formatLabelValue('DOB', (data as CacSubmission).dob)}
                  {formatLabelValue('Country', (data as CacSubmission).country)}
                  {formatLabelValue('State', (data as CacSubmission).state)}
                  {formatLabelValue('LGA', (data as CacSubmission).lga)}
                  {formatLabelValue('City', (data as CacSubmission).city)}
                  {formatLabelValue('Status', (data as CacSubmission).status)}
                  <View style={styles.imageBlock}>
                    <Text style={[styles.subsectionTitle, { color: colors.text }]}>Documents</Text>
                    <View style={styles.imageRow}>
                      {(data as CacSubmission).id_card_of_directors ? (
                        <View style={styles.imageColumn}>
                          <Image
                            source={{ uri: (data as CacSubmission).id_card_of_directors }}
                            style={styles.imageSmall}
                          />
                          <TouchableOpacity
                            style={[styles.downloadButtonSmall, { backgroundColor: colors.primary }]}
                            onPress={() =>
                              downloadImage(
                                (data as CacSubmission).id_card_of_directors,
                                'cac-id-card',
                                'cac-id-card'
                              )
                            }
                            disabled={downloadingKey === 'cac-id-card'}
                          >
                            {downloadingKey === 'cac-id-card' ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Ionicons name="download" size={14} color="white" />
                            )}
                          </TouchableOpacity>
                          {downloadStatus['cac-id-card'] ? (
                            <Text
                              style={[styles.downloadStatusTextSmall, { color: colors.mutedForeground }]}
                            >
                              {downloadStatus['cac-id-card']}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      {(data as CacSubmission).passport_photograph ? (
                        <View style={styles.imageColumn}>
                          <Image
                            source={{ uri: (data as CacSubmission).passport_photograph }}
                            style={styles.imageSmall}
                          />
                          <TouchableOpacity
                            style={[styles.downloadButtonSmall, { backgroundColor: colors.primary }]}
                            onPress={() =>
                              downloadImage(
                                (data as CacSubmission).passport_photograph,
                                'cac-passport',
                                'cac-passport'
                              )
                            }
                            disabled={downloadingKey === 'cac-passport'}
                          >
                            {downloadingKey === 'cac-passport' ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Ionicons name="download" size={14} color="white" />
                            )}
                          </TouchableOpacity>
                          {downloadStatus['cac-passport'] ? (
                            <Text
                              style={[styles.downloadStatusTextSmall, { color: colors.mutedForeground }]}
                            >
                              {downloadStatus['cac-passport']}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      {(data as CacSubmission).sign ? (
                        <View style={styles.imageColumn}>
                          <Image
                            source={{ uri: (data as CacSubmission).sign }}
                            style={styles.imageSmall}
                          />
                          <TouchableOpacity
                            style={[styles.downloadButtonSmall, { backgroundColor: colors.primary }]}
                            onPress={() =>
                              downloadImage((data as CacSubmission).sign, 'cac-sign', 'cac-sign')
                            }
                            disabled={downloadingKey === 'cac-sign'}
                          >
                            {downloadingKey === 'cac-sign' ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Ionicons name="download" size={14} color="white" />
                            )}
                          </TouchableOpacity>
                          {downloadStatus['cac-sign'] ? (
                            <Text
                              style={[styles.downloadStatusTextSmall, { color: colors.mutedForeground }]}
                            >
                              {downloadStatus['cac-sign']}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  </View>
                </>
              )
            ) : (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No details available.
              </Text>
            )}
          </View>

          {data?.user ? (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>User Details</Text>
              {formatLabelValue('User ID', data.user.id)}
              {formatLabelValue('Name', `${data.user.firstname} ${data.user.lastname}`)}
              {formatLabelValue('Email', data.user.email)}
              {formatLabelValue('Phone', data.user.phone)}
              {formatLabelValue('State', data.user.state)}
              {formatLabelValue('Status', data.user.status)}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  imageBlock: {
    marginTop: 12,
  },
  imageLarge: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    resizeMode: 'contain',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  imageRow: {
    flexDirection: 'row',
    gap: 8,
  },
  imageColumn: {
    flex: 1,
    alignItems: 'center',
  },
  imageSmall: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    resizeMode: 'cover',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  downloadButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  downloadButtonSmall: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  downloadStatusText: {
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  downloadStatusTextSmall: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
  },
});

export default AdminSubmissionDetailsScreen;
