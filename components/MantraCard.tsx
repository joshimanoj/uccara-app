/**
 * MantraCard component for Uccara app
 * Displays a mantra preview card with title, deity, and intro text
 */

import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../theme/ThemeContext';
import { Mantra } from '../lib/supabase';
import { ChevronRightIcon, BookmarkIcon } from './Icons';
import { useNetwork } from '../lib/NetworkContext';
import { Alert } from 'react-native';

interface MantraCardProps {
  mantra: Mantra;
  hideDeity?: boolean;
  isSaved?: boolean;
  onSaveToggle?: () => void;
}

export default function MantraCard({
  mantra,
  hideDeity = false,
  isSaved = false,
  onSaveToggle
}: MantraCardProps) {
  const { theme } = useTheme();
  const { isOffline } = useNetwork();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/mantra/${mantra.slug}`);
  };

  // Get first line of Devanagari for preview
  const devanagariPreview = mantra.intro_lines_devanagari
    ?.split('\n')[0]
    ?.slice(0, 60);

  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [
          styles.cardContent,
          pressed && styles.cardPressed,
        ]}
        onPress={handlePress}
      >
        <LinearGradient
          colors={theme.colors.gradients.mantraCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {mantra.title_primary}
            </Text>
            {!hideDeity && mantra.deity && (
              <View style={[styles.deityBadge, { backgroundColor: getDeityColor(Array.isArray(mantra.deity) ? mantra.deity[0] : mantra.deity, theme) }]}>
                <Text style={styles.deityText}>
                  {Array.isArray(mantra.deity) ? mantra.deity[0] : mantra.deity}
                </Text>
              </View>
            )}
          </View>

          {devanagariPreview && (
            <Text style={styles.sanskrit} numberOfLines={1}>
              {devanagariPreview}...
            </Text>
          )}
        </View>

        {!onSaveToggle && <ChevronRightIcon size={20} color={theme.colors.text.muted} />}
      </Pressable>

      {onSaveToggle && (
        <Pressable
          style={({ pressed }) => [
            styles.bookmarkButton,
            pressed && styles.cardPressed
          ]}
          onPress={() => {
            onSaveToggle();
          }}
        >
          <BookmarkIcon
            size={22}
            color={
              isSaved
                ? theme.colors.accent.primary
                : theme.colors.text.muted
            }
            filled={isSaved}
          />
        </Pressable>
      )}
    </View>
  );
}

function getDeityColor(deity: string | undefined | null, theme: any): string {
  if (!deity) {
    return theme.colors.background.elevated;
  }
  const deityLower = String(Array.isArray(deity) ? deity[0] : deity).toLowerCase();
  const deityColors = theme.colors.deity;

  if (deityColors[deityLower]) {
    return deityColors[deityLower].bg;
  }
  return theme.colors.accent.primary; // Fallback to primary
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.cardSolid,
      borderRadius: 24,
      overflow: 'hidden',
      ...theme.shadows.sm,
    },
    cardContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    cardPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    gradientOverlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 24,
    },
    content: {
      flex: 1,
      marginRight: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    title: {
      flex: 1,
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 18, // Larger as per mock
      color: theme.colors.text.primary,
    },
    deityBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    deityText: {
      fontFamily: theme.fontFamilies.primary.medium,
      fontSize: 12,
      color: '#FFFFFF',
    },
    sanskrit: {
      fontFamily: theme.fontFamilies.devanagari.medium,
      fontSize: 18,
      color: theme.colors.text.secondary,
      lineHeight: 28,
      marginTop: 8,
    },
    bookmarkButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background.elevated,
    },
  });
