import React from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

interface OnboardingSlideProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: 'hero' | 'feature';
}

export default function OnboardingSlide({
  title,
  description,
  icon,
  variant = 'feature'
}: OnboardingSlideProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (variant === 'hero') {
    return (
      <View style={styles.container}>
        <View style={styles.heroContent}>
          {/* Logo Anchor */}
          <Text style={styles.heroLogo}>Uccāra</Text>

          {/* Main Headline */}
          <Text style={styles.heroTitle}>
            Read Stotrams{'\n'}
            <Text style={{ color: theme.colors.accent.primary }}>the Right Way</Text>
          </Text>

          {/* Subtext */}
          <Text style={styles.heroDescription}>{description}</Text>
        </View>
      </View>
    );
  }

  // Feature Layout (Phone Frame)
  return (
    <View style={styles.container}>
      <View style={styles.featureContent}>
        {/* Phone Mockup Frame */}
        <View style={styles.phoneFrame}>
          <View style={styles.phoneNotch} />
          <View style={styles.phoneScreen}>
            {/* Placeholder for Screenshot - centered icon for now */}
            <View style={styles.screenshotPlaceholder}>
              {icon}
            </View>
          </View>
        </View>

        <View style={styles.textArea}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      width: width,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    // Hero Styles
    heroContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -60, // Visual adjustment
    },
    heroLogo: {
      fontFamily: theme.fontFamilies.primary.bold,
      fontSize: 24,
      color: theme.colors.text.primary,
      marginBottom: 60,
      textTransform: 'uppercase',
      letterSpacing: 2,
      opacity: 0.8,
    },
    heroTitle: {
      fontFamily: theme.fontFamilies.primary.bold,
      fontSize: 42,
      color: theme.colors.text.primary,
      textAlign: 'center',
      lineHeight: 52,
      marginBottom: 24,
    },
    heroDescription: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 18,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 28,
      maxWidth: 300,
    },

    // Feature Styles
    featureContent: {
      flex: 1,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 40,
    },
    phoneFrame: {
      width: 260,
      height: 400, // Roughly 16:9 ratio adjusted
      backgroundColor: theme.colors.background.cardSolid,
      borderRadius: 40,
      borderWidth: 8,
      borderColor: theme.colors.text.primary, // Frame color
      alignItems: 'center',
      overflow: 'hidden',
      marginBottom: 40,
      ...theme.shadows.lg,
    },
    phoneNotch: {
      width: 100,
      height: 24,
      backgroundColor: theme.colors.text.primary,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      zIndex: 10,
    },
    phoneScreen: {
      flex: 1,
      width: '100%',
      backgroundColor: theme.colors.background.page, // Simulate internal app bg
      justifyContent: 'center',
      alignItems: 'center',
    },
    screenshotPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.background.elevated, // Subtle bg for placeholder
      justifyContent: 'center',
      alignItems: 'center',
    },
    textArea: {
      alignItems: 'center',
    },
    title: {
      fontFamily: theme.fontFamilies.primary.bold,
      fontSize: 24,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: 12,
    },
    description: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 16,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    iconContainer: {
      // Legacy style kept just in case but likely unused now
      marginBottom: 32,
    }
  });
