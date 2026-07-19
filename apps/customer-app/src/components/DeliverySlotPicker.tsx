import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { customerApi } from '../lib/api';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface SlotGroup {
  date: string;
  dayName: string;
  slots: Slot[];
}

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  booked: number;
  available: number;
  isPast: boolean;
  date: string;
}

interface Props {
  zoneId?: string;
  selectedSlotId?: string;
  onSelect: (slot: { slotConfigId: string; date: string; timeRange: string }) => void;
}

// 12-hour time display helper
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function DeliverySlotPicker({ zoneId, selectedSlotId, onSelect }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'today' | 'tomorrow'>('today');
  const [groups, setGroups] = useState<{ today: SlotGroup; tomorrow: SlotGroup } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const res: any = await customerApi.getDeliverySlots(zoneId);
      const data = res?.data || res;
      if (data?.today && data?.tomorrow) {
        setGroups(data);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    if (zoneId) load();
    else {
      setLoading(false);
      setError(true);
    }
  }, [zoneId, load]);

  const group = tab === 'today' ? groups?.today : groups?.tomorrow;

  const selectSlot = (slot: Slot) => {
    onSelect({
      slotConfigId: slot.id,
      date: slot.date,
      timeRange: `${slot.startTime}-${slot.endTime}`,
    });
  };

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="small" color={Colors.organic} />
      </View>
    );
  }

  if (error || !groups) {
    return (
      <View style={s.errorWrap}>
        <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
        <Text style={s.errorText}>{t('checkout.deliverySlot.unavailable')}</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Today / Tomorrow tabs */}
      <View style={s.tabRow}>
        {(['today', 'tomorrow'] as const).map((key) => {
          const g = key === 'today' ? groups.today : groups.tomorrow;
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.tab, active && s.tabActive]}
              onPress={() => setTab(key)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>
                {t(`checkout.deliverySlot.${key}`)}
              </Text>
              <Text style={[s.tabDate, active && s.tabDateActive]}>
                {g.dayName}, {g.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Slot chips */}
      <View style={s.slotRow}>
        {group?.slots.length === 0 ? (
          <Text style={s.noSlots}>{t('checkout.deliverySlot.noSlots')}</Text>
        ) : (
          group?.slots.map((slot) => {
            const active = selectedSlotId === slot.id;
            const isFull = slot.available <= 0;
            return (
              <TouchableOpacity
                key={slot.id}
                style={[
                  s.slotChip,
                  active && s.slotChipActive,
                  isFull && s.slotChipFull,
                ]}
                onPress={() => !isFull && selectSlot(slot)}
                disabled={isFull}
                activeOpacity={0.7}
              >
                <Text style={[s.slotTime, active && s.slotTimeActive, isFull && s.slotTimeFull]}>
                  {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
                </Text>
                <Text style={[s.slotAvailability, active && s.slotAvailabilityActive]}>
                  {isFull ? t('checkout.deliverySlot.full') : t('checkout.deliverySlot.available', { n: slot.available })}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  loadingWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  tabActive: {
    borderColor: Colors.organic,
    backgroundColor: Colors.organicLight,
  },
  tabLabel: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.organic,
  },
  tabDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tabDateActive: {
    color: Colors.organic,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  slotChip: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  slotChipActive: {
    borderColor: Colors.organic,
    backgroundColor: Colors.organicLight,
  },
  slotChipFull: {
    opacity: 0.45,
  },
  slotTime: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text,
  },
  slotTimeActive: {
    color: Colors.organic,
  },
  slotTimeFull: {
    color: Colors.textSecondary,
  },
  slotAvailability: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  slotAvailabilityActive: {
    color: Colors.organic,
  },
  noSlots: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
