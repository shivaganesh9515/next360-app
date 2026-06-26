export const Colors = {
  background: '#F7F3EA',
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
  organicLight: '#E8EDE3',
  natural: '#9B6A3F',
  naturalLight: '#F0E6DC',
  eco: '#2F5D62',
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
