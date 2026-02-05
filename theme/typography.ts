/**
 * Typography tokens for Uccara mobile app
 */

export const fontFamilies = {
  // Primary font for UI text (Inter)
  primary: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  // Display font for headings (Crimson Pro)
  display: {
    medium: 'CrimsonPro_500Medium',
    semiBold: 'CrimsonPro_600SemiBold',
  },
  // Sanskrit/Devanagari text
  devanagari: {
    regular: 'NotoSansDevanagari_400Regular',
    medium: 'NotoSansDevanagari_500Medium',
    semiBold: 'NotoSansDevanagari_600SemiBold',
    bold: 'NotoSansDevanagari_700Bold',
  },
};

export const fontSizes = {
  // Display sizes
  display: 40,
  title: 32,
  heading: 26, // Slightly larger impact
  subheading: 20,

  // Body sizes
  bodyLarge: 18,
  body: 16,
  bodySmall: 14,

  // Caption/small
  caption: 12,
  tiny: 10,

  // Sanskrit-specific (larger for readability)
  sanskritLarge: 28,
  sanskrit: 24, // Optimized for mock
  sanskritMedium: 20,
  sanskritSmall: 18,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.6, // Relaxed for better reading flow
  sanskrit: 1.8, // Extra space for Devanagari
};

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
};

// Pre-composed text styles
export const textStyles = {
  displayTitle: {
    fontFamily: fontFamilies.primary.bold,
    fontWeight: '700' as const,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.tight,
  },
  title: {
    fontFamily: fontFamilies.primary.bold,
    fontWeight: '700' as const,
    fontSize: fontSizes.title,
    lineHeight: fontSizes.title * lineHeights.tight,
  },
  heading: {
    fontFamily: fontFamilies.primary.semiBold,
    fontWeight: '600' as const,
    fontSize: fontSizes.heading,
    lineHeight: fontSizes.heading * lineHeights.normal,
  },
  subheading: {
    fontFamily: fontFamilies.primary.semiBold,
    fontWeight: '600' as const,
    fontSize: fontSizes.subheading,
    lineHeight: fontSizes.subheading * lineHeights.normal,
  },
  bodyLarge: {
    fontFamily: fontFamilies.primary.regular,
    fontWeight: '400' as const,
    fontSize: fontSizes.bodyLarge,
    lineHeight: fontSizes.bodyLarge * lineHeights.relaxed,
  },
  body: {
    fontFamily: fontFamilies.primary.regular,
    fontWeight: '400' as const,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * lineHeights.relaxed,
  },
  bodyMedium: {
    fontFamily: fontFamilies.primary.medium,
    fontWeight: '500' as const,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * lineHeights.relaxed,
  },
  bodySemiBold: {
    fontFamily: fontFamilies.primary.semiBold,
    fontWeight: '600' as const,
    fontSize: fontSizes.body,
    lineHeight: fontSizes.body * lineHeights.relaxed,
  },
  caption: {
    fontFamily: fontFamilies.primary.regular,
    fontWeight: '400' as const,
    fontSize: fontSizes.caption,
    lineHeight: fontSizes.caption * lineHeights.normal,
  },

  // Sanskrit text styles
  sanskritLarge: {
    fontFamily: fontFamilies.devanagari.bold,
    fontSize: fontSizes.sanskritLarge,
    lineHeight: fontSizes.sanskritLarge * lineHeights.sanskrit,
  },
  sanskrit: {
    fontFamily: fontFamilies.devanagari.medium,
    fontSize: fontSizes.sanskrit,
    lineHeight: fontSizes.sanskrit * lineHeights.sanskrit,
  },
  sanskritSemiBold: {
    fontFamily: fontFamilies.devanagari.semiBold,
    fontSize: fontSizes.sanskrit,
    lineHeight: fontSizes.sanskrit * lineHeights.sanskrit,
  },
  sanskritSmall: {
    fontFamily: fontFamilies.devanagari.regular,
    fontSize: fontSizes.sanskritSmall,
    lineHeight: fontSizes.sanskritSmall * lineHeights.sanskrit,
  },
};
