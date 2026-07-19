import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useZone } from '../../lib/zone';
import { SERVICEABLE_ZONES, isServiceableCity } from '../../constants/zones';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

type Row = { city: string; locality: string };

export default function SelectLocationScreen({ navigation, mandatory }: any) {
  const { t } = useTranslation();
  const { setZone } = useZone();
  const [query, setQuery] = useState('');

  const allRows: Row[] = useMemo(
    () => SERVICEABLE_ZONES.flatMap((zone) => zone.localities.map((locality) => ({ city: zone.city, locality }))),
    [],
  );

  const results = useMemo(() => {
    if (!query.trim()) return allRows;
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => r.city.toLowerCase().includes(q) || r.locality.toLowerCase().includes(q));
  }, [query, allRows]);

  const showOutOfZoneNotice = query.trim().length > 2 && results.length === 0 && !isServiceableCity(query);

  const handleSelect = async (row: Row) => {
    await setZone(row.city, row.locality);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        {!mandatory && (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={s.headerTitle}>
          {mandatory ? t('location.title.mandatory') : t('location.title.optional')}
        </Text>
      </View>

      <View style={s.searchBar}>
        <Text style={s.searchIcon}>📍</Text>
        <TextInput
          style={s.input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('location.placeholder')}
          placeholderTextColor={Colors.textSecondary}
          autoFocus
        />
      </View>

      {showOutOfZoneNotice ? (
        <View style={s.blockCard}>
          <Text style={s.blockEmoji}>🚧</Text>
          <Text style={s.blockTitle}>{t('location.blocked.title')}</Text>
          <Text style={s.blockText}>
            {t('location.blocked.text')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.city}-${item.locality}`}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            !query.trim() ? <Text style={s.sectionLabel}>{t('location.section.serviceable')}</Text> : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={s.row} onPress={() => handleSelect(item)}>
              <Text style={s.rowIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLocality}>{item.locality}</Text>
                <Text style={s.rowCity}>{item.city}</Text>
              </View>
            </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backIcon: { fontSize: 22, color: Colors.text },
  headerTitle: { ...Typography.h3, color: Colors.text },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border,
    marginHorizontal: Spacing.lg, height: 48, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg,
  },
  searchIcon: { fontSize: 15 },
  input: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 0 },

  list: { paddingHorizontal: Spacing.lg },
  sectionLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowIcon: { fontSize: 16 },
  rowLocality: { ...Typography.body, color: Colors.text },
  rowCity: { ...Typography.caption, color: Colors.textSecondary },

  blockCard: {
    marginHorizontal: Spacing.lg, alignItems: 'center', paddingVertical: Spacing.xxxl,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  blockEmoji: { fontSize: 40, marginBottom: Spacing.md },
  blockTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  blockText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
