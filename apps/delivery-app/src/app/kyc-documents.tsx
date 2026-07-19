import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { deliveryApi } from '../lib/api';

const DOCUMENT_TYPES = [
  { value: 'AADHAAR', label: 'Aadhaar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
  { value: 'VEHICLE_RC', label: 'Vehicle RC' },
  { value: 'OTHER', label: 'Other' },
];

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

export default function KycDocumentsScreen() {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  useEffect(() => {
    loadKycStatus();
  }, []);

  const loadKycStatus = async () => {
    setLoading(true);
    try {
      const data = await deliveryApi.getKycStatus();
      setKyc(data);
      if (data.documentType) setDocumentType(data.documentType);
      if (data.documentNumber) setDocumentNumber(data.documentNumber);
      if (data.documentUrl) setDocumentUrl(data.documentUrl);
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        setKyc(null);
      }
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
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingImage(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'document.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api'}/upload/image`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      const url = data?.data?.url || data?.url;
      if (url) {
        setDocumentUrl(url);
      } else {
        Alert.alert('Upload failed', 'Could not upload image. Try again.');
      }
    } catch (error) {
      Alert.alert('Upload failed', 'Could not upload image. Check your connection.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!documentType) {
      Alert.alert('Missing field', 'Select a document type.');
      return;
    }

    setSubmitting(true);
    try {
      await deliveryApi.submitKycDocuments([
        {
          documentType,
          documentNumber: documentNumber || undefined,
          documentUrl: documentUrl || '',
        },
      ]);
      Alert.alert('Submitted', 'Your documents have been submitted for review.', [
        { text: 'OK', onPress: loadKycStatus },
      ]);
    } catch (error: any) {
      Alert.alert('Submission failed', error.message || 'Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: KycStatus) => {
    switch (status) {
      case 'VERIFIED': return '#10B981';
      case 'PENDING': return '#F59E0B';
      case 'REJECTED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: KycStatus) => {
    switch (status) {
      case 'VERIFIED': return 'Verified';
      case 'PENDING': return 'Under Review';
      case 'REJECTED': return 'Rejected';
      default: return 'Not Submitted';
    }
  };

  const getDocTypeLabel = (value: string) =>
    DOCUMENT_TYPES.find((d) => d.value === value)?.label || value;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Banner */}
      {kyc && (
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(kyc.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(kyc.status) }]} />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: getStatusColor(kyc.status) }]}>
              {getStatusLabel(kyc.status)}
            </Text>
            {kyc.submittedAt && (
              <Text style={styles.statusDate}>
                Submitted {new Date(kyc.submittedAt).toLocaleDateString('en-IN')}
              </Text>
            )}
            {kyc.rejectionReason && (
              <Text style={styles.rejectionReason}>{kyc.rejectionReason}</Text>
            )}
          </View>
        </View>
      )}

      {/* Document Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Document Details</Text>

        {/* Document Type */}
        <Text style={styles.label}>Document Type *</Text>
        <TouchableOpacity
          style={styles.picker}
          onPress={() => setShowTypePicker(!showTypePicker)}
        >
          <Text style={documentType ? styles.pickerText : styles.pickerPlaceholder}>
            {documentType ? getDocTypeLabel(documentType) : 'Select document type'}
          </Text>
          <Ionicons name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={20} color="#6B7280" />
        </TouchableOpacity>

        {showTypePicker && (
          <View style={styles.pickerOptions}>
            {DOCUMENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.pickerOption,
                  documentType === type.value && styles.pickerOptionActive,
                ]}
                onPress={() => {
                  setDocumentType(type.value);
                  setShowTypePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    documentType === type.value && styles.pickerOptionTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Document Number */}
        <Text style={styles.label}>Document Number</Text>
        <TextInput
          style={styles.input}
          value={documentNumber}
          onChangeText={setDocumentNumber}
          placeholder="Enter document number"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
        />

        {/* Document Image */}
        <Text style={styles.label}>Document Photo</Text>
        <TouchableOpacity style={styles.uploadArea} onPress={pickImage} disabled={uploadingImage}>
          {uploadingImage ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : documentUrl ? (
            <Image source={{ uri: documentUrl }} style={styles.uploadedImage} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={40} color="#9CA3AF" />
              <Text style={styles.uploadText}>Tap to upload photo</Text>
              <Text style={styles.uploadHint}>JPG, PNG up to 5MB</Text>
            </>
          )}
        </TouchableOpacity>
        {documentUrl && (
          <TouchableOpacity style={styles.removeImageButton} onPress={() => setDocumentUrl('')}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.removeImageText}>Remove photo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
        <Text style={styles.infoText}>
          Submit a clear photo of your government-issued ID. Verification typically takes 24-48 hours.
          You must be verified to accept deliveries.
        </Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.submitText}>
            {kyc?.status === 'REJECTED' ? 'Resubmit Documents' : 'Submit for Review'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  rejectionReason: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 4,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  pickerText: {
    fontSize: 15,
    color: '#1F2937',
  },
  pickerPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  pickerOptions: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerOptionActive: {
    backgroundColor: '#D1FAE5',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#374151',
  },
  pickerOptionTextActive: {
    color: '#059669',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    minHeight: 140,
  },
  uploadText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
  },
  uploadHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  uploadedImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeImageText: {
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 10,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
