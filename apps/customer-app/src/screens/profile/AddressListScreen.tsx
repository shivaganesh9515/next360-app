import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { customerApi } from '../../lib/api';
import { Address } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import ErrorState from '../../components/ErrorState';

export default function AddressListScreen({ navigation, route }: any) {
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
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await customerApi.deleteAddress(id);
            load();
          } catch {
            Alert.alert('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.organic} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Addresses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddAddress')} hitSlop={8}>
          <Ionicons name="add-circle" size={26} color={Colors.organic} />
        </TouchableOpacity>
      </View>

      {error ? (
        <ErrorState message="Couldn't load your addresses" onRetry={load} />
      ) : addresses.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="location-outline" size={64} color={Colors.border} />
          <Text style={s.emptyTitle}>No addresses yet</Text>
          <Text style={s.emptySubtitle}>Add your first delivery address.</Text>
          <TouchableOpacity style={s.addButton} onPress={() => navigation.navigate('AddAddress')}>
            <Text style={s.addButtonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
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
                <View style={s.cardIcon}>
                  <Ionicons
                    name={item.label === 'Home' ? 'home' : item.label === 'Work' ? 'briefcase' : 'location'}
                    size={18}
                    color={Colors.organic}
                  />
                </View>
                <View style={s.cardInfo}>
                  <View style={s.cardHeaderRow}>
                    <Text style={s.cardLabel}>{item.label || 'Address'}</Text>
                    {item.isDefault && (
                      <View style={s.defaultBadge}><Text style={s.defaultBadgeText}>Default</Text></View>
                    )}
                  </View>
                  <Text style={s.cardText}>{item.fullAddress}</Text>
                  <Text style={s.cardText}>{item.city}, {item.state} - {item.pincode}</Text>
                </View>
              </View>

              <View style={s.cardActions}>
                {!item.isDefault && (
                  <TouchableOpacity onPress={() => handleSetDefault(item.id)} hitSlop={8}>
                    <Text style={s.actionText}>Set as default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(item.id)} hitSlop={8}>
                  <Text style={[s.actionText, { color: Colors.error }]}>Delete</Text>
                </TouchableOpacity>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },

  emptyTitle: { ...Typography.h3, color: Colors.text, marginTop: Spacing.lg },
  emptySubtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
  addButton: {
    backgroundColor: Colors.organic, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md, marginTop: Spacing.xl,
  },
  addButtonText: { ...Typography.button, color: Colors.white },

  list: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  cardTop: { flexDirection: 'row', gap: Spacing.md },
  cardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.organicLight,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardLabel: { ...Typography.h3, color: Colors.text },
  defaultBadge: {
    backgroundColor: Colors.organicLight, borderRadius: BorderRadius.pill,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  defaultBadgeText: { ...Typography.caption, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
  cardText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  cardActions: {
    flexDirection: 'row', gap: 20, marginTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm,
  },
  actionText: { ...Typography.bodySmall, color: Colors.organic, fontFamily: 'Inter_600SemiBold' },
});
