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
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
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
  const { i18n, t } = useTranslation();
  const insets = useSafeAreaInsets();

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
      title: 'YOUR ORDERS & ACTIVITY',
      items: [
        {
          icon: 'receipt-outline',
          iconBg: '#E8F5E9',
          iconColor: '#2E7D32',
          label: 'Your Orders',
          sublabel: orderCount !== null ? `${orderCount} past orders` : 'View order history & status',
          onPress: () => navigation.navigate('Orders'),
        },
        {
          icon: 'location-outline',
          iconBg: '#E1F5FE',
          iconColor: '#0288D1',
          label: 'Address Book',
          sublabel: addressCount !== null ? `${addressCount} saved locations` : 'Manage delivery addresses',
          onPress: () => navigation.navigate('AddressList'),
        },
      ],
    },
    {
      title: 'PAYMENTS & REWARDS',
      items: [
        {
          icon: 'wallet-outline',
          iconBg: '#FFF3E0',
          iconColor: '#E65100',
          label: 'Next360 Wallet & Cash',
          sublabel: 'Balance: ₹0 • Fast 1-click checkout',
          onPress: () => navigation.navigate('Orders'),
        },
        {
          icon: 'pricetag-outline',
          iconBg: '#F3E5F5',
          iconColor: '#7B1FA2',
          label: 'Offers & Promo Codes',
          sublabel: couponCount !== null ? `${couponCount} active offers available` : 'Discounts & cashback coupons',
          badge: couponCount ? `${couponCount} OFFERS` : undefined,
          badgeColor: '#22FF88',
          onPress: () => navigation.navigate('Promos'),
        },
        {
          icon: 'gift-outline',
          iconBg: '#FCE4EC',
          iconColor: '#C2185B',
          label: 'Refer & Earn Organic',
          sublabel: 'Invite friends, get ₹100 free organic wallet cash',
          onPress: () => navigation.navigate('Referral'),
        },
      ],
    },
    {
      title: 'PREFERENCES & SUPPORT',
      items: [
        {
          icon: 'language-outline',
          iconBg: '#E0F2F1',
          iconColor: '#00796B',
          label: 'App Language',
          sublabel: `Currently: ${currentLang}`,
          badge: currentLang,
          onPress: () => setShowLangModal(true),
        },
        {
          icon: 'notifications-outline',
          iconBg: '#FFF8E1',
          iconColor: '#F57F17',
          label: 'Notifications',
          sublabel: 'Order updates, offers & delivery alerts',
          onPress: () => navigation.navigate('Notifications'),
        },
        {
          icon: 'help-circle-outline',
          iconBg: '#E8EAF6',
          iconColor: '#303F9F',
          label: 'Customer Support 24x7',
          sublabel: 'Help with orders, refunds & delivery',
          onPress: () => navigation.navigate('Support'),
        },
      ],
    },
  ];

  // ── Entrance animation ───────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top Header Card (Zomato Banner) ─────────────────────────── */}
        <Animated.View style={[styles.headerCard, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Valued Customer'}
                </Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-seal-fill" size={16} color="#22FF88" />
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
                <Text style={styles.editProfileText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={13} color="#22FF88" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ── Zomato-Style VIP Organic Pass Banner ─────────────────────── */}
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
            style={styles.vipBtn}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.8}
          >
            <Text style={styles.vipBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* ── Zomato 2x2 Quick Action Grid ─────────────────────────────── */}
        <View style={styles.gridSection}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="receipt" size={22} color="#2E7D32" />
            </View>
            <View style={styles.gridTextWrap}>
              <Text style={styles.gridTitle}>My Orders</Text>
              <Text style={styles.gridSub}>
                {orderCount !== null ? `${orderCount} Orders` : 'History'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#C5C5C5" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('AddressList')}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="location" size={22} color="#0288D1" />
            </View>
            <View style={styles.gridTextWrap}>
              <Text style={styles.gridTitle}>Addresses</Text>
              <Text style={styles.gridSub}>
                {addressCount !== null ? `${addressCount} Saved` : 'Manage'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#C5C5C5" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Promos')}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="pricetags" size={22} color="#7B1FA2" />
            </View>
            <View style={styles.gridTextWrap}>
              <Text style={styles.gridTitle}>Offers</Text>
              <Text style={styles.gridSub}>
                {couponCount !== null ? `${couponCount} Active` : 'Coupons'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#C5C5C5" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Support')}
            activeOpacity={0.75}
          >
            <View style={[styles.gridIconBox, { backgroundColor: '#E8EAF6' }]}>
              <Ionicons name="headset" size={22} color="#303F9F" />
            </View>
            <View style={styles.gridTextWrap}>
              <Text style={styles.gridTitle}>Help 24x7</Text>
              <Text style={styles.gridSub}>Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#C5C5C5" />
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
                  <View style={[styles.menuIconContainer, { backgroundColor: item.iconBg || '#F5F5F5' }]}>
                    <Ionicons name={item.icon} size={20} color={item.iconColor || Colors.organic} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.sublabel && <Text style={styles.menuSublabel}>{item.sublabel}</Text>}
                  </View>
                  <View style={styles.menuRight}>
                    {item.badge && (
                      <View style={[styles.badgePill, { backgroundColor: item.badgeColor || '#F3F4F6' }]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#B0BEC5" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Sign Out Button (Zomato-style Red Card) ────────────────────── */}
        <TouchableOpacity style={styles.signOutCard} onPress={handleSignOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={styles.signOutLabel}>Log Out</Text>
        </TouchableOpacity>

        {/* ── Footer Info ──────────────────────────────────────────────── */}
        <Text style={styles.footerVersion}>Next360 App v2.4.0 (Organic ERP)</Text>
        <Text style={styles.footerSub}>Made with ❤️ for fresh organic delivery</Text>
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
                <Ionicons name="checkmark-circle" size={22} color="#22FF88" />
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
                <Ionicons name="checkmark-circle" size={22} color="#22FF88" />
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
    backgroundColor: '#F7F8FA',
  },

  /* Top Header Card */
  headerCard: {
    backgroundColor: '#0A0A0A',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
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
    backgroundColor: '#22FF88',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#0A0A0A',
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
    fontFamily: 'Inter_700Bold',
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
    color: '#A0A0A0',
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
    color: '#22FF88',
  },

  /* VIP Banner */
  vipBanner: {
    backgroundColor: '#1E1E24',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: '#9E9E9E',
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
    borderColor: '#EFEFEF',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)' },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
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
    color: '#1A1A1A',
  },
  gridSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#757575',
    marginTop: 1,
  },

  /* Categorized Menu Groups */
  menuGroup: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#757575',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#EFEFEF',
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
    borderBottomColor: '#F5F5F5',
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
    color: '#1A1A1A',
  },
  menuSublabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#757575',
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
    color: '#0A0A0A',
  },

  /* Sign Out Button */
  signOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  signOutLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#E53935',
  },

  /* Footer */
  footerVersion: {
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#9E9E9E',
  },
  footerSub: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#B0BEC5',
    marginTop: 2,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
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
    color: '#1A1A1A',
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
    borderColor: '#EFEFEF',
    backgroundColor: '#FAFAFA',
  },
  langOptionActive: {
    borderColor: '#22FF88',
    backgroundColor: '#E8F5E9',
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
    color: '#1A1A1A',
  },
  langSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#757575',
    marginTop: 1,
  },
});
