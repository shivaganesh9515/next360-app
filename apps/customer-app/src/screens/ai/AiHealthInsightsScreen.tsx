import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { useTranslation } from 'react-i18next';
import { getStoreAccent } from '../../constants/theme';

interface HealthInsight {
  summary: string;
  tips: string[];
  warnings: string[];
  suggestedProducts: string[];
}

export default function AiHealthInsightsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { storeType } = useStore();
  const accent = getStoreAccent(storeType);
  const [insights, setInsights] = useState<HealthInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const res = await customerApi.getHealthInsights();
      setInsights(res?.data || res);
    } catch (err) {
      console.error('Failed to load health insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
          <Text style={styles.loadingText}>{t('ai.health.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ai.health.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />
        }
      >
        {insights ? (
          <>
            {/* Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="heart" size={24} color={accent} />
              </View>
              <Text style={styles.summaryTitle}>{t('ai.health.wellnessProfile')}</Text>
              <Text style={styles.summaryText}>{insights.summary}</Text>
            </View>

            {/* Tips Section */}
            {insights.tips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('ai.health.section.tips')}</Text>
                {insights.tips.map((tip, index) => (
                  <View key={index} style={styles.insightCard}>
                    <View style={[styles.insightIcon, { backgroundColor: '#D1FAE5' }]}>
                      <Ionicons name="checkmark-circle" size={20} color={accent} />
                    </View>
                    <Text style={styles.insightText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Warnings Section */}
            {insights.warnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('ai.health.section.improvements')}</Text>
                {insights.warnings.map((warning, index) => (
                  <View key={index} style={styles.insightCard}>
                    <View style={[styles.insightIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="alert-circle" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.insightText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Products */}
            {insights.suggestedProducts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('ai.health.section.boost')}</Text>
                <TouchableOpacity
                  style={styles.shopButton}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={[styles.shopButtonText, { color: accent }]}>{t('ai.health.exploreProducts')}</Text>
                  <Ionicons name="arrow-forward" size={16} color={accent} />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>{t('ai.health.empty.title')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('ai.health.empty.subtitle')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});
