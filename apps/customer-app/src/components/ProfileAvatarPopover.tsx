import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Modal, ScrollView, Alert, Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { Colors, Typography, Spacing, BorderRadius, SPRING_CONFIG } from '../constants/theme';

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
  const anim = useRef(new Animated.Value(0)).current;

  const topTarget = Spacing.xl + 44;
  const leftTarget = Spacing.xl;

  const open = () => {
    dockRef.current?.measureInWindow((x, y) => {
      setOrigin({ x, y });
      setVisible(true);
      setExpanded(true);
      requestAnimationFrame(() => {
        Animated.spring(anim, { toValue: 1, useNativeDriver: false, ...SPRING_CONFIG }).start();
      });
    });
  };

  const close = () => {
    Animated.spring(anim, { toValue: 0, useNativeDriver: false, ...SPRING_CONFIG }).start(({ finished }) => {
      if (finished) {
        setExpanded(false);
        setVisible(false);
      }
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

  const top = anim.interpolate({ inputRange: [0, 1], outputRange: [origin.y, topTarget] });
  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [origin.x, leftTarget] });
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: [DOCK_SIZE, PANEL_WIDTH] });
  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [DOCK_SIZE, PANEL_HEIGHT] });
  const borderRadius = anim.interpolate({ inputRange: [0, 1], outputRange: [DOCK_SIZE / 2, BorderRadius.xl] });
  const iconOnlyOpacity = anim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [1, 0, 0] });
  const contentOpacity = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });
  // Interpolated in lockstep with the size instead of a static white fill —
  // a static color snap showed a flash of solid white for a frame on collapse.
  const backgroundColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.14)', Colors.white] });

  return (
    <>
      <View ref={dockRef} style={styles.reserve} collapsable={false}>
        <TouchableOpacity style={styles.dock} activeOpacity={0.7} onPress={open}>
          <Text style={styles.dockText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
        <Animated.View style={[styles.backdrop, { opacity: anim }]}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
        </Animated.View>

        <Animated.View style={[styles.panel, styles.panelShadow, { top, left, width, height, borderRadius, backgroundColor }]}>
          <Animated.View style={[styles.iconOnly, { opacity: iconOnlyOpacity }]} pointerEvents="none">
            <Text style={styles.iconOnlyText}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
          </Animated.View>

          <Animated.View style={[styles.content, { opacity: contentOpacity }]} pointerEvents={expanded ? 'auto' : 'none'}>
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
                  <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
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
          </Animated.View>
        </Animated.View>
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
