/**
 * Theme system for Uccara mobile app
 * Exports all theme tokens and provides theming utilities
 */

export * from './colors';
export * from './typography';
export * from './spacing';

import { lightColors, darkColors, ColorTheme } from './colors';
import { fontFamilies, fontSizes, textStyles } from './typography';
import { spacing, borderRadius, shadows, animation } from './spacing';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: ColorTheme;
  typography: typeof textStyles;
  fontFamilies: typeof fontFamilies;
  fontSizes: typeof fontSizes;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  animation: typeof animation;
  isDark: boolean;
}

export const createTheme = (isDark: boolean): Theme => ({
  colors: isDark ? darkColors : lightColors,
  typography: textStyles,
  fontFamilies,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
  animation,
  isDark,
});

export const lightTheme = createTheme(false);
export const darkTheme = createTheme(true);
