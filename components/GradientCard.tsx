/**
 * GradientCard component for Uccara app
 * Reusable gradient wrapper for cards with configurable gradient presets
 */

import { ReactNode } from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../theme/ThemeContext';

type GradientPreset = 'card' | 'cardHover' | 'deity' | 'focus' | 'collection' | 'mantraCard';

interface GradientCardProps {
  children: ReactNode;
  preset?: GradientPreset;
  colors?: [string, string];
  style?: StyleProp<ViewStyle>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export default function GradientCard({
  children,
  preset = 'card',
  colors,
  style,
  start = { x: 0, y: 0 },
  end = { x: 0, y: 1 },
}: GradientCardProps) {
  const { theme } = useTheme();

  const gradientColors = colors || theme.colors.gradients[preset];

  return (
    <LinearGradient
      colors={gradientColors}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
