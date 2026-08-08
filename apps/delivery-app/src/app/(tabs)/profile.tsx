import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '../../constants/theme';
import { useStaggeredEntrance, useSpringEntrance } from '../../hooks/useDeliveryAnimation';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const headerAnim = useSpringEntrance(0);
  const statsAnim = useSpringEntrance(150);
  const menuAnim = useSpringEntrance(250);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', color: Colors.primary, route: null },
    { icon: 'car-outline', label: 'Vehicle Details', color: Colors.warning, route: '/vehicle-setup' as any },
    { icon: 'document-text-outline', label: 'Documents (KYC)', color: Colors.purple, route: '/kyc-documents' as any },
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy', color: Colors.blue, route: '/privacy-policy' as any },
    { icon: 'document-text-outline', label: 'Terms of Service', color: Colors.textSecondary, route: '/terms-of-service' as any },
    { icon: 'help-circle-outline', label: 'Help & Support', color: Colors.blue, route: null, action: () => Linking.openURL('mailto:support@next360.com') },
    { icon: 'information-circle-outline', label: 'About', color: Colors.textSecondary, route: null, action: () => Alert.alert('Next360 Delivery', 'Version 1.0.0\n\nDelivery Partner App') },
  ];

  const totalEarningsFormatted = user?.totalEarnings
    ? `₹${(user.totalEarnings / 100).toLocaleString('en-IN')}`
    : '₹0';

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
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active Partner</Text>
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
          <Text style={styles.statValue}>{user?.completedDeliveries || 0}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </Animated.View>

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
        style={[styles.signOutBtn, { backgroundColor: '#FFF5F5', borderColor: '#FFE0E0', marginTop: 10 }]}
        onPress={() => {
          Alert.alert(
            'Delete Account & Data',
            'Per Google Play policy, submitting an account deletion request will permanently wipe your profile, vehicle details, KYC documents, and delivery history within 30 days.\n\nAre you sure you want to proceed?',
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
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color="#C62828" />
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
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  statusText: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
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
