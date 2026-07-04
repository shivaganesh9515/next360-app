import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../lib/store';
import { useProductSheet } from '../../lib/productSheet';
import { customerApi } from '../../lib/api';
import { Product } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, getStoreAccent } from '../../constants/theme';
import ProductCard from '../../components/ProductCard';

const DEBOUNCE_MS = 350;

export default function SearchScreen({ navigation }: any) {
  const { storeType, addToCart, incrementCart } = useStore();
  const { open: openProduct } = useProductSheet();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const accent = getStoreAccent(storeType);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const runSearch = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await customerApi.getProducts({ search: text.trim(), storeType, limit: 20 });
      setResults(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [storeType]);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), DEBOUNCE_MS);
  };

  const handleQuickAdd = (product: Product) => {
    incrementCart();
    addToCart(product.id, 1).catch(() => {});
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.input}
            value={query}
            onChangeText={onChangeText}
            placeholder="Search products..."
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query)}
          />
          {!!query && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }} hitSlop={8}>
              <Text style={s.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={accent} /></View>
      ) : !searched ? (
        <View style={s.center}>
          <Text style={s.hintEmoji}>🌿</Text>
          <Text style={s.hintText}>Search for organic, natural, or eco-friendly products</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={s.center}>
          <Text style={s.hintEmoji}>🔍</Text>
          <Text style={s.emptyTitle}>No results for "{query}"</Text>
          <Text style={s.hintText}>Try a different keyword or check another store.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.grid}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={(p) => openProduct(p.id)}
              onQuickAdd={handleQuickAdd}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  backIcon: { fontSize: 22, color: Colors.text },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border, height: 46, paddingHorizontal: Spacing.md,
  },
  searchIcon: { fontSize: 15, opacity: 0.5 },
  input: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 0 },
  clearIcon: { fontSize: 14, color: Colors.textSecondary },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  hintEmoji: { fontSize: 40, marginBottom: Spacing.md },
  hintText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },

  grid: { padding: Spacing.lg },
  row: { justifyContent: 'space-between' },
});
