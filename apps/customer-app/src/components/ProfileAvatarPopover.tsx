import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Dimensions,
} from 'react-native';
import Reanimated, {
  useSharedValue, useAnimatedStyle, withSpring, interpolate, interpolateColor, runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { Colors, Typography, Spacing, BorderRadius, REANIMATED_SPRING_CONFIG } from '../constants/theme';
import PopoverBackdrop from './PopoverBackdrop';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DOCK_SIZE = 36;
const PANEL_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.65;

interface MenuItem {
  icon: string;
  label: string;
  go: () => void;
}

interface Props {
  navigation: any;
}

// Same expand-in-place language as NotificationsPopover/LocationPopover —
// measured origin, spring-grows into a blurred-backdrop panel with real
// depth — left-anchored instead of right-anchored since the trigger lives at
// the top-left of the hero, not the top-right icon cluster.
export default function ProfileAvatarPopover({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [origin, setOrigin] = useState({ x: Spacing.xl, y: 60 });
  const anim = useSharedValue(0);

  // top is pinned to origin.y (the dock icon's own measured position) instead
  // of interpolating up toward the status bar — the panel now grows straight
  // down from exactly where the icon sits instead of visibly detaching and
  // sliding upward to a disconnected point before it opens (and reversing
  // that same jump on close).
  const leftTarget = Spacing.xl;

  const open = () => {
    dockRef.current?.measureInWindow((x, y) => {
      setOrigin({ x, y });
      setVisible(true);
      setExpanded(true);
      requestAnimationFrame(() => {
        anim.value = withSpring(1, REANIMATED_SPRING_CONFIG);
      });
    });
  };

  const close = () => {
    const finishClose = () => {
      setExpanded(false);
      setVisible(false);
    };
    anim.value = withSpring(0, REANIMATED_SPRING_CONFIG, (finished) => {
      if (finished) runOnJS(finishClose)();
    });
  };

  const goTo = (screen: string) => {
    close();
    navigation.navigate('Profile', { screen });
  };

  const menuItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Edit Profile', go: () => goTo('EditProfile') },
    { icon: 'receipt-outline', label: 'My Orders', go: () => goTo('OrderHistory') },
    { icon: 'heart-outline', label: 'Favourites', go: () => { close(); navigation.navigate('Favorites'); } },
    { icon: 'pricetag-outline', label: 'Offers & Coupons', go: () => goTo('Promos') },
    { icon: 'location-outline', label: 'My Addresses', go: () => goTo('AddressList') },
    { icon: 'notifications-outline', label: 'Notifications', go: () => goTo('Notifications') },
    { icon: 'help-circle-outline', label: 'Support', go: () => goTo('Support') },
  ];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { close(); signOut(); } },
    ]);
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: anim.value }));
  const panelStyle = useAnimatedStyle(() => ({
    top: origin.y,
    left: interpolate(anim.value, [0, 1], [origin.x, leftTarget]),
    width: interpolate(anim.value, [0, 1], [DOCK_SIZE, PANEL_WIDTH]),
    height: interpolate(anim.value, [0, 1], [DOCK_SIZE, PANEL_HEIGHT]),
    borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
    // Interpolated in lockstep with the size instead of a static white fill —
    // a static color snap showed a flash of solid white for a frame on collapse.
    backgroundColor: interpolateColor(anim.value, [0, 1], ['rgba(255,255,255,0.14)', Colors.white]),
  }));
  const iconOnlyStyle = useAnimatedStyle(() => ({ opacity: interpolate(anim.value, [0, 0.35, 1], [1, 0, 0]) }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: interpolate(anim.value, [0, 0.6, 1], [0, 0, 1]) }));

  return (
    <>
      <View ref={dockRef} style={styles.reserve} collapsable={false}>
        <TouchableOpacity style={styles.dock} activeOpacity={0.7} onPress={open}>
          <Text style={styles.dockText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <PopoverBackdrop style={[styles.backdrop, backdropStyle]} onPress={close} />

        <Reanimated.View style={[styles.panel, styles.panelShadow, panelStyle]}>
          <Reanimated.View style={[styles.iconOnly, iconOnlyStyle]} pointerEvents="none">
            <Text style={styles.iconOnlyText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </Reanimated.View>

          <Reanimated.View style={[styles.content, contentStyle]} pointerEvents={expanded ? 'auto' : 'none'}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Profile</Text>
              <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={8}>
                <Ionicons name="close" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.userCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{user?.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{user?.phone ? `+91 ${user.phone}` : user?.email}</Text>
                </View>
              </View>

              <View style={styles.menuCard}>
                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
                    onPress={item.go}
                  >
                    <View style={styles.menuLeft}>
                      <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.border} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={18} color={Colors.error} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>

              <Text style={styles.version}>Next360 v1.0.0</Text>
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

  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,8,0.35)',
  },
  panel: { position: 'absolute', overflow: 'hidden' },
  panelShadow: {
    shadowColor: '#0A0A08', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 40, elevation: 24,
  },
  iconOnly: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  iconOnlyText: { ...Typography.bodySmall, color: Colors.white, fontFamily: 'Inter_600SemiBold' },
  content: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },

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
