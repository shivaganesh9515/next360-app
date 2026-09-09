import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { Colors, Spacing, BorderRadius, Shadows, getStoreAccent, getStoreAccentLight, getStoreAccentDark } from '../../constants/theme';
import { setLanguage } from '../../i18n';
import { customerApi } from '../../lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────
interface MenuRow {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
}

interface MenuGroup {
  title: string;
  items: MenuRow[];
}

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { storeType } = useStore();
  const { i18n, t } = useTranslation();
  const insets = useSafeAreaInsets();

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

  const getTrackerTitle = (type: string) => {
    switch (type) {
      case 'ORGANIC': return 'YOUR ORGANIC FARM IMPACT // VIP STATUS';
      case 'NATURAL': return 'YOUR NATURAL HARVEST IMPACT // VIP STATUS';
      case 'ECO_FRIENDLY': return 'YOUR SUSTAINABLE ECO IMPACT // VIP STATUS';
      default: return 'YOUR ORGANIC FARM IMPACT // VIP STATUS';
    }
  };
  const trackerTitle = getTrackerTitle(storeType);

  // ── State ────────────────────────────────────────────────────────────────
  const [showLangModal, setShowLangModal] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [addressCount, setAddressCount] = useState<number | null>(null);
  const [couponCount, setCouponCount] = useState<number | null>(null);
  const currentLang = i18n.language === 'te' ? 'తెలుగు' : 'English';

  // ── Fetch real data ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrderCount();
    fetchAddressCount();
    fetchCouponCount();
  }, []);

  const fetchOrderCount = async () => {
    try {
      const res = await customerApi.getOrders();
      const list = Array.isArray(res) ? res : [];
      setOrderCount(list.length);
    } catch {
      setOrderCount(0);
    }
  };

  const fetchAddressCount = async () => {
    try {
      const res = await customerApi.getAddresses();
      const list = Array.isArray(res) ? res : [];
      setAddressCount(list.length);
    } catch {
      setAddressCount(0);
    }
  };

  const fetchCouponCount = async () => {
    try {
      const res = await customerApi.getActiveOffers();
      const list = Array.isArray(res) ? res : [];
      setCouponCount(list.length);
    } catch {
      setCouponCount(0);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLanguageChange = async (lang: 'en' | 'te') => {
    await setLanguage(lang);
    setShowLangModal(false);
  };

  const handleSignOut = () => {
    Alert.alert(t('common.signOut'), t('profile.alert.signOut.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.signOut'), style: 'destructive', onPress: signOut },
    ]);
  };

  // ── Zomato-style Menu Groups ─────────────────────────────────────────────
  const menuGroups: MenuGroup[] = [
    {
      title: 'PAYMENTS & REWARDS',
      items: [
        {
          icon: 'wallet-outline',
          iconBg: `${accent}14`,
          iconColor: accent,
          label: 'Next360 Wallet & Cash',
          sublabel: 'Balance: ₹350 • Safe UPI & COD Wallet',
          onPress: () => navigation.navigate('Wallet'),
        },
        {
          icon: 'gift-outline',
          iconBg: `${accent}14`,
          iconColor: accent,
          label: 'Refer & Earn Organic',
          sublabel: 'Invite friends, get ₹100 free organic wallet cash',
          onPress: () => navigation.navigate('Referral'),
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        {
          icon: 'language-outline',
          iconBg: `${accent}14`,
          iconColor: accent,
          label: 'App Language',
          sublabel: `Currently: ${currentLang}`,
          badge: currentLang,
          badgeColor: `${accent}1F`,
          onPress: () => setShowLangModal(true),
        },
        {
          icon: 'notifications-outline',
          iconBg: `${accent}14`,
          iconColor: accent,
          label: 'Notifications',
          sublabel: 'Order updates, offers & delivery alerts',
          onPress: () => navigation.navigate('Notifications'),
        },
      ],
    },
    {
      title: 'LEGAL & ABOUT',
      items: [
        {
          icon: 'shield-checkmark-outline',
          iconBg: `${accent}14`,
          iconColor: accent,
          label: 'Privacy Policy',
          sublabel: 'Data usage & deletion policies',
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
        {
          icon: 'document-text-outline',
          iconBg: `${accent}14`,
          iconColor: accent,
          label: 'Terms of Service',
          sublabel: 'Marketplace & delivery terms',
          onPress: () => navigation.navigate('TermsOfService'),
        },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        {
          icon: 'person-remove-outline',
          iconBg: '#FF3B3014',
          iconColor: '#FF3B30',
          label: 'Delete Account',
          sublabel: 'Permanently delete your account and data',
          onPress: () => navigation.navigate('DeleteAccount'),
        },
      ],
    },
  ];

  // ── Entrance & Premium Wobble/Pulse/Float Animations ───────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const wobbleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Pulse loop for telemetry glowing dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Organic wobble loop for floating bubbles and loyalty card
    Animated.loop(
      Animated.sequence([
        Animated.timing(wobbleAnim, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(wobbleAnim, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ])
    ).start();

    // Floating background bubbles animation loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, { toValue: 1, duration: 10000, useNativeDriver: true }),
        Animated.timing(floatAnim1, { toValue: 0, duration: 10000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, { toValue: 1, duration: 12000, useNativeDriver: true }),
        Animated.timing(floatAnim2, { toValue: 0, duration: 12000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const wobbleScale = wobbleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.03, 0.97],
  });
  
  const wobbleRotate = wobbleAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '1.5deg', '0deg', '-1.5deg', '0deg'],
  });

  const floatX1 = floatAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 15, -10],
  });
  const floatY1 = floatAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -25, 10],
  });

  const floatX2 = floatAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 20],
  });
  const floatY2 = floatAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 15, -20],
  });

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* ── Background Animated Floating Bubbles (Dynamic Tones) ─────────── */}
      <Animated.View
        style={[
          styles.bubble1,
          {
            backgroundColor: `${accent}0A`,
            transform: [{ translateX: floatX1 }, { translateY: floatY1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.bubble2,
          {
            backgroundColor: `${accent}05`,
            transform: [{ translateX: floatX2 }, { translateY: floatY2 }],
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header Card (Dynamic Banner) ──────────────────── */}
        <Animated.View style={[styles.headerCard, { opacity: fadeAnim, backgroundColor: accent, borderColor: `${accent}33` }]}>
          <View style={styles.headerTop}>
            <View style={[styles.avatarWrap, { backgroundColor: Colors.white, borderColor: `${accent}4D` }]}>
              <Text style={[styles.avatarText, { color: accent }]}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Valued Customer'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={highlightColor} />
                </View>
              </View>
              <Text style={styles.userContact}>
                {user?.phone ? `+91 ${user.phone}` : user?.email || 'Member since 2026'}
              </Text>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.7}
              >
                <Text style={[styles.editProfileText, { color: highlightColor }]}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={13} color={highlightColor} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Zomato-Style VIP Dynamic Pass Banner ─────────────────────── */}
        <View style={styles.vipBanner}>
          <View style={styles.vipLeft}>
            <View style={styles.vipBadgeRow}>
              <Ionicons name="sparkles" size={14} color="#FFD700" />
              <Text style={styles.vipTag}>NEXT360 VIP CLUB</Text>
            </View>
            <Text style={styles.vipTitle}>Free Express Farm Delivery</Text>
            <Text style={styles.vipSub}>Saved ₹420 on organic orders this month</Text>
          </View>
          <TouchableOpacity
            style={[styles.vipBtn, { backgroundColor: highlightColor }]}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}
          >
            <Text style={[styles.vipBtnText, { color: '#0A0A0A' }]}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* ── Dynamic Impact & Loyalty Tracker Card ───────────────────────── */}
        <Animated.View 
          style={[
            styles.slickCard, 
            { 
              borderColor: `${accent}26`,
              transform: [{ scale: wobbleScale }, { rotate: wobbleRotate }],
              opacity: fadeAnim
            }
          ]}
        >
          <View style={styles.slickCardHeader}>
            <Animated.View style={[styles.slickPulseDot, { opacity: pulseAnim, backgroundColor: accent }]} />
            <Text style={[styles.slickHeaderTitle, { color: accent }]}>{trackerTitle}</Text>
          </View>
          <View style={styles.slickGrid}>
            <View style={styles.slickRow}>
              <Text style={styles.slickLabel}>CARBON FOOTPRINT SAVED</Text>
              <Text style={[styles.slickValue, { color: accent, fontWeight: '700' }]}>14.8 kg CO2</Text>
            </View>
            <View style={styles.slickRow}>
              <Text style={styles.slickLabel}>LOCAL FARMS SUPPORTED</Text>
              <Text style={[styles.slickValue, { color: Colors.text, fontWeight: '700' }]}>6 Partners</Text>
            </View>
            <View style={styles.slickRow}>
              <Text style={styles.slickLabel}>LOYALTY MEMBERSHIP</Text>
              <Text style={[styles.slickValue, { color: highlightColor, fontWeight: '700' }]}>
                {storeType === 'ORGANIC' ? 'SAPLING TIER (LEVEL 3)' : storeType === 'NATURAL' ? 'ARTISAN TIER (LEVEL 2)' : 'ECO-SAVER TIER (LEVEL 4)'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── GlassStats Grid (Metrics Visualisation) ─────────────────────── */}
        <View style={styles.gridSection}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: `${accent}14` }]}>
              <Ionicons name="receipt" size={20} color={accent} />
            </View>
            <View style={styles.gridTextWrap}>
              <Text style={styles.gridTitle}>My Orders</Text>
              <Text style={[styles.gridMetric, { color: accent }]}>
                {orderCount !== null ? `${orderCount}` : '0'}
              </Text>
              <Text style={styles.gridSub}>Total orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('AddressList')}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: `${accent}14` }]}>
              <Ionicons name="location" size={20} color={accent} />
            </View>
            <View style={styles.gridTextWrap}>
              <Text style={styles.gridTitle}>Addresses</Text>
              <Text style={[styles.gridMetric, { color: accent }]}>
                {addressCount !== null ? `${addressCount}` : '0'}
              </Text>
              <Text style={styles.gridSub}>Saved locations</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Promos')}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: `${accent}14` }]}>
              <Ionicons name="pricetags" size={20} color={accent} />
            </View>
            <View style={styles.gridTextWrap}>
              <Text style={styles.gridTitle}>Offers</Text>
              <Text style={[styles.gridMetric, { color: accent }]}>
                {couponCount !== null ? `${couponCount}` : '0'}
              </Text>
              <Text style={styles.gridSub}>Active coupons</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Support')}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: `${accent}14` }]}>
              <Ionicons name="headset" size={20} color={accent} />
            </View>
            <View style={styles.gridTextWrap}>
              <Text style={styles.gridTitle}>Support</Text>
              <Text style={[styles.gridMetric, { color: accent }]}>24x7</Text>
              <Text style={styles.gridSub}>Instant help</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Categorized Menu Groups ───────────────────────────────────── */}
        {menuGroups.map((group) => (
          <View key={group.title} style={styles.menuGroup}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.menuContainer}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    idx < group.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.sublabel && <Text style={styles.menuSublabel}>{item.sublabel}</Text>}
                  </View>
                  <View style={styles.menuRight}>
                    {item.badge && (
                      <View style={[styles.badgePill, { backgroundColor: item.badgeColor }]}>
                        <Text style={[styles.badgeText, { color: accent }]}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign Out & Account Actions ──────────────────────────────────── */}
        <View style={{ gap: 10, marginTop: Spacing.sm }}>
          <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            <Text style={styles.signOutLabel}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signOutCard, { backgroundColor: '#FFF5F5', borderColor: '#FFE0E0' }]}
            onPress={() => {
              Alert.alert(
                'Delete Account & Data',
                'Per Google Play policy, submitting an account deletion request will permanently wipe your profile, address book, and active orders within 30 days.\n\nAre you sure you want to proceed?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Request Deletion',
                    style: 'destructive',
                    onPress: () => {
                      Alert.alert(
                        'Request Submitted',
                        'Your account deletion request has been registered. Our support team will process it and send confirmation to your registered email/phone.'
                      );
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color="#C62828" />
            <Text style={[styles.signOutLabel, { color: '#C62828' }]}>Delete Account & Data</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer Info ──────────────────────────────────────────────── */}
        <Text style={styles.footerVersion}>Next360 App v2.4.0</Text>
      </ScrollView>

      {/* ── Language Selection Modal ─────────────────────────────────────── */}
      <Modal visible={showLangModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowLangModal(false)}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Language / భాష</Text>
              <TouchableOpacity onPress={() => setShowLangModal(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.langOption, i18n.language === 'en' && styles.langOptionActive]}
              onPress={() => handleLanguageChange('en')}
              activeOpacity={0.7}
            >
              <View style={styles.langLeft}>
                <Text style={styles.langEmoji}>🇬🇧</Text>
                <View>
                  <Text style={styles.langLabel}>English</Text>
                  <Text style={styles.langSub}>Default app language</Text>
                </View>
              </View>
              {i18n.language === 'en' && (
                <Ionicons name="checkmark-circle" size={22} color={accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.langOption, i18n.language === 'te' && styles.langOptionActive]}
              onPress={() => handleLanguageChange('te')}
              activeOpacity={0.7}
            >
              <View style={styles.langLeft}>
                <Text style={styles.langEmoji}>🇮🇳</Text>
                <View>
                  <Text style={styles.langLabel}>తెలుగు</Text>
                  <Text style={styles.langSub}>Telugu language</Text>
                </View>
              </View>
              {i18n.language === 'te' && (
                <Ionicons name="checkmark-circle" size={22} color={accent} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },

  /* Background Floating Bubbles */
  bubble1: {
    position: 'absolute',
    top: 60,
    left: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(92, 107, 77, 0.03)',
  },
  bubble2: {
    position: 'absolute',
    bottom: 220,
    right: 20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(155, 106, 63, 0.02)',
  },

  /* Top Header Card */
  headerCard: {
    backgroundColor: '#5C6B4D',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(92, 107, 77, 0.2)',
    ...Shadows.raised,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(92, 107, 77, 0.3)',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#5C6B4D',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  verifiedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userContact: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#EDF0E8',
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  editProfileText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#5C6B4D',
  },

  /* VIP Banner */
  vipBanner: {
    backgroundColor: '#1C1B17',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  vipLeft: {
    flex: 1,
  },
  vipBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  vipTag: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFD700',
    letterSpacing: 0.8,
  },
  vipTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  vipSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#B8B2A4',
    marginTop: 2,
  },
  vipBtn: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
  },
  vipBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#0A0A0A',
  },

  /* Organic Impact Node */
  slickCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: 'rgba(92, 107, 77, 0.15)',
    ...Shadows.card,
  },
  slickCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 23, 0.06)',
    paddingBottom: 6,
  },
  slickPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5C6B4D',
  },
  slickHeaderTitle: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: '#5C6B4D',
    letterSpacing: 1.5,
  },
  slickGrid: {
    gap: 6,
  },
  slickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slickLabel: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  slickValue: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 9,
    color: '#1C1B17',
  },

  /* 2x2 Quick Action Grid */
  gridSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 10,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 23, 0.08)',
    ...Shadows.card,
  },
  gridIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  gridTextWrap: {
    flex: 1,
  },
  gridTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#1C1B17',
  },
  gridMetric: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 18,
    color: '#5C6B4D',
    fontWeight: '700',
    marginTop: 2,
  },
  gridSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#5B574E',
    marginTop: 1,
  },

  /* Categorized Menu Groups */
  menuGroup: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 10,
    color: '#5B574E',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 23, 0.08)',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 27, 23, 0.04)',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1C1B17',
  },
  menuSublabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#5B574E',
    marginTop: 2,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#5C6B4D',
  },

  /* Sign Out Button */
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(229, 57, 53, 0.05)',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 53, 0.15)',
  },
  signOutLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#D32F2F',
  },

  /* Footer */
  footerVersion: {
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerSub: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 27, 23, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 23, 0.08)',
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(28, 27, 23, 0.1)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#1C1B17',
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(28, 27, 23, 0.08)',
    backgroundColor: 'rgba(28, 27, 23, 0.02)',
  },
  langOptionActive: {
    borderColor: '#5C6B4D',
    backgroundColor: 'rgba(92, 107, 77, 0.06)',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langEmoji: {
    fontSize: 26,
  },
  langLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#1C1B17',
  },
  langSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#5B574E',
    marginTop: 1,
  },
});
