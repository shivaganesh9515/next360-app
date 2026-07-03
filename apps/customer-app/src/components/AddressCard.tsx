import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GREEN = '#2A7A4B';

interface AddressCardProps {
  address: {
    id: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    type?: string;
    isDefault?: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
}

export default function AddressCard({ address, isSelected, onSelect }: AddressCardProps) {
  const icon = address.type === 'HOME' ? 'home' : address.type === 'WORK' ? 'briefcase' : 'location';

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.containerSelected]}
      onPress={onSelect}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon as any}
          size={20}
          color={isSelected ? GREEN : '#6B7280'}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.type}>{address.type || 'Other'}</Text>
        <Text style={styles.line1}>{address.line1}</Text>
        {address.line2 && <Text style={styles.line2}>{address.line2}</Text>}
        <Text style={styles.city}>{address.city}, {address.state} {address.pincode}</Text>
      </View>
      {address.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultText}>Default</Text>
        </View>
      )}
      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={24} color={GREEN} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerSelected: {
    borderColor: GREEN,
    backgroundColor: '#F0FDF4',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  line1: {
    fontSize: 14,
    color: '#374151',
  },
  line2: {
    fontSize: 14,
    color: '#374151',
  },
  city: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  defaultBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '500',
    color: GREEN,
  },
  checkmark: {
    marginLeft: 8,
  },
});
