import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Animated, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { setLanguage } from '../../i18n';

// ─── Section config ──────────────────────────────────────────────────────────
interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: string;
  tint?: string;
  onPress: () => void;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showLangModal, setShowLangModal] = React.useState(false);

  const currentLang = i18n.language === 'te' ? 'తెలుగు' : 'English';

  const handleLanguageChange = async (lang: 'en' | 'te') => {
    await setLanguage(lang);
    setShowLangModal(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  // ─── Menu sections ────────────────────────────────────────────────────────
  const sections: MenuSection[] = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline',  label: 'Edit Profile',   tint: Colors.organic, onPress: () => navigation.navigate('EditProfile') },
        { icon: 'receipt-outline', label: 'My Orders',      tint: Colors.natural, onPress: () => navigation.navigate('OrderHistory') },
        { icon: 'location-outline',label: 'My Addresses',   tint: '#3B82F6',      onPress: () => navigation.navigate('AddressList') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications',    tint: '#F59E0B', onPress: () => navigation.navigate('Notifications') },
        { icon: 'language-outline',      label: `Language`,         tint: '#8B5CF6', badge: currentLang, onPress: () => setShowLangModal(true) },
      ],
    },
    {
      title: 'Discover',
      items: [
        { icon: 'heart-outline',    label: 'Favourites',     tint: '#EF4444', onPress: () => navigation.navigate('Main', { screen: 'Favorites' }) },
        { icon: 'pricetag-outline', label: 'Offers & Coupons',tint: '#10B981', onPress: () => navigation.navigate('Promos') },
        { icon: 'help-circle-outline', label: 'Help & Support', tint: '#6B7280', onPress: () => navigation.navigate('Support') },
      ],
    },
  ];

  // Flatten menu items for staggered animations across all sections
  const allItems = sections.flatMap((s) => s.items);
  // Track which indices belong to which section for animation offset
  let itemCounter = 0;
  const sectionOffsetMap = sections.map((s) => {
    const start = itemCounter;
    itemCounter += s.items.length;
    return { start, count: s.items.length };
  });

  const staggerAnim = useRef(allItems.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    staggerAnim.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        tension: 80,
        delay: i * 60,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  // ─── Hero entrance ────────────────────────────────────────────────────────
  const heroAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(heroAnim, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Hero Section ────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: heroAnim,
              transform: [{ scale: heroAnim }],
            },
          ]}
        >
          {/* Avatar with decorative rings */}
          <View style={styles.avatarOuter}>
            <View style={styles.avatarRing1} />
            <View style={styles.avatarRing2}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
          </View>

          {/* User info */}
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userPhone}>
            {user?.phone ? `+91 ${user.phone}` : user?.email || ''}
          </Text>

          {/* Member badge */}
          <View style={styles.memberBadge}>
            <Ionicons name="leaf" size={12} color={Colors.organic} />
            <Text style={styles.memberBadgeText}>Next360 Member</Text>
          </View>
        </Animated.View>

        {/* ── Stats Row ───────────────────────────────────────────────────── */}
        <Animated.View style={[styles.statsRow, { opacity: heroAnim }]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Addresses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
        </Animated.View>

        {/* ── Menu Sections ───────────────────────────────────────────────── */}
        {sections.map((section, sectionIdx) => {
          const { start } = sectionOffsetMap[sectionIdx];
          return (
            <View key={section.title} style={styles.menuSection}>
              {section.title && (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              )}
              <View style={styles.menuCard}>
                {section.items.map((item, itemIdx) => {
                  const globalIdx = start + itemIdx;
                  return (
                    <Animated.View
                      key={item.label}
                      style={{
                        opacity: staggerAnim[globalIdx],
                        transform: [{
                          translateY: staggerAnim[globalIdx].interpolate({
                            inputRange: [0, 1],
                            outputRange: [16, 0],
                          }),
                        }],
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.menuItem,
                          itemIdx < section.items.length - 1 && styles.menuItemBorder,
                        ]}
                        onPress={item.onPress}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.menuIconWrap, { backgroundColor: (item.tint || Colors.organic) + '15' }]}>
                          <Ionicons name={item.icon} size={18} color={item.tint || Colors.organic} />
                        </View>
                        <Text style={styles.menuLabel}>{item.label}</Text>
                        <View style={styles.menuRight}>
                          {item.badge && (
                            <View style={styles.menuBadge}>
                              <Text style={styles.menuBadgeText}>{item.badge}</Text>
                            </View>
                          )}
                          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* ── Sign Out ─────────────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Next360 v1.0.0</Text>
      </ScrollView>

      {/* ── Language Modal ────────────────────────────────────────────────── */}
      <Modal visible={showLangModal} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowLangModal(false)}
          />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Language</Text>
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
                  <Text style={styles.langText}>English</Text>
                  <Text style={styles.langSub}>English</Text>
                </View>
              </View>
              {i18n.language === 'en' && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.organic} />
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
                  <Text style={styles.langText}>తెలుగు</Text>
                  <Text style={styles.langSub}>Telugu</Text>
                </View>
              </View>
              {i18n.language === 'te' && (
                <Ionicons name="checkmark-circle" size={22} color={Colors.organic} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  avatarOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  avatarRing1: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    borderColor: Colors.organicLight,
    opacity: 0.6,
  },
  avatarRing2: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: Colors.organic,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.organic,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 30,
    color: Colors.white,
    letterSpacing: -1,
  },
  userName: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  userPhone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.organicLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  memberBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.organic,
    letterSpacing: 0.3,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F3F4F6',
  },

  // Menu sections
  menuSection: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  menuBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textSecondary,
  },

  // Sign Out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 14,
    backgroundColor: '#FFF5F5',
  },
  signOutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: Spacing.xs,
  },

  // Language Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  langOptionActive: {
    borderColor: Colors.organicLight,
    backgroundColor: Colors.organicLight + '50',
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  langEmoji: {
    fontSize: 28,
  },
  langText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text,
  },
  langSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});
