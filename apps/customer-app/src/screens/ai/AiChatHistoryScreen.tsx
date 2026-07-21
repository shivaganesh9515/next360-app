import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { customerApi } from '../../lib/api';
import { useStore } from '../../lib/store';
import { useTranslation } from 'react-i18next';
import { getStoreAccent } from '../../constants/theme';

export default function AiChatHistoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { storeType } = useStore();
  const accent = getStoreAccent(storeType);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (pageNum: number = 1) => {
    try {
      const res = await customerApi.getChatHistory(pageNum, 20);
      const data = res?.data || res;
      if (pageNum === 1) {
        setHistory(data.messages || []);
      } else {
        setHistory(prev => [...prev, ...(data.messages || [])]);
      }
      setHasMore(pageNum < data.totalPages);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHistory(nextPage);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadHistory(1);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group messages by date
  const groupedHistory = history.reduce((groups: any[], item) => {
    const date = formatDate(item.createdAt);
    const existingGroup = groups.find(g => g.date === date);
    if (existingGroup) {
      existingGroup.items.push(item);
    } else {
      groups.push({ date, items: [item] });
    }
    return groups;
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
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
        <Text style={styles.headerTitle}>{t('ai.chatHistory.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>{t('ai.chatHistory.empty.title')}</Text>
          <Text style={styles.emptySubtitle}>{t('ai.chatHistory.empty.subtitle')}</Text>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: accent }]}
            onPress={() => navigation.navigate('AiAssistant')}
          >
            <Text style={styles.startButtonText}>{t('ai.chatHistory.startChat')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groupedHistory}
          keyExtractor={(item) => item.date}
          renderItem={({ item: group }) => (
            <View style={styles.dateGroup}>
              <Text style={styles.dateLabel}>{group.date}</Text>
              {group.items.map((chat: any) => (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.chatCard}
                  onPress={() => navigation.navigate('AiAssistant', { chatId: chat.id })}
                >
                  <View style={styles.chatIcon}>
                    <Ionicons name="sparkles" size={20} color={accent} />
                  </View>
                  <View style={styles.chatContent}>
                    <Text style={styles.chatInput} numberOfLines={1}>{chat.input}</Text>
                    <Text style={styles.chatOutput} numberOfLines={2}>{chat.output}</Text>
                    <Text style={styles.chatTime}>{formatTime(chat.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator color={accent} style={styles.footerLoader} />
            ) : null
          }
        />
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  },
  startButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  chatOutput: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  chatTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footerLoader: {
    paddingVertical: 20,
  },
});
