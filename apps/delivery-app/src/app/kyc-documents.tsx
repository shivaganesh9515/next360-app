import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { deliveryApi, API_BASE } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';
import { useSpringEntrance } from '../hooks/useDeliveryAnimation';

const DOCUMENT_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card', icon: 'id-card-outline' },
  { value: 'PAN', label: 'PAN Card', icon: 'document-text-outline' },
  { value: 'DRIVING_LICENSE', label: 'Driving License', icon: 'car-outline' },
  { value: 'VEHICLE_RC', label: 'Vehicle RC', icon: 'document-outline' },
  { value: 'OTHER', label: 'Other', icon: 'folder-outline' },
] as const;

type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface KycRecord {
  id: string;
  documentType: string;
  documentNumber: string | null;
  documentUrl: string | null;
  status: KycStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
}

function getStatusColor(status: KycStatus) {
  switch (status) {
    case 'VERIFIED': return Colors.primary;
    case 'PENDING': return Colors.warning;
    case 'REJECTED': return Colors.danger;
    default: return Colors.textSecondary;
  }
}

function getStatusBg(status: KycStatus) {
  switch (status) {
    case 'VERIFIED': return Colors.primaryLight;
    case 'PENDING': return Colors.warningLight;
    case 'REJECTED': return Colors.dangerLight;
    default: return Colors.background;
  }
}

function getStatusIcon(status: KycStatus): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'VERIFIED': return 'checkmark-circle';
    case 'PENDING': return 'time';
    case 'REJECTED': return 'alert-circle';
    default: return 'document-outline';
  }
}

export default function KycDocumentsScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === '1';
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const fadeAnim = useSpringEntrance(0);

  useEffect(() => { loadKycStatus(); }, []);

  const finishOnboarding = async () => {
    const { loadProfile, getEntryRoute } = useAuthStore.getState();
    await loadProfile();
    router.replace(getEntryRoute() as any);
  };

  const loadKycStatus = async () => {
    setLoading(true);
    try {
      const data = await deliveryApi.getKycStatus();
      setKyc(data);
      if (data.documentType) setDocumentType(data.documentType);
      if (data.documentNumber) setDocumentNumber(data.documentNumber);
      if (data.documentUrl) setDocumentUrl(data.documentUrl);
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('Not Found')) setKyc(null);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera roll access is required to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingImage(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri, name: asset.fileName || 'document.jpg', type: asset.mimeType || 'image/jpeg',
      } as any);
      const response = await fetch(
        `${API_BASE}/upload/image`,
        { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } },
      );
      const data = await response.json();
      const url = data?.data?.url || data?.url;
      if (url) setDocumentUrl(url);
      else Alert.alert('Upload failed', 'Could not upload image.');
    } catch {
      Alert.alert('Upload failed', 'Check your connection.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (kyc?.status === 'PENDING') {
      if (isOnboarding) {
        await finishOnboarding();
      } else {
        Alert.alert('Under Review', 'Your documents are already under review. We\'ll notify you once verification is complete.');
      }
      return;
    }

    if (kyc?.status === 'VERIFIED') {
      if (isOnboarding) {
        await finishOnboarding();
      } else {
        Alert.alert('Verified', 'Your KYC is already verified. No further action is needed.');
      }
      return;
    }

    if (!documentType) { Alert.alert('Required', 'Select a document type.'); return; }
    setSubmitting(true);
    try {
      await deliveryApi.submitKycDocuments([{
        documentType, documentNumber: documentNumber || undefined, documentUrl: documentUrl || '',
      }]);
      if (isOnboarding) {
        await finishOnboarding();
        return;
      }
      Alert.alert('Submitted', 'Your documents have been submitted for review.', [{ text: 'OK', onPress: loadKycStatus }]);
    } catch (error: any) {
      Alert.alert('Submission failed', error.message || 'Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading verification status...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          {isOnboarding && (
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>Step 3 of 3</Text>
            </View>
          )}
        </View>

        {/* Status Banner */}
        {kyc && (
          <View style={[styles.statusBanner, { backgroundColor: getStatusBg(kyc.status) }]}>
            <View style={[styles.statusIconWrap, { backgroundColor: getStatusColor(kyc.status) + '20' }]}>
              <Ionicons name={getStatusIcon(kyc.status)} size={24} color={getStatusColor(kyc.status)} />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: getStatusColor(kyc.status) }]}>
                {kyc.status === 'VERIFIED' ? 'Verified' : kyc.status === 'PENDING' ? 'Under Review' : kyc.status === 'REJECTED' ? 'Rejected' : 'Not Submitted'}
              </Text>
              {kyc.submittedAt && (
                <Text style={styles.statusDate}>Submitted {new Date(kyc.submittedAt).toLocaleDateString('en-IN')}</Text>
              )}
              {kyc.rejectionReason && (
                <Text style={styles.rejectionReason}>{kyc.rejectionReason}</Text>
              )}
            </View>
          </View>
        )}

        {/* Upload Card */}
        <View style={styles.uploadCard}>
          <Text style={styles.cardTitle}>Upload Document</Text>
          <Text style={styles.cardSubtitle}>Submit a clear photo of your government-issued ID.</Text>

          {/* Document Type Picker */}
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowTypePicker(!showTypePicker)}
            activeOpacity={0.7}
          >
            <View style={styles.pickerLeft}>
              <Ionicons
                name={(documentType ? DOCUMENT_TYPES.find(d => d.value === documentType)?.icon : 'document-outline') as any}
                size={18} color={documentType ? Colors.primary : Colors.textTertiary}
              />
              <Text style={[styles.pickerText, !documentType && styles.pickerPlaceholder]}>
                {documentType ? DOCUMENT_TYPES.find((d) => d.value === documentType)?.label : 'Select document type'}
              </Text>
            </View>
            <Ionicons name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
          </TouchableOpacity>

          {showTypePicker && (
            <View style={styles.pickerDropdown}>
              {DOCUMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.pickerOption, documentType === type.value && styles.pickerOptionActive]}
                  onPress={() => { setDocumentType(type.value); setShowTypePicker(false); }}
                >
                  <Ionicons name={type.icon as any} size={18} color={documentType === type.value ? Colors.primary : Colors.textSecondary} />
                  <Text style={[styles.pickerOptionText, documentType === type.value && styles.pickerOptionTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Document Number */}
          <Text style={styles.inputLabel}>Document Number</Text>
          <TextInput
            style={styles.input}
            value={documentNumber}
            onChangeText={setDocumentNumber}
            placeholder="Enter document number"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="characters"
          />

          {/* Photo Upload Area */}
          <Text style={styles.inputLabel}>Document Photo</Text>
          <TouchableOpacity style={styles.uploadArea} onPress={pickImage} disabled={uploadingImage} activeOpacity={0.8}>
            {uploadingImage ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : documentUrl ? (
              <Image source={{ uri: documentUrl }} style={styles.uploadedImage} />
            ) : (
              <>
                <View style={styles.uploadIconWrap}>
                  <Ionicons name="camera-outline" size={32} color={Colors.textTertiary} />
                </View>
                <Text style={styles.uploadText}>Tap to upload photo</Text>
                <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
              </>
            )}
          </TouchableOpacity>

          {!!documentUrl && (
            <TouchableOpacity style={styles.removeBtn} onPress={() => setDocumentUrl('')}>
              <Ionicons name="close-circle" size={18} color={Colors.danger} />
              <Text style={styles.removeText}>Remove photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={Colors.textTertiary} />
          <Text style={styles.infoText}>
            Verification typically takes 24-48 hours. You must be verified to accept deliveries.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitDisabled, !documentType && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting || (!documentType && kyc?.status !== 'PENDING' && kyc?.status !== 'VERIFIED')}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.white} />
              <Text style={styles.submitText}>
                {kyc?.status === 'REJECTED'
                  ? 'Resubmit'
                  : kyc?.status === 'PENDING'
                    ? (isOnboarding ? 'Continue' : 'Under Review')
                    : kyc?.status === 'VERIFIED'
                      ? (isOnboarding ? 'Continue' : 'Verified')
                      : 'Submit for Review'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.md, fontSize: 15, color: Colors.textSecondary },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, padding: Spacing.lg, paddingTop: 60, backgroundColor: Colors.white },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  stepPill: {
    marginLeft: 'auto', backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.pill, paddingHorizontal: 10, paddingVertical: 5,
  },
  stepPillText: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark, letterSpacing: 0.4 },
  // Status
  statusBanner: { flexDirection: 'row', alignItems: 'center', margin: Spacing.lg, padding: Spacing.lg, borderRadius: BorderRadius.lg, gap: 14 },
  statusIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 16, fontWeight: '600' },
  statusDate: { fontSize: 13, color: Colors.textTertiary, marginTop: 2 },
  rejectionReason: { fontSize: 13, color: Colors.danger, marginTop: 4 },
  // Upload Card
  uploadCard: { backgroundColor: Colors.white, margin: Spacing.lg, marginTop: 0, borderRadius: BorderRadius.xl, padding: Spacing.xxl, ...Shadow.sm },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.xl },
  // Picker
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.lg, borderWidth: 1.5, borderColor: Colors.border },
  pickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickerText: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  pickerPlaceholder: { color: Colors.textTertiary, fontWeight: '400' },
  pickerDropdown: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadow.md },
  pickerOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  pickerOptionActive: { backgroundColor: Colors.primaryLight },
  pickerOptionText: { fontSize: 14, color: Colors.textPrimary },
  pickerOptionTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  // Input
  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, letterSpacing: 0.3 },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.lg, fontSize: 16, color: Colors.textPrimary, marginBottom: Spacing.xl, borderWidth: 1.5, borderColor: Colors.border },
  // Upload
  uploadArea: { backgroundColor: Colors.background, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', padding: Spacing.xxl, alignItems: 'center', justifyContent: 'center', minHeight: 140, marginBottom: Spacing.md },
  uploadIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  uploadText: { fontSize: 15, fontWeight: '500', color: Colors.textSecondary },
  uploadHint: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
  uploadedImage: { width: '100%', height: 200, borderRadius: BorderRadius.md, resizeMode: 'cover' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: Spacing.sm },
  removeText: { fontSize: 13, color: Colors.danger, fontWeight: '500' },
  // Info
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: Spacing.lg, marginBottom: Spacing.xl, padding: Spacing.lg, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, ...Shadow.sm },
  infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  // Submit
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.lg, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: 16, gap: 8, ...Shadow.md },
  submitDisabled: { backgroundColor: Colors.textTertiary },
  submitText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
