import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../../lib/api';
import { Address } from '../../types';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';
import ErrorState from '../../components/ErrorState';

export default function AddressListScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const onSelect = route.params?.onSelect as ((address: Address) => void) | undefined;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const res: any = await customerApi.getAddresses();
      setAddresses(Array.isArray(res) ? res : res?.data || []);
      setError(false);
    } catch {
      setAddresses([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSetDefault = async (id: string) => {
    try {
      await customerApi.updateAddress(id, { isDefault: true });
      load();
    } catch {
      Alert.alert('Error', 'Could not update default address.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this delivery address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await customerApi.deleteAddress(id);
            load();
          } catch {
            Alert.alert('Error', 'Failed to delete address.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#22FF88" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Top Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          style={s.addHeaderBtn}
          onPress={() => navigation.navigate('AddAddress')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#0A0A0A" />
          <Text style={s.addHeaderBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <ErrorState message="Failed to load saved addresses." onRetry={load} />
      ) : addresses.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIconBox}>
            <Ionicons name="location-outline" size={48} color="#0A0A0A" />
          </View>
          <Text style={s.emptyTitle}>No Saved Addresses</Text>
          <Text style={s.emptySubtitle}>Add your home, office, or family delivery address for quick 1-tap checkout.</Text>
          <TouchableOpacity style={s.addAddressBtn} onPress={() => navigation.navigate('AddAddress')}>
            <Ionicons name="add-circle-outline" size={20} color="#0A0A0A" />
            <Text style={s.addAddressBtnText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => {
            const isHome = item.label?.toLowerCase() === 'home';
            const isWork = item.label?.toLowerCase() === 'work' || item.label?.toLowerCase() === 'office';

            return (
              <TouchableOpacity
                style={s.card}
                activeOpacity={onSelect ? 0.8 : 1}
                onPress={() => {
                  if (onSelect) {
                    onSelect(item);
                    navigation.goBack();
                  }
                }}
              >
                <View style={s.cardTop}>
                  <View style={[s.cardIconBox, { backgroundColor: isHome ? '#E8F5E9' : isWork ? '#E1F5FE' : '#F3E5F5' }]}>
                    <Ionicons
                      name={isHome ? 'home' : isWork ? 'briefcase' : 'location'}
                      size={20}
                      color={isHome ? '#2E7D32' : isWork ? '#0288D1' : '#7B1FA2'}
                    />
                  </View>
                  <View style={s.cardInfo}>
                    <View style={s.cardHeaderRow}>
                      <Text style={s.cardLabel}>{item.label || 'Other'}</Text>
                      {item.isDefault && (
                        <View style={s.defaultBadge}>
                          <Text style={s.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.cardAddressText}>{item.fullAddress}</Text>
                    <Text style={s.cardCityText}>{item.city}, {item.state} - {item.pincode}</Text>
                  </View>
                </View>

                <View style={s.cardActions}>
                  {!item.isDefault && (
                    <TouchableOpacity style={s.actionBtn} onPress={() => handleSetDefault(item.id)} hitSlop={8}>
                      <Ionicons name="checkmark-circle-outline" size={15} color="#2E7D32" />
                      <Text style={[s.actionText, { color: '#2E7D32' }]}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(item.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={15} color="#E53935" />
                    <Text style={[s.actionText, { color: '#E53935' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.text,
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#22FF88',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  addHeaderBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#0A0A0A',
  },

  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22FF88',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: Colors.text },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#757575', textAlign: 'center', marginTop: 6 },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#22FF88',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: Spacing.xl,
  },
  addAddressBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0A0A0A' },

  list: { padding: Spacing.lg },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.md },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardLabel: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.text },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaultBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#2E7D32' },
  cardAddressText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#424242', marginTop: 2, lineHeight: 18 },
  cardCityText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#757575', marginTop: 2 },

  cardActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
