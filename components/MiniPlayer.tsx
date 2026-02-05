/**
 * MiniPlayer component for Uccara app
 * Collapsed audio player bar shown above tab bar
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../theme/ThemeContext';
import { useAudio } from '../lib/AudioContext';
import {
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  RepeatOneIcon,
  LotusIcon,
  DownloadIcon,
} from './Icons';

const MINI_PLAYER_HEIGHT = 64;
const PROGRESS_HEIGHT = 2;

export default function MiniPlayer() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const {
    currentMantra,
    currentLines,
    currentLineIndex,
    isPlaying,
    isLooping,
    isPlayingOffline,
    position,
    duration,
    togglePlayPause,
    skipToNext,
  } = useAudio();

  // Don't show if no mantra is loaded
  if (!currentMantra) {
    return null;
  }

  // Hide on mantra detail screen (full player shown there)
  if (pathname.startsWith('/mantra/')) {
    return null;
  }

  const progress = duration > 0 ? position / duration : 0;
  const canSkipNext = currentLineIndex < currentLines.length - 1;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/mantra/${currentMantra.slug}`);
  };

  const handlePlayPause = async () => {
    await togglePlayPause();
  };

  const handleSkipNext = async () => {
    if (canSkipNext) {
      await skipToNext();
    }
  };

  const styles = createStyles(theme, insets);

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Pressable style={styles.content} onPress={handlePress}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LotusIcon size={24} color={theme.colors.accent.primary} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentMantra.title_primary}
          </Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>
              Line {currentLineIndex + 1} of {currentLines.length}
            </Text>
            {isPlayingOffline && (
              <View style={styles.offlineIndicator}>
                <DownloadIcon size={12} color={theme.colors.accent.primary} />
              </View>
            )}
            {isLooping && (
              <View style={styles.loopIndicator}>
                <RepeatOneIcon size={12} color={theme.colors.accent.primary} />
              </View>
            )}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable style={styles.controlButton} onPress={handlePlayPause}>
            {isPlaying ? (
              <PauseIcon size={24} color={theme.colors.text.primary} />
            ) : (
              <PlayIcon size={24} color={theme.colors.text.primary} />
            )}
          </Pressable>

          <Pressable
            style={[styles.controlButton, !canSkipNext && styles.controlButtonDisabled]}
            onPress={handleSkipNext}
            disabled={!canSkipNext}
          >
            <SkipForwardIcon size={20} color={theme.colors.text.primary} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: any, insets: any) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 49 + insets.bottom, // Above tab bar (49px is default tab bar height)
      left: 0,
      right: 0,
      height: MINI_PLAYER_HEIGHT,
      backgroundColor: theme.colors.background.cardSolid,
      borderTopWidth: 1,
      borderTopColor: theme.colors.ui.divider,
      ...theme.shadows.lg,
    },
    progressContainer: {
      height: PROGRESS_HEIGHT,
      backgroundColor: theme.colors.ui.divider,
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.accent.primary,
    },
    content: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 12,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: theme.colors.background.elevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    info: {
      flex: 1,
    },
    title: {
      fontFamily: theme.fontFamilies.primary.semiBold,
      fontSize: 15,
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    subtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    subtitle: {
      fontFamily: theme.fontFamilies.primary.regular,
      fontSize: 13,
      color: theme.colors.text.secondary,
    },
    loopIndicator: {
      padding: 2,
    },
    offlineIndicator: {
      padding: 2,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    controlButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlButtonDisabled: {
      opacity: 0.3,
    },
  });

export { MINI_PLAYER_HEIGHT };
