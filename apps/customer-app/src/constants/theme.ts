import { Platform } from 'react-native';

export const Colors = {
  background: '#FFFFFF',
  text: '#1C1B17',
  textSecondary: '#6B6A63',
  brass: '#C9A66B',
  brassLight: '#E8D5B0',
  white: '#FFFFFF',
  black: '#000000',
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  border: '#E5E1D8',
  cardBorder: '#EDE9DF',

  // Store accents
  organic: '#5C6B4D',
  organicDark: '#3E4A34',
  organicLight: '#E8EDE3',
  natural: '#9B6A3F',
  naturalDark: '#6E4A2A',
  naturalLight: '#F0E6DC',
  eco: '#2F5D62',
  ecoDark: '#1E3E42',
  ecoLight: '#DCEBEC',

  // Status
  statusPending: '#F59E0B',
  statusConfirmed: '#3B82F6',
  statusPreparing: '#F97316',
  statusOutForDelivery: '#8B5CF6',
  statusDelivered: '#10B981',
  statusCancelled: '#EF4444',
  statusRefunded: '#6B7280',
};

export const getStoreAccent = (storeType: string) => {
  switch (storeType) {
    case 'ORGANIC': return Colors.organic;
    case 'NATURAL': return Colors.natural;
    case 'ECO_FRIENDLY': return Colors.eco;
    default: return Colors.organic;
  }
};

export const getStoreAccentLight = (storeType: string) => {
  switch (storeType) {
    case 'ORGANIC': return Colors.organicLight;
    case 'NATURAL': return Colors.naturalLight;
    case 'ECO_FRIENDLY': return Colors.ecoLight;
    default: return Colors.organicLight;
  }
};

// Darker stop for accent -> accentDark gradients (hero banners, active nav, buttons)
export const getStoreAccentDark = (storeType: string) => {
  switch (storeType) {
    case 'ORGANIC': return Colors.organicDark;
    case 'NATURAL': return Colors.naturalDark;
    case 'ECO_FRIENDLY': return Colors.ecoDark;
    default: return Colors.organicDark;
  }
};

// rgba(accent, 0.3) per CLAUDE.md "Design Tokens" — cardBorder swaps per category, everything else is fixed
export const getStoreCardBorder = (storeType: string) => {
  switch (storeType) {
    case 'ORGANIC': return 'rgba(92,107,77,0.3)';
    case 'NATURAL': return 'rgba(155,106,63,0.3)';
    case 'ECO_FRIENDLY': return 'rgba(47,93,98,0.3)';
    default: return 'rgba(92,107,77,0.3)';
  }
};

export const getStoreLabel = (storeType: string) => {
  switch (storeType) {
    case 'ORGANIC': return 'Organic';
    case 'NATURAL': return 'Natural';
    case 'ECO_FRIENDLY': return 'Eco-friendly';
    default: return storeType;
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

// House spring physics — every expand-in-place overlay (search dock, notifications,
// location popover) and any future one should use this exact feel so the app reads as
// one consistent motion language rather than several hand-tuned animations that are
// each subtly different. Pass to Animated.spring's config: { toValue, ...SPRING_CONFIG }.
export const SPRING_CONFIG = {
  friction: 11,
  tension: 80,
};

// Reanimated's withSpring uses damping/stiffness/mass, not the classic
// Animated API's friction/tension (SPRING_CONFIG above) — approximated to
// match the same house spring feel, for components animated on the UI thread
// via Reanimated (the four expand-in-place popovers: search dock,
// notifications, location, profile).
export const REANIMATED_SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.5,
};

// Soft, warm-tinted shadows (not pure black) — the depth cue that reads as "premium"
// rather than flat. Use `card` for product cards/tiles, `raised` for floating nav/sheets,
// `button` for primary CTAs so they visually lift off the page.
export const Shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0px 4px 12px rgba(58, 54, 38, 0.08)',
    },
    default: {
      shadowColor: '#3A3626',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  }),
  raised: Platform.select({
    web: {
      boxShadow: '0px 10px 24px rgba(42, 39, 24, 0.14)',
    },
    default: {
      shadowColor: '#2A2718',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 10,
    },
  }),
  button: (tint: string = '#3A3626') => Platform.select({
    web: {
      boxShadow: `0px 6px 12px ${tint}47`, // 0.28 opacity in hex is approx 47
    },
    default: {
      shadowColor: tint,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 6,
    },
  }),
};

export const Typography = {
  display: {
    fontFamily: 'Fraunces_700Bold' as const,
    fontSize: 28,
    lineHeight: 36,
  },
  h1: {
    fontFamily: 'Fraunces_700Bold' as const,
    fontSize: 24,
    lineHeight: 32,
  },
  h2: {
    fontFamily: 'Fraunces_700Bold' as const,
    fontSize: 20,
    lineHeight: 28,
  },
  h3: {
    fontFamily: 'Fraunces_700Bold' as const,
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Inter_400Regular' as const,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: 'Inter_400Regular' as const,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: 'Inter_400Regular' as const,
    fontSize: 11,
    lineHeight: 16,
  },
  button: {
    fontFamily: 'Inter_600SemiBold' as const,
    fontSize: 15,
    lineHeight: 20,
  },
  mono: {
    fontFamily: 'JetBrainsMono_400Regular' as const,
    fontSize: 13,
    lineHeight: 18,
  },
};
