import React, { useEffect, useState, useCallback, useRef } from 'react';
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

// TRANSITION: spring, bounce: 0.1, duration: 0.4
const TRANSITION_SPRING = { damping: 20, stiffness: 220, mass: 0.5 };

interface MenuItem { icon: string; label: string; go: () => void }
interface Props { navigation?: any; active?: boolean }

export default function ProfileAvatarPopover({ navigation, active = false }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const dockRef = useRef<View>(null);

  const sheetWidth  = screenWidth - H_INSET * 2;
  const sheetHeight = Math.min(screenHeight * 0.72, 580);
  const sheetBottom = insets.bottom + 90; // Sits above bottom navbar

  const { user, signOut } = useAuth();

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const panelAnim = useSharedValue(0); // 0 = hidden, 1 = visible
  const triggerScale = useSharedValue(1);

  // Position of trigger button relative to the viewport
  const [triggerRect, setTriggerRect] = useState({ x: 0, y: 0, width: DOCK_SIZE, height: DOCK_SIZE });

  /* ── Open ── */
  const onDockPress = useCallback(() => {
    triggerScale.value = withSpring(0.95, PRESS_SPRING_CONFIG);
    dockRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerRect({ x, y, width, height });
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    if (mounted) {
      panelAnim.value = withSpring(1, TRANSITION_SPRING);
      triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
    }
  }, [mounted]);

  /* ── Close ── */
  const closeSheet = useCallback(() => {
    panelAnim.value = withSpring(0, TRANSITION_SPRING, (done) => {
      if (done) {
        runOnJS(setMounted)(false);
        runOnJS(setVisible)(false);
      }
    });
  }, []);

  /* ── Animated styles matching Framer Motion's structure ── */
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(panelAnim.value, [0, 1], [0, 1]),
  }));

  // Mimicking:
  // left: triggerRect ? triggerRect.left : "50%"
  // top: triggerRect ? triggerRect.bottom + 8 : "50%"
  // transformOrigin: "top left"
  // variants: { hidden: { opacity: 0, scale: 0.9, y: 10 }, visible: { opacity: 1, scale: 1, y: 0 } }
  const panelStyle = useAnimatedStyle(() => {
    // We anchor it cleanly with the layout parameters (left, bottom) 
    // and interpolate the transform origin from the trigger point.
    const originX = triggerRect.x + triggerRect.width / 2;
    const originY = triggerRect.y + triggerRect.height / 2;
    
    // Position of the sheet center
    const sheetCenterX = H_INSET + sheetWidth / 2;
    const sheetCenterY = screenHeight - sheetBottom - (sheetHeight / 2);

    // Delta between center of trigger and center of sheet
    const dx = originX - sheetCenterX;
    const dy = originY - sheetCenterY;

    const scale = interpolate(panelAnim.value, [0, 1], [0.9, 1]);
    const opacity = interpolate(panelAnim.value, [0, 1], [0, 1]);
    
    // Animates scale and translation from the trigger button coordinates
    const translateX = interpolate(panelAnim.value, [0, 1], [dx * 0.1, 0]);
    const translateY = interpolate(panelAnim.value, [0, 1], [dy * 0.1 + 10, 0]);

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
    };
  });

  const triggerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));

  // Staggered delay mapping:
  // Header: delay: 0.1
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(panelAnim.value, [0, 0.25, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(panelAnim.value, [0, 0.25, 1], [-10, -10, 0]) }],
  }));

  // Body: delay: 0.2
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(panelAnim.value, [0, 0.5, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(panelAnim.value, [0, 0.5, 1], [10, 10, 0]) }],
  }));

  // Footer: delay: 0.3
  const footerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(panelAnim.value, [0, 0.75, 1], [0, 0, 1]),
    transform: [{ translateY: interpolate(panelAnim.value, [0, 0.75, 1], [10, 10, 0]) }],
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
      <View ref={dockRef} collapsable={false}>
        <TouchableOpacity
          onPress={onDockPress}
          activeOpacity={0.75}
          hitSlop={8}
        >
          <Reanimated.View style={[styles.dock, { backgroundColor: active ? '#22FF88' : 'rgba(255,255,255,0.14)' }, triggerStyle]}>
            <Text style={[styles.initials, { color: active ? '#0A0A0A' : '#FFFFFF' }]}>
              {initials}
            </Text>
          </Reanimated.View>
        </TouchableOpacity>
      </View>

      {/* ── Modal panel ── */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSheet}
        onShow={() => setMounted(true)}
      >
        {/* Backdrop (Blur overlay) */}
        <Reanimated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Reanimated.View>

        {/* Floating Panel - matching Framer Motion's structure */}
        <Reanimated.View
          style={[
            styles.sheet,
            {
              width: sheetWidth,
              height: sheetHeight,
              left: H_INSET,
              bottom: sheetBottom,
            },
            panelStyle,
          ]}
        >
          <View style={styles.handle} />

          {/* ── Header (Staggered Delay 0.1) ── */}
          <Reanimated.View style={[styles.header, headerStyle]}>
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
          </Reanimated.View>

          {/* ── Body (Staggered Delay 0.2) ── */}
          <Reanimated.View style={[{ flex: 1 }, bodyStyle]}>
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
            </ScrollView>
          </Reanimated.View>

          {/* ── Footer (Staggered Delay 0.3) ── */}
          <Reanimated.View style={[styles.footer, footerStyle]}>
            <TouchableOpacity style={styles.signOut} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={17} color={Colors.error} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={styles.version}>Next360 v1.0.0</Text>
          </Reanimated.View>
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

  backdrop: { backgroundColor: 'rgba(10,10,10,0.55)' },

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
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  menuCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border,
    overflow: 'hidden',
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

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.lg, paddingVertical: 14,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  signOutText: { ...Typography.button, color: Colors.error },
  version: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
});
