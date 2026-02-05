/**
 * Spacing tokens for Uccara mobile app
 */

export const spacing = {
  // Base spacing scale (keep for utility usage)
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,

  // Layout Specs
  layout: {
    containerPadH: 20,
    containerPadTop: 16,
    containerPadBottom: 100,
    logoMb: 24,
    searchMb: 24,
    sectionMt: 12,
    sectionMb: 12,
    tabsMb: 16,
    deityGridMb: 24,
  },

  // component specific
  grid: {
    deityGap: 16,
    curatedGap: 16,
    tabGap: 12,
  },

  components: {
    search: { py: 12, px: 20, gap: 12 },
    tab: { py: 12, px: 20, gap: 12 },
    deityCard: { py: 16, px: 16, gap: 12 },
    curatedCard: { py: 15, px: 14 },
    bottomNav: { py: 8, px: 24, gap: 6 },
  },
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,

  // Component-specific
  card: 16,
  button: 12,
  badge: 12,
  input: 12,
  avatar: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
};
