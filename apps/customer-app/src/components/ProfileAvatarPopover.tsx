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
import { useStore } from '../lib/store';
import { Colors, Spacing, BorderRadius, Shadows, getStoreAccent, getStoreAccentLight, getStoreAccentDark } from '../constants/theme';
import PopoverBackdrop from './PopoverBackdrop';
import {
  usePanelAnimation,
  useContentFadeIn, PRESS_SPRING_CONFIG,
} from '../lib/panelAnimation';
import { customerApi } from '../lib/api';

const DOCK_SIZE = 44;

interface Props { navigation?: any; active?: boolean }

export default function ProfileAvatarPopover({ navigation, active = false }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  const panelWidth = Math.min(440, screenWidth - Spacing.md * 2);
  const panelHeight = Math.min(620, screenHeight * 0.82);

  const { user, signOut } = useAuth();
  const { storeType } = useStore();
  const accent = getStoreAccent(storeType);
  const accentLight = getStoreAccentLight(storeType);
  const accentDark = getStoreAccentDark(storeType);

  const getHighlightColor = (type: string) => {
    switch (type) {
      case 'ORGANIC': return '#5C6B4D';
      case 'NATURAL': return '#E5A93B'; // Gold
      case 'ECO_FRIENDLY': return '#00E5FF'; // Cyan
      default: return '#5C6B4D';
    }
  };
  const highlightColor = getHighlightColor(storeType);
  const dockRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const animationStarted = useRef(false);

  // Quick stats counters
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [addressCount, setAddressCount] = useState<number | null>(null);
  const [couponCount, setCouponCount] = useState<number | null>(null);

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

  const fetchStats = useCallback(async () => {
    try {
      const [o, a, c] = await Promise.all([
        customerApi.getOrders().catch(() => []),
        customerApi.getAddresses().catch(() => []),
        customerApi.getActiveOffers().catch(() => []),
      ]);
      setOrderCount(Array.isArray(o) ? o.length : 0);
      setAddressCount(Array.isArray(a) ? a.length : 0);
      setCouponCount(Array.isArray(c) ? c.length : 0);
    } catch {
      // quiet fallback
    }
  }, []);

  useEffect(() => {
    if (visible && !animationStarted.current) {
      animationStarted.current = true;
      requestAnimationFrame(() => {
        animOpen();
        triggerScale.value = withSpring(1, PRESS_SPRING_CONFIG);
        fetchStats();
      });
    }
    if (!visible) animationStarted.current = false;
  }, [visible, animOpen, fetchStats]);

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
  const goTo = useCallback((screenName: string) => {
    close();
    setTimeout(() => {
      if (!navigation) return;
      if (screenName === 'Orders') {
        navigation.navigate('Orders');
      } else if (screenName === 'ProfileMain') {
        navigation.navigate('Profile', { screen: 'ProfileMain' });
      } else {
        navigation.navigate('Profile', { screen: 'ProfileMain' });
        setTimeout(() => {
          navigation.navigate('Profile', { screen: screenName });
        }, 60);
      }
    }, 280);
  }, [navigation, close]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => { close(); setTimeout(() => signOut(), 350); },
      },
    ]);
  }, [signOut, close]);

  const panelStyle = useAnimatedStyle(() => {
    const width  = interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, panelWidth, panelWidth]);
    const height = interpolate(anim.value, [0, 0.4, 1], [DOCK_SIZE, panelHeight * 0.4, panelHeight]);

    // Right-align to the trigger button (same as notifications)
    const desiredLeft = originX.value + DOCK_SIZE - panelWidth;
    const openX = Math.max(12, Math.min(screenWidth - panelWidth - 12, desiredLeft));
    const left = interpolate(anim.value, [0, 1], [originX.value, openX]);

    // Open UPWARD from trigger — panel bottom sits just above the navbar
    const openTop = originY.value - panelHeight - 8;
    const clampedTop = Math.max(insets.top + 12, openTop);
    const top = interpolate(anim.value, [0, 1], [originY.value, clampedTop]);

    return {
      left,
      top,
      width,
      height,
      borderRadius: interpolate(anim.value, [0, 1], [DOCK_SIZE / 2, BorderRadius.xl]),
      backgroundColor: interpolateColor(anim.value, [0, 0.3, 1],
        ['rgba(255,255,255,0.14)', Colors.white, Colors.white],
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
          style={[styles.dock, { backgroundColor: active ? highlightColor : 'rgba(255,255,255,0.14)' }]}
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
            <View style={[styles.dock, { backgroundColor: active ? highlightColor : 'rgba(255,255,255,0.14)' }]}>
              <Text style={[styles.initials, { color: active ? '#0A0A0A' : '#FFFFFF' }]}>
                {initials}
              </Text>
            </View>
          </Reanimated.View>

          {/* Content view fade-in */}
          <Reanimated.View
            style={[StyleSheet.absoluteFill, contentFade, { width: panelWidth }]}
            pointerEvents={Platform.OS === 'web' ? undefined : (expanded ? 'auto' : 'none')}
          >
            <View style={{ flex: 1, width: panelWidth }}>
              {/* Drag handle */}
              <View style={styles.handle} />

              <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {/* ── Top Header Card (Zomato Style) ── */}
                <View style={[styles.headerCard, { backgroundColor: accent }]}>
                  <View style={styles.headerTop}>
                    <View style={[styles.avatarWrap, { backgroundColor: Colors.white, borderColor: `${accent}4D` }]}>
                      <Text style={[styles.avatarText, { color: accent }]}>{initials}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName} numberOfLines={1}>{user?.name || 'Valued Customer'}</Text>
                        <Ionicons name="checkmark-circle" size={16} color={highlightColor} />
                      </View>
                      <Text style={styles.userContact} numberOfLines={1}>
                        {user?.phone ? `+91 ${user.phone}` : (user?.email || 'Member since 2026')}
                      </Text>
                      <TouchableOpacity
                        style={styles.editProfileBtn}
                        onPress={() => goTo('EditProfile')}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.editProfileText, { color: highlightColor }]}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={12} color={highlightColor} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={10}>
                      <Ionicons name="close" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── Zomato VIP Pass Banner ── */}
                <TouchableOpacity
                  style={styles.vipBanner}
                  onPress={() => goTo('Subscription')}
                  activeOpacity={0.8}
                >
                  <View style={styles.vipLeft}>
                    <View style={styles.vipBadgeRow}>
                      <Ionicons name="sparkles" size={13} color={highlightColor} />
                      <Text style={[styles.vipTag, { color: highlightColor }]}>NEXT360 VIP CLUB</Text>
                    </View>
                    <Text style={styles.vipTitle}>Free Express Delivery Enabled</Text>
                    <Text style={styles.vipSub}>Saved ₹420 on organic orders this month</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={highlightColor} />
                </TouchableOpacity>

                {/* ── 2x2 Quick Action Grid ── */}
                <View style={styles.gridSection}>
                  <TouchableOpacity style={styles.gridCard} onPress={() => goTo('Orders')} activeOpacity={0.75}>
                    <View style={[styles.gridIconBox, { backgroundColor: `${accent}14` }]}>
                      <Ionicons name="receipt" size={20} color={accent} />
                    </View>
                    <View style={styles.gridTextWrap}>
                      <Text style={styles.gridTitle}>My Orders</Text>
                      <Text style={styles.gridSub}>{orderCount !== null ? `${orderCount} Orders` : 'History'}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.gridCard} onPress={() => goTo('AddressList')} activeOpacity={0.75}>
                    <View style={[styles.gridIconBox, { backgroundColor: `${accent}14` }]}>
                      <Ionicons name="location" size={20} color={accent} />
                    </View>
                    <View style={styles.gridTextWrap}>
                      <Text style={styles.gridTitle}>Addresses</Text>
                      <Text style={styles.gridSub}>{addressCount !== null ? `${addressCount} Saved` : 'Manage'}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.gridCard} onPress={() => goTo('Promos')} activeOpacity={0.75}>
                    <View style={[styles.gridIconBox, { backgroundColor: `${accent}14` }]}>
                      <Ionicons name="pricetags" size={20} color={accent} />
                    </View>
                    <View style={styles.gridTextWrap}>
                      <Text style={styles.gridTitle}>Offers</Text>
                      <Text style={styles.gridSub}>{couponCount !== null ? `${couponCount} Active` : 'Coupons'}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.gridCard} onPress={() => goTo('Support')} activeOpacity={0.75}>
                    <View style={[styles.gridIconBox, { backgroundColor: `${accent}14` }]}>
                      <Ionicons name="headset" size={20} color={accent} />
                    </View>
                    <View style={styles.gridTextWrap}>
                      <Text style={styles.gridTitle}>Help 24x7</Text>
                      <Text style={styles.gridSub}>Support</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* ── Categorized Menu List ── */}
                <View style={styles.menuContainer}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => goTo('ProfileMain')} activeOpacity={0.7}>
                    <View style={[styles.menuIconBox, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="person-circle-outline" size={19} color="#2E7D32" />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuLabel}>View Full Profile Screen</Text>
                      <Text style={styles.menuSublabel}>All account details & preferences</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color="#B0BEC5" />
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity style={styles.menuItem} onPress={() => goTo('EditProfile')} activeOpacity={0.7}>
                    <View style={[styles.menuIconBox, { backgroundColor: '#E0F2F1' }]}>
                      <Ionicons name="person-outline" size={19} color="#00796B" />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuLabel}>Edit Account Profile</Text>
                      <Text style={styles.menuSublabel}>Name, phone, email & photo</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color="#B0BEC5" />
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity style={styles.menuItem} onPress={() => goTo('Referral')} activeOpacity={0.7}>
                    <View style={[styles.menuIconBox, { backgroundColor: '#FCE4EC' }]}>
                      <Ionicons name="gift-outline" size={19} color="#C2185B" />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuLabel}>Refer & Earn Organic</Text>
                      <Text style={styles.menuSublabel}>Get ₹100 free wallet cash per friend</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color="#B0BEC5" />
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity style={styles.menuItem} onPress={() => goTo('Notifications')} activeOpacity={0.7}>
                    <View style={[styles.menuIconBox, { backgroundColor: '#FFF8E1' }]}>
                      <Ionicons name="notifications-outline" size={19} color="#F57F17" />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuLabel}>Notification Preferences</Text>
                      <Text style={styles.menuSublabel}>Order updates & delivery alerts</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={15} color="#B0BEC5" />
                  </TouchableOpacity>
                </View>

                {/* ── Sign Out ── */}
                <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut} activeOpacity={0.8}>
                  <Ionicons name="log-out-outline" size={19} color="#E53935" />
                  <Text style={styles.signOutLabel}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Next360 App v2.4.0 (Organic ERP)</Text>
              </ScrollView>
            </View>
          </Reanimated.View>
        </Reanimated.View>
      </Modal>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  reserve: { width: DOCK_SIZE, height: DOCK_SIZE },
  dock: {
    width: DOCK_SIZE, height: DOCK_SIZE, borderRadius: DOCK_SIZE / 2,
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
    alignSelf: 'center', marginTop: 30,
    width: 36, height: 4,
    borderRadius: 2, backgroundColor: Colors.border,
    marginBottom: 8,
  },

  scroll: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 20,
  },

  /* Header Card */
  headerCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: BorderRadius.md,
    padding: 15,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#5C6B4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#0A0A0A',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  userContact: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 1,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  editProfileText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#5C6B4D',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* VIP Banner */
  vipBanner: {
    backgroundColor: '#1E1E24',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333340',
  },
  vipLeft: {
    flex: 1,
  },
  vipBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  vipTag: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#FFD700',
    letterSpacing: 0.6,
  },
  vipTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  vipSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 1,
  },

  /* 2x2 Quick Action Grid */
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  gridIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  gridTextWrap: {
    flex: 1,
  },
  gridTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#1A1A1A',
  },
  gridSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#757575',
    marginTop: 1,
  },

  /* Categorized Menu List */
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    overflow: 'hidden',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#1A1A1A',
  },
  menuSublabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#757575',
    marginTop: 1,
  },

  /* Sign Out */
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginBottom: 8,
  },
  signOutLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#E53935',
  },

  version: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
  },
});
