import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { useTranslation } from 'react-i18next';
import { getStoreAccent } from '../../constants/theme';

export default function AiProductScannerScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { storeType } = useStore();
  const { open: openProduct } = useProductSheet();
  const accent = getStoreAccent(storeType);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const cameraRef = useRef<any>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      const scanResult = await customerApi.scanProduct(photo.uri);
      setResult(scanResult);
    } catch (error) {
      Alert.alert(t('common.error'), t('ai.scanner.error'));
    } finally {
      setScanning(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setScanning(true);
      try {
        const scanResult = await customerApi.scanProduct(result.assets[0].uri);
        setResult(scanResult);
      } catch (error) {
        Alert.alert(t('common.error'), t('ai.scanner.error'));
      } finally {
        setScanning(false);
      }
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#D1D5DB" />
          <Text style={styles.permissionTitle}>{t('ai.scanner.permission.title')}</Text>
          <Text style={styles.permissionText}>
            {t('ai.scanner.permission.description')}
          </Text>
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: accent }]} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>{t('ai.scanner.permission.grant')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Text style={[styles.galleryButtonText, { color: accent }]}>{t('ai.scanner.permission.gallery')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ai.scanner.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          {/* Scan Frame Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft, { borderColor: accent }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: accent }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: accent }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: accent }]} />
            </View>
            <Text style={styles.instructionText}>
              {scanning ? t('ai.scanner.instruction.scanning') : t('ai.scanner.instruction.idle')}
            </Text>
          </View>
        </CameraView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryControl} onPress={pickImage}>
          <Ionicons name="images" size={28} color={accent} />
          <Text style={styles.controlLabel}>{t('ai.scanner.control.gallery')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: accent }, scanning && styles.scanButtonDisabled]}
          onPress={takePicture}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#FFFFFF" size="large" />
          ) : (
            <View style={styles.scanButtonInner} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.flashControl}>
          <Ionicons name="flash" size={28} color={accent} />
          <Text style={styles.controlLabel}>{t('ai.scanner.control.flash')}</Text>
        </TouchableOpacity>
      </View>

      {/* Result Overlay */}
      {result && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setResult(null)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>

            <View style={styles.resultHeader}>
              <View style={styles.confidenceBadge}>
                <Text style={[styles.confidenceText, { color: accent }]}>
                  {t('ai.scanner.confidence', { confidence: Math.round(result.confidence * 100) })}
                </Text>
              </View>
            </View>

            <Text style={styles.productName}>{result.productName}</Text>
            <Text style={styles.productCategory}>{result.category}</Text>

            {result.nutritionalInfo && (
              <View style={styles.nutritionContainer}>
                <Text style={styles.nutritionTitle}>{t('ai.scanner.nutrition')}</Text>
                <View style={styles.nutritionGrid}>
                  {Object.entries(result.nutritionalInfo).map(([key, value]) => (
                    <View key={key} style={styles.nutritionItem}>
                      <Text style={[styles.nutritionValue, { color: accent }]}>{String(value)}</Text>
                      <Text style={styles.nutritionLabel}>{key}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.resultActions}>
              {result.matchedProductId && (
                <TouchableOpacity
                  style={[styles.viewButton, { backgroundColor: accent }]}
                  onPress={() => {
                    const matchedId = result.matchedProductId;
                    setResult(null);
                    openProduct(matchedId);
                  }}
                >
                  <Text style={styles.viewButtonText}>{t('ai.scanner.viewProduct')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => {
                  setResult(null);
                  navigation.navigate('AllProducts', { search: result.productName });
                }}
              >
                <Text style={styles.searchButtonText}>{t('ai.scanner.searchManually')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  galleryButton: {
    marginTop: 12,
  },
  galleryButtonText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 20,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  galleryControl: {
    alignItems: 'center',
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  scanButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  flashControl: {
    alignItems: 'center',
  },
  resultOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  confidenceBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  nutritionContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});
