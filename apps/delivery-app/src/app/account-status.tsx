import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, type Href } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, BorderRadius, Shadow } from '../constants/theme';
import { useSpringEntrance } from '../hooks/useDeliveryAnimation';

const SUPPORT_EMAIL = 'support@next360.com';

interface StatusContent {
  icon: keyof typeof Ionicons.glyphMap;
  pillText: string;
  pillBg: string;
  pillColor: string;
  iconBg: string;
  iconColor: string;
  title: string;
  message: string;
  showContinue: boolean;
}

const STATUS_CONTENT: Record<string, StatusContent> = {
  ACTIVE: {
    icon: 'checkmark-circle',
    pillText: 'ACTIVE',
    pillBg: Colors.successLight,
    pillColor: Colors.primaryDark,
    iconBg: Colors.successLight,
    iconColor: Colors.primary,
    title: 'Your account is active',
    message:
      'Your account is in good standing. You can return to your delivery dashboard and continue operating.',
    showContinue: true,
  },
  INACTIVE: {
    icon: 'lock-closed',
    pillText: 'INACTIVE',
    pillBg: Colors.dangerLight,
    pillColor: Colors.danger,
    iconBg: Colors.dangerLight,
    iconColor: Colors.danger,
    title: 'Account not active',
    message:
      'Delivery operations are unavailable while your account is inactive. If you believe this is a mistake, contact support for assistance.',
    showContinue: false,
  },
  SETUP: {
    icon: 'construct-outline',
    pillText: 'SETUP REQUIRED',
    pillBg: Colors.warningLight,
    pillColor: Colors.warning,
    iconBg: Colors.warningLight,
    iconColor: Colors.warning,
    title: 'Profile setup incomplete',
    message:
      'Your delivery partner profile is not fully set up yet. Complete your onboarding to start accepting deliveries, or contact support if you need help.',
    showContinue: false,
  },
  UNKNOWN: {
    icon: 'help-circle',
    pillText: 'STATUS UNKNOWN',
    pillBg: Colors.blueLight,
    pillColor: Colors.blue,
    iconBg: Colors.blueLight,
    iconColor: Colors.blue,
    title: 'Account status unavailable',
    message:
      'We could not determine your account status right now. Please contact support and we will look into it.',
    showContinue: false,
  },
};

export default function AccountStatusScreen() {
  const { accountStatus, user, isLoading, signOut, getEntryRoute } = useAuthStore();
  const entrance = useSpringEntrance(0);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const content = STATUS_CONTENT[accountStatus] ?? STATUS_CONTENT['UNKNOWN'];

  const handleContinue = () => {
    router.replace(getEntryRoute() as Href);
  };

  const handleSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Account Status', headerShown: false }} />
      <View style={styles.container}>
        <Animated.View
          style={[styles.card, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logoSmall}>
              <Text style={styles.logoSmallText}>N</Text>
            </View>
            <View>
              <Text style={styles.brandName}>Next360</Text>
              <Text style={styles.brandTagline}>Delivery Partner</Text>
            </View>
          </View>

          {/* Status icon */}
          <View style={[styles.iconRing, { backgroundColor: content.iconBg }]}>
            <Ionicons name={content.icon} size={44} color={content.iconColor} />
          </View>

          {/* Status pill */}
          <View style={[styles.pill, { backgroundColor: content.pillBg }]}>
            <Text style={[styles.pillText, { color: content.pillColor }]}>{content.pillText}</Text>
          </View>

          <Text style={styles.title}>{content.title}</Text>

          {user?.name ? <Text style={styles.userName}>{user.name}</Text> : null}

          <Text style={styles.message}>{content.message}</Text>

          {/* Actions */}
          {content.showContinue && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.85}>
              <Ionicons name="arrow-forward" size={17} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Continue to Dashboard</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.supportButton} onPress={handleSupport} activeOpacity={0.7}>
            <Ionicons name="mail-outline" size={18} color={Colors.blue} />
            <View style={styles.supportTextWrap}>
              <Text style={styles.supportText}>Contact Support</Text>
              <Text style={styles.supportSubtext}>{SUPPORT_EMAIL}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadow.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.xxl,
  },
  logoSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoSmallText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  brandTagline: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    marginBottom: Spacing.lg,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 15,
    gap: 8,
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: Colors.blueLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    gap: 12,
    marginTop: Spacing.md,
  },
  supportTextWrap: {
    flex: 1,
  },
  supportText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.blue,
  },
  supportSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    gap: 8,
    alignSelf: 'stretch',
    marginTop: Spacing.md,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.danger,
  },
});