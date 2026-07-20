import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  Alert, Platform, useWindowDimensions, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  useAnimatedStyle, useSharedValue, interpolate, withSpring, runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import { PRESS_SPRING_CONFIG } from '../lib/panelAnimation';

const DOCK_SIZE = 44;
const H_INSET   = 16; // px from each screen edge
const SHEET_OPEN  = { damping: 32, stiffness: 320, mass: 0.9 };
const SHEET_CLOSE = { damping: 28, stiffness: 280, mass: 0.8 };

interface MenuItem { icon: string; label: string; go: () => void }
interface Props { navigation?: any; active?: boolean }

export default function ProfileAvatarPopover({ navigation, active = false }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sheetWidth  = screenWidth - H_INSET * 2;          // full width - 16 each side
  const sheetHeight = Math.min(screenHeight * 0.72, 580);  // generous height
  const sheetBottom = insets.bottom + 90;                  // sits above the navbar

  const { user, signOut } = useAuth();

  // Two-phase visibility: Modal mounts first (visible=true), THEN we spring in
  const [visible,  setVisible]  = useState(false);
  const [mounted,  setMounted]  = useState(false); // true after Modal onShow fires

  const sheetAnim    = useSharedValue(0); // 0 = off-screen-below, 1 = resting
  const triggerScale = useSharedValue(1);

  /* ── Trigger press feedback ── */
  const onDockPress = useCallback(() => {
    triggerScale.value = withSpring(0.82, PRESS_SPRING_CONFIG);
    setVisible(true); // mount the Modal
  }, []);

  /* ── When Modal is shown (onShow = after native layer draws it) → spring in ── */
  useEffect(() => {
    if (mounted) {
      sheetAnim.value = 0; // ensure starting position
      sheetAnim.value = withSpring(1, SHEET_OPEN);
      triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
    }
  }, [mounted]);

  /* ── Close ── */
  const closeSheet = useCallback(() => {
    sheetAnim.value = withSpring(0, SHEET_CLOSE, (done) => {
      if (done) {
        runOnJS(setMounted)(false);
        runOnJS(setVisible)(false);
      }
    });
  }, []);

  /* ── Animated styles ── */
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sheetAnim.value, [0, 1], [0, 1]),
  }));

  // Sheet translates from off-screen bottom → resting position
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(sheetAnim.value, [0, 1], [sheetHeight + 60, 0]),
    }],
  }));

  const triggerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));

  /* ── Navigation ── */
  const goTo = useCallback((screen: string) => {
    if (!navigation) return;
    closeSheet();
    setTimeout(() => navigation.navigate('Profile', { screen }), 300);
  }, [navigation, closeSheet]);

  const menuItems: MenuItem[] = [
    { icon: 'person-outline',        label: 'Edit Profile',     go: () => goTo('EditProfile') },
    { icon: 'receipt-outline',        label: 'My Orders',        go: () => goTo('OrderHistory') },
    { icon: 'pricetag-outline',       label: 'Offers & Coupons', go: () => goTo('Promos') },
    { icon: 'location-outline',       label: 'My Addresses',     go: () => goTo('AddressList') },
    { icon: 'notifications-outline',  label: 'Notifications',    go: () => goTo('Notifications') },
    { icon: 'gift-outline',           label: 'Referral',         go: () => goTo('Referral') },
    { icon: 'help-circle-outline',    label: 'Support',          go: () => goTo('Support') },
  ];

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => { closeSheet(); setTimeout(() => signOut(), 350); },
      },
    ]);
  }, [signOut, closeSheet]);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      {/* ── Dock trigger — self-contained ── */}
      <Reanimated.View collapsable={false} style={triggerStyle}>
        <TouchableOpacity
          style={[styles.dock, { backgroundColor: active ? '#22FF88' : 'rgba(255,255,255,0.14)' }]}
          activeOpacity={0.75}
          onPress={onDockPress}
          hitSlop={8}
        >
          <Text style={[styles.initials, { color: active ? '#0A0A0A' : '#FFFFFF' }]}>
            {initials}
          </Text>
        </TouchableOpacity>
      </Reanimated.View>

      {/* ── Bottom sheet Modal ── */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSheet}
        onShow={() => setMounted(true)}  // ← fires AFTER native layer draws the Modal
      >
        {/* Semi-transparent backdrop — tap to dismiss */}
        <Reanimated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Reanimated.View>

        {/* Sheet: absolute positioned, equal H_INSET on both sides */}
        <Reanimated.View
          style={[
            styles.sheet,
            {
              width: sheetWidth,
              height: sheetHeight,
              left: H_INSET,
              bottom: sheetBottom,
            },
            sheetStyle,
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
                <Text style={styles.userSub} numberOfLines={1}>
                  {user?.phone ? `+91 ${user.phone}` : (user?.email || '')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeSheet} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={18} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* ── Menu ── */}
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.menuCard}>
              {menuItems.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuRow, i < menuItems.length - 1 && styles.menuDivider]}
                  onPress={item.go}
                  activeOpacity={0.6}
                >
                  <View style={styles.menuLeft}>
                    <View style={styles.menuIcon}>
                      <Ionicons name={item.icon as any} size={17} color={Colors.textSecondary} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={Colors.border} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={17} color={Colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Next360 v1.0.0</Text>
          </ScrollView>
        </Reanimated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dock: {
    width: DOCK_SIZE, height: DOCK_SIZE,
    borderRadius: DOCK_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.5 },

  backdrop: { backgroundColor: 'rgba(10,10,10,0.60)' },

  sheet: {
    position: 'absolute',
    backgroundColor: '#FAF9F6',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web:     { boxShadow: '0px -8px 48px rgba(10,10,8,0.22), 0px 0px 0px 1px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#0A0A08',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.20,
        shadowRadius: 28,
        elevation: 30,
      },
    }),
  },

  handle: {
    alignSelf: 'center', marginTop: 10,
    width: 36, height: 4,
    borderRadius: 2, backgroundColor: Colors.border,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minWidth: 0 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.organic,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.white },
  headerInfo: { flex: 1, minWidth: 0 },
  userName:   { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text, lineHeight: 20 },
  userSub:    { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  scroll: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xl,
  },
  menuCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    overflow: 'hidden', marginBottom: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: Spacing.lg,
  },
  menuDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  menuLeft:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...Typography.body, color: Colors.text },

  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.lg, paddingVertical: 14,
    marginBottom: Spacing.sm,
  },
  signOutText: { ...Typography.button, color: Colors.error },
  version: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
});
