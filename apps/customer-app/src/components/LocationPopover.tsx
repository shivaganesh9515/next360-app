import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, Dimensions,
} from 'react-native';
import Reanimated, {
  useAnimatedStyle, useSharedValue, interpolate, interpolateColor, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useZone } from '../lib/zone';
import PopoverBackdrop from './PopoverBackdrop';
import { SERVICEABLE_ZONES, isServiceableCity } from '../constants/zones';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import {
  usePanelAnimation, PanelOrigin, StaggeredItem,
  useBodyStaggerStyle, useHeaderStaggerStyle, PRESS_SPRING_CONFIG,
} from '../lib/panelAnimation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const PANEL_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.6;

type Row = { city: string; locality: string };

interface Props {
  accent?: string;
}

export default function LocationPopover({ accent = Colors.organic }: Props) {
  const { city, locality, setZone } = useZone();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<PanelOrigin>({ x: Spacing.xl, y: 60, width: 120, height: 40 });

  // ── Trigger press scale ──
  const triggerScale = useSharedValue(1);
  const triggerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));

  const {
    anim, open: animOpen, close: animClose, backdropStyle, triggerGhostStyle,
  } = usePanelAnimation();

  const headerStyle = useHeaderStaggerStyle(anim);
  const bodyStyle = useBodyStaggerStyle(anim);

  const allRows: Row[] = useMemo(
    () => SERVICEABLE_ZONES.flatMap((zone) => zone.localities.map((loc) => ({ city: zone.city, locality: loc }))),
    [],
  );

  const results = useMemo(() => {
    if (!query.trim()) return allRows;
    const q = query.trim().toLowerCase();
    return allRows.filter((r) => r.city.toLowerCase().includes(q) || r.locality.toLowerCase().includes(q));
  }, [query, allRows]);

  const showOutOfZoneNotice = query.trim().length > 2 && results.length === 0 && !isServiceableCity(query);

  const open = useCallback(() => {
    triggerScale.value = withSpring(0.92, PRESS_SPRING_CONFIG);
    dockRef.current?.measureInWindow((x, y, width, height) => {
      const o: PanelOrigin = { x, y, width, height };
      setOrigin(o);
      setVisible(true);
      setExpanded(true);
      requestAnimationFrame(() => {
        animOpen(o);
        triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
      });
    });
  }, [animOpen]);

  const finishClose = useCallback(() => {
    setExpanded(false);
    setVisible(false);
    setQuery('');
  }, []);

  const close = useCallback(() => {
    animClose(finishClose);
  }, [animClose]);

  const handleSelect = useCallback(async (row: Row) => {
    await setZone(row.city, row.locality);
    close();
  }, [setZone, close]);

  // ── Panel position style (anchored to trigger initially, settles at a fixed y) ──
  const panelPositionStyle = useAnimatedStyle(() => ({
    left: Spacing.xl,
    right: Spacing.xl,
    top: interpolate(anim.value, [0, 1], [origin.y, 100]),
  }));

  // ── Panel width/height style for the expand-in-place effect ──
  const panelSizeStyle = useAnimatedStyle(() => ({
    width: interpolate(anim.value, [0, 0.4, 1], [origin.width, PANEL_WIDTH, PANEL_WIDTH]),
    height: interpolate(anim.value, [0, 0.4, 1], [origin.height, origin.height * 2, PANEL_HEIGHT]),
    borderRadius: interpolate(anim.value, [0, 1], [BorderRadius.md, BorderRadius.xl]),
    backgroundColor: interpolateColor(anim.value, [0, 0.3, 1],
      ['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', Colors.white],
    ),
  }));

  const currentLabel = locality || city || 'Select location';

  return (
    <>
      <Reanimated.View ref={dockRef} collapsable={false} style={triggerAnimStyle}>
        <TouchableOpacity
          style={styles.trigger}
          activeOpacity={1}
          onPress={open}
        >
          <Text style={styles.triggerLabel}>Delivery to</Text>
          <View style={styles.triggerRow}>
            <Ionicons name="location" size={12} color={accent} />
            <Text style={styles.triggerName} numberOfLines={1}>{currentLabel}</Text>
            <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.6)" />
          </View>
        </TouchableOpacity>
      </Reanimated.View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <PopoverBackdrop style={backdropStyle} onPress={close} />

        <Reanimated.View style={[styles.panel, styles.panelShadow, panelSizeStyle, panelPositionStyle]}>
          {/* Trigger ghost — fades out as panel opens */}
          <Reanimated.View style={[styles.triggerGhost, triggerGhostStyle, { pointerEvents: 'none' }]}>
            <Text style={styles.triggerLabel}>Delivery to</Text>
            <View style={styles.triggerRow}>
              <Ionicons name="location" size={12} color={accent} />
              <Text style={styles.triggerName} numberOfLines={1}>{currentLabel}</Text>
              <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.6)" />
            </View>
          </Reanimated.View>

          {/* Content — staggers in */}
          <Reanimated.View style={[StyleSheet.absoluteFill, bodyStyle, { pointerEvents: expanded ? 'auto' : 'none' }]}>
            <Reanimated.View style={headerStyle}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Delivery Location</Text>
                <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={8}>
                  <Ionicons name="close" size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </Reanimated.View>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search city or area..."
                placeholderTextColor={Colors.textSecondary}
                underlineColorAndroid="transparent"
                autoFocus={expanded}
              />
            </View>

            {showOutOfZoneNotice ? (
              <View style={styles.blockCard}>
                <Ionicons name="alert-circle-outline" size={32} color={Colors.textSecondary} />
                <Text style={styles.blockTitle}>We're not in your area yet</Text>
                <Text style={styles.blockText}>
                  Next360 currently delivers only in Hyderabad and Vijayawada. We're working on
                  expanding to more cities soon.
                </Text>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => `${item.city}-${item.locality}`}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={!query.trim() ? <Text style={styles.sectionLabel}>Serviceable areas</Text> : null}
                renderItem={({ item, index }) => (
                  <StaggeredItem anim={anim} index={index}>
                    <TouchableOpacity style={styles.row} onPress={() => handleSelect(item)} activeOpacity={0.6}>
                      <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowLocality}>{item.locality}</Text>
                        <Text style={styles.rowCity}>{item.city}</Text>
                      </View>
                    </TouchableOpacity>
                  </StaggeredItem>
                )}
              />
            )}
          </Reanimated.View>
        </Reanimated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { alignItems: 'center', gap: 3 },
  triggerLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.6)' },
  triggerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  triggerName: { ...Typography.bodySmall, color: Colors.white, fontFamily: 'Inter_600SemiBold', maxWidth: 160 },

  panel: { position: 'absolute', overflow: 'hidden' },
  panelShadow: {
    shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 24,
  },
  triggerGhost: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.background, borderRadius: BorderRadius.md,
    height: 44, paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1, ...Typography.body, color: Colors.text, padding: 0,
    borderWidth: 0, outlineStyle: 'none' as any, outlineWidth: 0,
  },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  sectionLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowLocality: { ...Typography.body, color: Colors.text },
  rowCity: { ...Typography.caption, color: Colors.textSecondary },

  blockCard: {
    marginHorizontal: Spacing.lg, alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm,
  },
  blockTitle: { ...Typography.h3, color: Colors.text },
  blockText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
