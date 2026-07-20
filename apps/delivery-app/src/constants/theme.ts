// 🎨 Next360 Delivery — Design Tokens
// Strict, premium palette. Speed-of-glance typography. No category theming.
// See CLAUDE.md: "Sans-only — reads faster at a glance."

export const Colors = {
  // Brand / Primary
  primary: '#0BAB7C',
  primaryLight: '#D1FAE5',
  primaryDark: '#059669',

  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  // Accent
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',

  // Neutrals
  white: '#FFFFFF',
  background: '#F0F2F5',
  surface: '#FFFFFF',
  border: '#E8EAED',
  borderLight: '#F1F3F5',

  // Text
  textPrimary: '#1A1D21',
  textSecondary: '#5F6770',
  textTertiary: '#9AA0A8',
  textInverse: '#FFFFFF',

  // Shadows
  shadow: '#000000',
} as const;

export const Typography = {
  display1: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  display2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
    fontFamily: 'monospace' as const,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// Spring configs for Reanimated (fast, responsive — feels tactile)
export const SpringConfig = {
  // Gentle, natural-feeling spring for card entrances
  gentle: { damping: 16, stiffness: 150, mass: 1 },
  // Snappy, responsive for button presses and toggles
  snappy: { damping: 12, stiffness: 200, mass: 0.8 },
  // Bouncy, playful for celebration moments
  bouncy: { damping: 8, stiffness: 180, mass: 0.7 },
} as const;

// Standard timing configs for Animated API
export const TimingConfig = {
  fast: { duration: 200 },
  normal: { duration: 350 },
  slow: { duration: 500 },
} as const;

// Reanimated shared spring config (used in useAnimatedStyle)
export const REANIMATED_SPRING_CONFIG = {
  damping: 14,
  stiffness: 180,
  mass: 0.9,
} as const;

export const TAB_BAR_HEIGHT = 72;
export const STATUS_BAR_HEIGHT = 48;
