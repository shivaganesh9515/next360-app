import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useDeliveryStore } from '../../store/deliveryStore';
import { deliveryApi } from '../../lib/api';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useSpringEntrance } from '../../hooks/useDeliveryAnimation';

const KYC_LOOKUP: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  APPROVED: { label: 'Approved', icon: 'shield-checkmark', color: Colors.primary, bg: Colors.primaryLight },
  PENDING: { label: 'Pending', icon: 'shield-outline', color: Colors.warning, bg: Colors.warningLight },
  REJECTED: { label: 'Rejected', icon: 'shield-half', color: Colors.danger, bg: Colors.dangerLight },
  VERIFIED: { label: 'Verified', icon: 'shield-checkmark', color: Colors.primary, bg: Colors.primaryLight },
  NOT_SUBMITTED: { label: 'Not Submitted', icon: 'shield-outline', color: Colors.textTertiary, bg: Colors.borderLight },
};

export default function ProfileScreen() {
  const { user, accountStatus, signOut } = useAuthStore();
  const { earnings, fetchEarnings } = useDeliveryStore();
  const [kycStatus, setKycStatus] = useState('NOT_SUBMITTED');
  const headerAnim = useSpringEntrance(0);
  const statsAnim = useSpringEntrance(150);
  const menuAnim = useSpringEntrance(250);

  useEffect(() => {
    fetchEarnings('all');
    deliveryApi.getKycStatus()
      .then((res: any) => setKycStatus(res?.status || res?.data?.status || 'NOT_SUBMITTED'))
      .catch((err) => {
        console.error('Fetch KYC status error:', err);
        setKycStatus('NOT_SUBMITTED');
      });
  }, []);

  const kyc = KYC_LOOKUP[kycStatus] ?? KYC_LOOKUP.NOT_SUBMITTED;

  const doSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Are you sure you want to sign out?')) {
        void doSignOut();
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void doSignOut() },
    ]);
  };

  const deleteAccountMessage =
    'Per Google Play policy, submitting an account deletion request will permanently wipe your profile, vehicle details, KYC documents, and delivery history within 30 days.\n\nAre you sure you want to proceed?';

  const doDeleteAccount = async () => {
    try {
      await deliveryApi.deleteAccount();
      await signOut();
      router.replace('/(auth)/login');
    } catch {
      Alert.alert(
        'Something went wrong',
        'We could not process your deletion request right now. Please contact support.'
      );
    }
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', color: Colors.primary, route: '/edit-profile' as any },
    { icon: 'car-outline', label: 'Vehicle Details', color: Colors.warning, route: '/vehicle-setup' as any },
    { icon: 'document-text-outline', label: 'Documents (KYC)', color: Colors.purple, route: '/kyc-documents' as any },
    { icon: 'notifications-outline', label: 'Notifications', color: Colors.primary, route: '/notifications' as any },
    { icon: 'help-circle-outline', label: 'Help & Support', color: Colors.blue, route: '/support' as any },
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy', color: Colors.blue, route: '/privacy-policy' as any },
    { icon: 'document-text-outline', label: 'Terms of Service', color: Colors.textSecondary, route: '/terms-of-service' as any },
    { icon: 'mail-outline', label: 'Email Us', color: Colors.textSecondary, route: null, action: () => Linking.openURL('mailto:support@next360.com') },
    { icon: 'information-circle-outline', label: 'About', color: Colors.textSecondary, route: null, action: () => Alert.alert('Next360 Delivery', 'Version 1.0.0\n\nDelivery Partner App') },
  ];

  // Real weekly earnings from the store (rupees — the backend returns rupees);
  // '—' until loaded, never a fabricated number.
  const weekEarningsText =
    earnings == null
      ? '—'
      : `₹${(earnings.thisWeek ?? 0).toLocaleString('en-IN')}`;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <Animated.View style={[styles.heroCard, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
        <View style={styles.heroGlow} />
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
          </View>
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={styles.name}>{user?.name || 'Delivery Partner'}</Text>
        <Text style={styles.phone}>{user?.phone || 'partner@next360.com'}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusPill, accountStatus === 'INACTIVE' && styles.statusPillInactive]}>
            <View style={[styles.statusDot, accountStatus === 'INACTIVE' && styles.statusDotInactive]} />
            <Text style={[styles.statusText, accountStatus === 'INACTIVE' && styles.statusTextInactive]}>
              {accountStatus === 'ACTIVE' && 'Active Partner'}
              {accountStatus === 'SETUP' && 'Setup Required'}
              {accountStatus === 'INACTIVE' && 'Account Inactive'}
              {accountStatus === 'UNKNOWN' && 'Status Unavailable'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View style={[styles.statsGrid, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{user?.completedDeliveries || 0}</Text>
          <Text style={styles.statLabel}>Deliveries</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="star" size={20} color={Colors.warning} />
          </View>
          <Text style={styles.statValue}>{user?.rating || '5.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.primaryLight }]}>
            <Ionicons name="cash" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{weekEarningsText}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </Animated.View>

      {/* KYC Status */}
      <Animated.View style={{ opacity: menuAnim, transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <TouchableOpacity
          style={styles.statusCard}
          onPress={() => router.push('/kyc-documents' as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: kyc.bg }]}>
            <Ionicons name={kyc.icon as any} size={20} color={kyc.color} />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleLabel}>KYC Verification</Text>
            <Text style={[styles.vehicleValue, { color: kyc.color }]}>{kyc.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Vehicle Info */}
      {user?.deliveryPartner?.vehicleType && (
        <Animated.View style={[styles.vehicleCard, { opacity: menuAnim, transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          <View style={[styles.menuIconWrap, { backgroundColor: Colors.warningLight }]}>
            <Ionicons name="car-outline" size={20} color={Colors.warning} />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleLabel}>Current Vehicle</Text>
            <Text style={styles.vehicleValue}>{user?.deliveryPartner?.vehicleType || '—'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </Animated.View>
      )}

      {/* Menu */}
      <Animated.View style={[styles.menuCard, { opacity: menuAnim, transform: [{ translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
        {menuItems.map((item, index) => {
          const isLast = index === menuItems.length - 1;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, !isLast && styles.menuBorder]}
              onPress={() => {
                if (item.route) router.push(item.route);
                else if (item.action) item.action();
              }}
              activeOpacity={0.6}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity
        style={[styles.signOutBtn, { backgroundColor: Colors.dangerLight, borderColor: 'rgba(239, 68, 68, 0.3)', marginTop: 10 }]}
        onPress={() => {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            if (window.confirm(`Delete Account & Data\n\n${deleteAccountMessage}`)) {
              void doDeleteAccount();
            }
            return;
          }
          Alert.alert('Delete Account & Data', deleteAccountMessage, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Request Deletion',
              style: 'destructive',
              onPress: () => void doDeleteAccount(),
            },
          ]);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color={Colors.danger} />
        <Text style={[styles.signOutText, { color: '#C62828' }]}>Delete Account & Data</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Next360 Delivery v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  // Hero
  heroCard: {
    backgroundColor: Colors.white, paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xxl,
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.borderLight, overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: -60, right: -40, width: 180, height: 180,
    borderRadius: 90, backgroundColor: Colors.primaryLight, opacity: 0.5,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.lg },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    ...Shadow.md,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: Colors.white },
  onlineIndicator: {
    position: 'absolute', bottom: 2, right: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: Colors.white,
  },
  name: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  phone: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  statusRow: { flexDirection: 'row', marginTop: Spacing.md },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryLight, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BorderRadius.pill, gap: 6,
  },
  statusPillInactive: { backgroundColor: Colors.dangerLight },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  statusDotInactive: { backgroundColor: Colors.danger },
  statusText: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  statusTextInactive: { color: Colors.danger },
  // Stats
  statsGrid: { flexDirection: 'row', padding: Spacing.lg, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', ...Shadow.sm,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  // Menu
  menuCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.lg, borderRadius: BorderRadius.lg, ...Shadow.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg, gap: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIconWrap: { width: 38, height: 38, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  // Vehicle info
  vehicleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm,
  },
  // KYC status
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, marginHorizontal: Spacing.lg, marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.lg, ...Shadow.sm,
  },
  vehicleInfo: { flex: 1 },
  vehicleLabel: { fontSize: 12, color: Colors.textTertiary, marginBottom: 2 },
  vehicleValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  // Sign out
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.dangerLight, marginHorizontal: Spacing.lg, marginTop: Spacing.xxl,
    borderRadius: BorderRadius.lg, paddingVertical: 15, gap: 8,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: Colors.danger },
  // Version
  version: { textAlign: 'center', color: Colors.textTertiary, fontSize: 12, marginTop: Spacing.xxl, marginBottom: 40 },
});
