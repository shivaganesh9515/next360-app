import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TextInput, Platform,
  Alert, ActivityIndicator, StatusBar, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  useAnimatedStyle, useSharedValue, interpolate, interpolateColor, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useZone } from '../lib/zone';
import PopoverBackdrop from './PopoverBackdrop';
import { SERVICEABLE_ZONES, isServiceableCity } from '../constants/zones';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import {
  usePanelAnimation,
  useContentFadeIn, PRESS_SPRING_CONFIG,
} from '../lib/panelAnimation';

// PANEL dimensions are calculated dynamically using useWindowDimensions inside the component.

type Row = { city: string; locality: string };

interface Props {
  accent?: string;
}

export default function LocationPopover({ accent = Colors.organic }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const panelWidth = Math.min(500, screenWidth - Spacing.xl * 2);
  const panelHeight = Math.min(650, screenHeight * 2);

  const insets = useSafeAreaInsets();
  const safeTop = Platform.OS === 'web' ? 12 : (insets.top > 0 ? insets.top + 45 : 90);

  const { city, locality, setZone } = useZone();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCityTab, setSelectedCityTab] = useState<'All' | 'Hyderabad' | 'Vijayawada'>('All');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [notified, setNotified] = useState(false);

  // ── SharedValues for trigger position ──
  // Location pill is at top-left, wider than icon docks.
  const originX = useSharedValue(Spacing.xl);
  const originY = useSharedValue(60);
  const originW = useSharedValue(120);
  const originH = useSharedValue(40);

  // ── Trigger press scale ──
  const triggerScale = useSharedValue(1);

  const {
    anim, open: animOpen, close: animClose, backdropStyle, triggerGhostStyle,
  } = usePanelAnimation();

  const triggerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
    opacity: interpolate(anim.value, [0, 0.05], [1, 0]),
  }));

  const contentFade = useContentFadeIn(anim);

  // ── Start spring ONLY after Modal is committed ──
  const animationStarted = useRef(false);
  useEffect(() => {
    if (visible && !animationStarted.current) {
      animationStarted.current = true;
      requestAnimationFrame(() => {
        animOpen();
        triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
      });
    }
    if (!visible) {
      animationStarted.current = false;
    }
  }, [visible, animOpen]);

  const allRows: Row[] = useMemo(
    () => SERVICEABLE_ZONES.flatMap((zone) => zone.localities.map((loc) => ({ city: zone.city, locality: loc }))),
    [],
  );

  const results = useMemo(() => {
    let list = allRows;
    if (selectedCityTab !== 'All') {
      list = allRows.filter((r) => r.city === selectedCityTab);
    }
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((r) => r.city.toLowerCase().includes(q) || r.locality.toLowerCase().includes(q));
  }, [query, allRows, selectedCityTab]);

  const showOutOfZoneNotice = query.trim().length > 2 && results.length === 0 && !isServiceableCity(query);

  const handleUseGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission in your settings to use this feature.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = loc.coords;
      const geo = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
      if (geo && geo.length > 0) {
        const gCity = geo[0].city || geo[0].subregion || '';
        const gDistrict = geo[0].district || geo[0].name || '';
        
        // Match city
        const matchedZone = SERVICEABLE_ZONES.find(
          (z) => z.city.toLowerCase() === gCity.toLowerCase() || gCity.toLowerCase().includes(z.city.toLowerCase())
        );
        if (matchedZone) {
          // Find locality match or default to first
          const matchedLocality = matchedZone.localities.find(
            (l) => l.toLowerCase() === gDistrict.toLowerCase() || gDistrict.toLowerCase().includes(l.toLowerCase())
          ) || matchedZone.localities[0];
          
          await setZone(matchedZone.city, matchedLocality);
          close();
        } else {
          Alert.alert('Out of Service Area', `We detected your location as "${gCity || 'Unknown'}". Next360 is currently only available in Hyderabad and Vijayawada.`);
        }
      } else {
        Alert.alert('Location Error', 'Unable to resolve your city address.');
      }
    } catch (error) {
      Alert.alert('Location Error', 'Failed to retrieve your current location.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleNotifyMe = () => {
    setNotified(true);
    Alert.alert('Subscribed!', "Thank you! We'll notify you once we launch in your area.");
  };

  const open = useCallback(() => {
    triggerScale.value = withSpring(0.92, PRESS_SPRING_CONFIG);
    dockRef.current?.measureInWindow((x, y, width, height) => {
      console.log('[DEBUG] LocationPopover measured:', { x, y, width, height, OS: Platform.OS });
      originX.value = x;
      const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
      originY.value = y + statusBarOffset;
      originW.value = width;
      originH.value = height;
      setTimeout(() => {
        setVisible(true);
        setExpanded(true);
      }, 50);
    });
  }, []);

  const finishClose = useCallback(() => {
    setExpanded(false);
    setVisible(false);
    setQuery('');
    setSelectedCityTab('All');
    setNotified(false);
  }, []);

  const close = useCallback(() => {
    animClose(finishClose);
  }, [animClose]);

  const handleSelect = useCallback(async (row: Row) => {
    await setZone(row.city, row.locality);
    close();
  }, [setZone, close]);

  // ── Panel anchored at trigger position ──
  // Read from SharedValues so the worklet always gets the latest position.
  const panelStyle = useAnimatedStyle(() => {
    const width = interpolate(anim.value, [0, 0.4, 1], [originW.value, panelWidth, panelWidth]);
    const height = interpolate(anim.value, [0, 0.4, 1], [originH.value, panelHeight * 0.4, panelHeight]);
    const desiredLeft = (originX.value + originW.value / 2) - panelWidth / 2;
    const openX = Math.max(20, Math.min(screenWidth - panelWidth - 20, desiredLeft));
    const left = interpolate(anim.value, [0, 1], [originX.value, openX]);
    const top = interpolate(anim.value, [0, 1], [originY.value, safeTop]);
    return {
      left,
      top,
      width,
      height,
      borderRadius: interpolate(anim.value, [0, 1], [BorderRadius.md, BorderRadius.xl]),
      backgroundColor: interpolateColor(anim.value, [0, 0.3, 1],
        ['rgba(255,255,255,0)', 'rgba(250,249,246,0.95)', '#FAF9F6'],
      ),
    };
  }, [safeTop, screenWidth, screenHeight, panelWidth, panelHeight]);

  const ghostStyle = useAnimatedStyle(() => ({
    left: 0,
    top: 0,
    width: originW.value,
    height: originH.value,
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

        <Reanimated.View style={[styles.panel, styles.panelShadow, panelStyle]}>
          <Reanimated.View
            style={[styles.triggerGhost, triggerGhostStyle, ghostStyle]}
            pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
          >
            <Text style={styles.triggerLabel}>Delivery to</Text>
            <View style={styles.triggerRow}>
              <Ionicons name="location" size={12} color={accent} />
              <Text style={styles.triggerName} numberOfLines={1}>{currentLabel}</Text>
              <Ionicons name="chevron-down" size={13} color="rgba(255,255,255,0.6)" />
            </View>
          </Reanimated.View>

          <Reanimated.View
            style={[StyleSheet.absoluteFill, contentFade]}
            pointerEvents={Platform.OS === 'web' ? undefined : (expanded ? 'auto' : 'none')}
          >
            <View style={Platform.OS === 'web' ? { flex: 1, pointerEvents: expanded ? 'auto' : 'none' as any } : { flex: 1 }}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Select Delivery Location</Text>
                <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={8}>
                  <Ionicons name="close" size={20} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBar}>
                <Ionicons name="search" size={22} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search city or area..."
                  placeholderTextColor={Colors.textSecondary}
                  underlineColorAndroid="transparent"
                  autoFocus={expanded}
                />
                {query.trim().length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* City Filter Pills */}
              {!query.trim() && (
                <View style={styles.pillsContainer}>
                  {(['All', 'Hyderabad', 'Vijayawada'] as const).map((tab) => {
                    const isActive = selectedCityTab === tab;
                    return (
                      <TouchableOpacity
                        key={tab}
                        style={[styles.pill, isActive && styles.pillActive]}
                        onPress={() => setSelectedCityTab(tab)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                          {tab}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Use Current Location Action */}
              {!query.trim() && (
                <TouchableOpacity
                  style={styles.gpsButton}
                  onPress={handleUseGPS}
                  disabled={gpsLoading}
                  activeOpacity={0.7}
                >
                  {gpsLoading ? (
                    <ActivityIndicator size="small" color={Colors.organic} />
                  ) : (
                    <Ionicons name="compass-outline" size={16} color={Colors.organic} />
                  )}
                  <Text style={styles.gpsText}>
                    {gpsLoading ? 'Detecting location...' : 'Use Current Location (GPS)'}
                  </Text>
                </TouchableOpacity>
              )}

              {showOutOfZoneNotice ? (
                <View style={styles.blockCard}>
                  <Ionicons name="alert-circle-outline" size={32} color={Colors.textSecondary} />
                  <Text style={styles.blockTitle}>We're not in your area yet</Text>
                  <Text style={styles.blockText}>
                    Next360 currently delivers only in Hyderabad and Vijayawada. We're working on
                    expanding to more cities soon.
                  </Text>
                  <TouchableOpacity
                    style={styles.notifyBtn}
                    onPress={handleNotifyMe}
                    disabled={notified}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.notifyBtnText}>
                      {notified ? 'Notified!' : 'Notify me when available'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(item) => `${item.city}-${item.locality}`}
                  contentContainerStyle={styles.list}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={!query.trim() ? <Text style={styles.sectionLabel}>Serviceable areas</Text> : null}
                  renderItem={({ item }) => {
                    const isSelected = item.locality === locality && item.city === city;
                    return (
                      <TouchableOpacity
                        style={[styles.row, isSelected && styles.rowActive]}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.6}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'location-outline'}
                          size={16}
                          color={isSelected ? Colors.organic : Colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowLocality, isSelected && styles.rowLocalityActive]}>
                            {item.locality}
                          </Text>
                          <Text style={[styles.rowCity, isSelected && styles.rowCityActive]}>
                            {item.city}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>
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
  panelShadow: Platform.select({
    web: { boxShadow: '0px 24px 48px rgba(10, 10, 8, 0.28), 0px 4px 12px rgba(10, 10, 8, 0.08)' },
    default: {
      shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.28, shadowRadius: 32, elevation: 20,
    },
  }) as any,
  triggerGhost: {
    position: 'absolute',
    alignItems: 'center', justifyContent: 'center', gap: 3,
    ...Platform.select({ web: { pointerEvents: 'none' as any } }),
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: BorderRadius.md,
    height: 44, paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: {
    flex: 1, ...Typography.body, color: Colors.text, padding: 0,
    borderWidth: 0, outlineStyle: 'none' as any, outlineWidth: 0,
  },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  sectionLabel: { ...Typography.bodySmall, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  rowLocality: { ...Typography.body, color: Colors.text },
  rowCity: { ...Typography.bodySmall, color: Colors.textSecondary },

  blockCard: {
    marginHorizontal: Spacing.lg, alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm,
  },
  blockTitle: { ...Typography.h3, color: Colors.text, textAlign: 'center' },
  blockText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },

  pillsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FAF9F6',
  },
  pillActive: {
    backgroundColor: Colors.organic,
    borderColor: Colors.organic,
  },
  pillText: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: Colors.white,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.organic,
    borderStyle: 'dashed' as any,
    backgroundColor: 'rgba(92,107,77,0.04)',
  },
  gpsText: {
    ...Typography.bodySmall,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.organic,
  },
  rowActive: {
    backgroundColor: Colors.organicLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 0,
  },
  rowLocalityActive: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.organicDark,
  },
  rowCityActive: {
    color: 'rgba(92, 107, 77, 0.8)',
    fontFamily: 'Inter_600SemiBold',
  },
  notifyBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.organic,
  },
  notifyBtnText: {
    ...Typography.button,
    color: Colors.white,
  },
});
