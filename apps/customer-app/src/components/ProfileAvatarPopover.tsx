import React, { useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Dimensions,
} from 'react-native';
import Reanimated, {
  useAnimatedStyle, useSharedValue, interpolate, interpolateColor, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import PopoverBackdrop from './PopoverBackdrop';
import {
  usePanelAnimation, PanelOrigin, StaggeredItem,
  useBodyStaggerStyle, useHeaderStaggerStyle, PRESS_SPRING_CONFIG,
} from '../lib/panelAnimation';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DOCK_SIZE = 36;
const PANEL_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.65;
const CENTER_LEFT = Spacing.xl;
const CENTER_TOP = 80;

interface MenuItem {
  icon: string;
  label: string;
  go: () => void;
}

interface Props {
  navigation: any;
}

export default function ProfileAvatarPopover({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [origin, setOrigin] = useState<PanelOrigin>({ x: Spacing.xl, y: 60, width: DOCK_SIZE, height: DOCK_SIZE });

  const triggerScale = useSharedValue(1);
  const triggerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: triggerScale.value }],
  }));

  const {
    anim, open: animOpen, close: animClose, backdropStyle, triggerGhostStyle,
  } = usePanelAnimation();

  const headerStyle = useHeaderStaggerStyle(anim);
  const bodyStyle = useBodyStaggerStyle(anim);

  const open = useCallback(() => {
    triggerScale.value = withSpring(0.85, PRESS_SPRING_CONFIG);
    dockRef.current?.measureInWindow((x, y) => {
      const o: PanelOrigin = { x, y, width: DOCK_SIZE, height: DOCK_SIZE };
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
  }, []);

  const close = useCallback(() => {
    animClose(finishClose);
  }, [animClose]);

  const goTo = useCallback((screen: string) => {
    close();
    requestAnimationFrame(() => navigation.navigate('Profile', { screen }));
  }, [navigation, close]);

  const menuItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Edit Profile', go: () => goTo('EditProfile') },
    { icon: 'receipt-outline', label: 'My Orders', go: () => goTo('OrderHistory') },
    { icon: 'heart-outline', label: 'Favourites', go: () => { close(); setTimeout(() => navigation.navigate('Favorites'), 300); } },
    { icon: 'pricetag-outline', label: 'Offers & Coupons', go: () => goTo('Promos') },
    { icon: 'location-outline', label: 'My Addresses', go: () => goTo('AddressList') },
    { icon: 'notifications-outline', label: 'Notifications', go: () => goTo('Notifications') },
    { icon: 'help-circle-outline', label: 'Support', go: () => goTo('Support') },
  ];

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { close(); setTimeout(() => signOut(), 300); } },
    ]);
  }, [signOut, close]);

  // ── Panel size + position (expands from trigger point to centered) ──
  const panelStyle = useAnimatedStyle(() => ({
    left: interpolate(anim.value, [0, 0.4, 1], [origin.x, CENTER_LEFT, CENTER_LEFT]),
    top: interpolate(anim.value, [0, 0.4, 1], [origin.y, CENTER_TOP, CENTER_TOP]),
    width: interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, PANEL_WIDTH, PANEL_WIDTH]),
    height: interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, DOCK_SIZE * 3, PANEL_HEIGHT]),
    borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
    backgroundColor: interpolateColor(anim.value, [0, 0.3, 1],
      ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.95)', Colors.white],
    ),
  }));

  return (
    <>
      <Reanimated.View ref={dockRef} style={[styles.reserve, triggerAnimStyle]} collapsable={false}>
        <TouchableOpacity style={styles.dock} activeOpacity={1} onPress={open}>
          <Text style={styles.dockText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </Reanimated.View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <PopoverBackdrop style={backdropStyle} onPress={close} />

        <Reanimated.View style={[styles.panel, styles.panelShadow, panelStyle]}>
          {/* Trigger ghost */}
          <Reanimated.View style={[styles.ghostWrap, triggerGhostStyle, { pointerEvents: 'none' }]}>
            <Text style={styles.dockText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </Reanimated.View>

          {/* Content — staggers in */}
          <Reanimated.View style={[StyleSheet.absoluteFill, bodyStyle, { pointerEvents: expanded ? 'auto' : 'none' }]}>
            <Reanimated.View style={headerStyle}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={8}>
                  <Ionicons name="close" size={18} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </Reanimated.View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <StaggeredItem anim={anim} index={0}>
                <View style={styles.userCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.phone ? `+91 ${user.phone}` : user?.email}</Text>
                  </View>
                </View>
              </StaggeredItem>

              <View style={styles.menuCard}>
                {menuItems.map((item, index) => (
                  <StaggeredItem key={item.label} anim={anim} index={index + 1}>
                    <TouchableOpacity
                      style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
                      onPress={item.go}
                      activeOpacity={0.6}
                    >
                      <View style={styles.menuLeft}>
                        <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
                        <Text style={styles.menuLabel}>{item.label}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.border} />
                    </TouchableOpacity>
                  </StaggeredItem>
                ))}
              </View>

              <StaggeredItem anim={anim} index={menuItems.length + 1}>
                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={18} color={Colors.error} />
                  <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
              </StaggeredItem>

              <StaggeredItem anim={anim} index={menuItems.length + 2}>
                <Text style={styles.version}>Next360 v1.0.0</Text>
              </StaggeredItem>
            </ScrollView>
          </Reanimated.View>
        </Reanimated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  reserve: { width: DOCK_SIZE, height: DOCK_SIZE },
  dock: {
    width: DOCK_SIZE, height: DOCK_SIZE, borderRadius: DOCK_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dockText: { ...Typography.bodySmall, color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  ghostWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  panel: { position: 'absolute', overflow: 'hidden' },
  panelShadow: {
    shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 24,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h3, color: Colors.text },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: { padding: Spacing.lg },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.organic,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.h3, color: Colors.white },
  userName: { ...Typography.h3, color: Colors.text },
  userEmail: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  menuCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuLabel: { ...Typography.body, color: Colors.text },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#FEE2E2', borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  signOutText: { ...Typography.button, color: Colors.error },
  version: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg },
});
