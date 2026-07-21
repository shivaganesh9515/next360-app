import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
  Alert, Platform, StatusBar, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, {
  useAnimatedStyle, useSharedValue, interpolate, interpolateColor, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import PopoverBackdrop from './PopoverBackdrop';
import {
  usePanelAnimation,
  useContentFadeIn, PRESS_SPRING_CONFIG,
} from '../lib/panelAnimation';

const DOCK_SIZE = 44;

interface MenuItem { icon: string; label: string; go: () => void }
interface Props { navigation?: any; active?: boolean }

export default function ProfileAvatarPopover({ navigation, active = false }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const panelWidth = Math.min(420, screenWidth - Spacing.xl * 2);
  const panelHeight = Math.min(550, screenHeight * 1);

  // Opens just above the trigger button — stays low, like a card popping up from the dock
  // We'll compute openTop dynamically inside panelStyle from originY SharedValue

  const { user, signOut } = useAuth();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const animationStarted = useRef(false);

  // Position coordinates on screen
  const originX = useSharedValue(screenWidth - DOCK_SIZE - Spacing.xl);
  const originY = useSharedValue(screenHeight * 0.88);

  const {
    anim, open: animOpen, close: animClose, backdropStyle, triggerGhostStyle,
  } = usePanelAnimation();

  const triggerScale = useSharedValue(1);
  const triggerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
    opacity: interpolate(anim.value, [0, 0.05], [1, 0]),
  }));

  const contentFade = useContentFadeIn(anim);

  useEffect(() => {
    if (visible && !animationStarted.current) {
      animationStarted.current = true;
      requestAnimationFrame(() => {
        animOpen();
        triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
      });
    }
    if (!visible) animationStarted.current = false;
  }, [visible, animOpen]);

  const open = useCallback(() => {
    triggerScale.value = withSpring(0.85, PRESS_SPRING_CONFIG);
    dockRef.current?.measureInWindow((x, y, width, height) => {
      originX.value = x;
      const statusBarOffset = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
      originY.value = y + statusBarOffset;
      setVisible(true);
      setExpanded(true);
    });
  }, []);

  const finishClose = useCallback(() => {
    setExpanded(false);
    setVisible(false);
  }, []);

  const close = useCallback(() => {
    animClose(finishClose);
  }, [animClose, finishClose]);

  /* ── Navigation ── */
  const goTo = useCallback((screen: string) => {
    if (!navigation) return;
    close();
    setTimeout(() => navigation.navigate('Profile', { screen }), 300);
  }, [navigation, close]);

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
        onPress: () => { close(); setTimeout(() => signOut(), 350); },
      },
    ]);
  }, [signOut, close]);

  // Exact same pattern as NotificationsPopover — pops up from the trigger, RIGHT-aligned
  const panelStyle = useAnimatedStyle(() => {
    const width  = interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, panelWidth, panelWidth]);
    const height = interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, panelHeight * 0.4, panelHeight]);

    // Right-align to the trigger button (same as notifications)
    const desiredLeft = originX.value + DOCK_SIZE - panelWidth;
    const openX = Math.max(20, Math.min(screenWidth - panelWidth - 20, desiredLeft));
    const left = interpolate(anim.value, [0, 1], [originX.value, openX]);

    // Open UPWARD from trigger — panel bottom sits just above the navbar
    const openTop = originY.value - panelHeight - 8;
    const clampedTop = Math.max(insets.top + 16, openTop);
    const top = interpolate(anim.value, [0, 1], [originY.value, clampedTop]);

    return {
      left,
      top,
      width,
      height,
      borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
      backgroundColor: interpolateColor(anim.value, [0, 0.3, 1],
        ['rgba(255,255,255,0.14)', 'rgba(250,249,246,0.95)', '#FAF9F6'],
      ),
    };
  }, [screenWidth, screenHeight, panelWidth, panelHeight, insets.top]);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      {/* ── Dock trigger — self-contained ── */}
      <Reanimated.View ref={dockRef} style={[styles.reserve, triggerAnimStyle]} collapsable={false}>
        <TouchableOpacity
          style={[styles.dock, { backgroundColor: active ? '#22FF88' : 'rgba(255,255,255,0.14)' }]}
          activeOpacity={0.75}
          onPress={open}
          hitSlop={8}
        >
          <Text style={[styles.initials, { color: active ? '#0A0A0A' : '#FFFFFF' }]}>
            {initials}
          </Text>
        </TouchableOpacity>
      </Reanimated.View>

      {/* ── Bottom popover Modal ── */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={close}
      >
        {/* Semi-transparent backdrop */}
        <PopoverBackdrop style={backdropStyle} onPress={close} />

        {/* Morphing panel matching Search Popover */}
        <Reanimated.View style={[styles.panel, styles.panelShadow, panelStyle]}>
          {/* Ghost wrap trigger view inside the expanding panel */}
          <Reanimated.View
            style={[styles.ghostWrap, triggerGhostStyle]}
            pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
          >
            <View style={[styles.dock, { backgroundColor: active ? '#22FF88' : 'rgba(255,255,255,0.14)' }]}>
              <Text style={[styles.initials, { color: active ? '#0A0A0A' : '#FFFFFF' }]}>
                {initials}
              </Text>
            </View>
          </Reanimated.View>

          {/* Staggered Content view fade-in */}
          <Reanimated.View
            style={[StyleSheet.absoluteFill, contentFade, { width: panelWidth }]}
            pointerEvents={Platform.OS === 'web' ? undefined : (expanded ? 'auto' : 'none')}
          >
            <View style={{ flex: 1.7, width: panelWidth }}>
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
                <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={10}>
                  <Ionicons name="close" size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>

              {/* ── Menu/Body ── */}
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

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={17} color={Colors.error} />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Next360 v1.0.0</Text>
              </ScrollView>
            </View>
          </Reanimated.View>
        </Reanimated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  reserve: { width: DOCK_SIZE, height: DOCK_SIZE },
  dock: {
    width: DOCK_SIZE, height: DOCK_SIZE,
    borderRadius: DOCK_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.5 },

  ghostWrap: {
    position: 'absolute', top: 0, left: 0, width: DOCK_SIZE, height: DOCK_SIZE,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { pointerEvents: 'none' as any } }),
  },

  panel: { position: 'absolute', overflow: 'hidden' },
  panelShadow: Platform.select({
    web: { boxShadow: '0px 24px 48px rgba(10, 10, 8, 0.28), 0px 4px 12px rgba(10, 10, 8, 0.08)' },
    default: {
      shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.28, shadowRadius: 32, elevation: 20,
    },
  }) as any,

  handle: {
    alignSelf: 'center', marginTop: 14,
    width: 36, height: 4,
    borderRadius: 2, backgroundColor: Colors.border,
    marginBottom: 4,
  },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 40, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 8,
  },
  headerLeft: { flex: 10, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minWidth: 0 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.organic,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.white },
  headerInfo: { flex: 3, minWidth: 0 },
  userName:   { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: Colors.text, lineHeight: 20 },
  userSub:    { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  scroll: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xxl,
  },
  menuCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', marginBottom: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuDivider: { borderBottomWidth: 0 },
  menuLeft:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuIcon: {
    width: 36, height: 36, borderRadius: BorderRadius.md,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { ...Typography.body, fontFamily: 'Inter_500Medium', color: Colors.text },

  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md, marginBottom: Spacing.sm,
  },
  signOutText: { ...Typography.body, fontFamily: 'Inter_600SemiBold', color: Colors.error },
  version: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
